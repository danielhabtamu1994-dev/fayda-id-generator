const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const upload = multer();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/process-id', upload.fields([{ name: 'front' }, { name: 'back' }]), async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const images = [
            { inlineData: { data: req.files['front'][0].buffer.toString("base64"), mimeType: "image/jpeg" } },
            { inlineData: { data: req.files['back'][0].buffer.toString("base64"), mimeType: "image/jpeg" } }
        ];

        const prompt = `Extract info from this Ethiopian ID. Return ONLY a JSON object:
        {
          "data": {"name_amh": "...", "name_eng": "...", "id_number": "...", "address_amh": "...", "address_eng": "..."},
          "coords": {
            "photo": [ymin, xmin, ymax, xmax],
            "qr": [ymin, xmin, ymax, xmax]
          }
        }
        Note: Coordinates should be 0-1000 scale.`;

        const result = await model.generateContent([prompt, ...images]);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json|```/g, "");
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log('Backend running on port 5000'));
