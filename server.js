require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- 1. ROUTE: AI ADVISEUR ---
app.post('/api/propose-layout', async (req, res) => {
    const { uitleg, leeftijd } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Je bent een enthousiaste coach voor de Junior AI League. De gebruiker is ${leeftijd} jaar oud. Pas je taalgebruik hierop aan. Geef 4 titels voor slides. Antwoord ALTIJD alleen in dit JSON-formaat: {"slides": [{"nr": 1, "titel": "..."}]}` 
                },
                { role: "user", content: `Onze oplossing is: ${uitleg}` }
            ],
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
        console.error("OpenAI Fout:", error);
        res.status(500).json({ error: "Fout bij de AI verbinding" });
    }
});

// --- 2. ROUTE: LIVE UNSPLASH PREVIEW (Veilig via de achterkant) ---
app.get('/api/unsplash-image', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).send('Keyword mist');

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1`, {
            headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
        });
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Stuur de browser direct door naar de officiële Unsplash fotolink
            res.redirect(data.results[0].urls.regular);
        } else {
            // Fallback als er niks gevonden wordt
            res.redirect('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'); 
        }
    } catch (err) {
        console.error("🚨 Unsplash API Fout:", err.message);
        res.status(500).send('Kon Unsplash afbeelding niet ophalen');
    }
});

// --- 3. ROUTE: POWERPOINT EXPORT ---
app.post('/api/export-pptx', async (req, res) => {
    const publicDir = path.join(__dirname, 'public');
    const { proposal, stijl } = req.body;

    console.log("📸 Unsplash links verzamelen voor de PowerPoint export...");

    // Loop door alle slides heen en verzamel eerst de echte Unsplash afbeeldings-URL's
    for (let slide of proposal) {
        if (slide.afbeelding && slide.afbeelding.trim() !== "") {
            try {
                const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(slide.afbeelding)}&per_page=1`, {
                    headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
                });
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    slide.img_url = data.results[0].urls.regular; // Plak de directe URL in de slide data
                }
            } catch (e) {
                console.error(`🚨 Kon Unsplash link voor slide ${slide.nr} niet ophalen:`, e.message);
            }
        }
    }

    // Start Python op en stuur de verrijkte data door
    const pythonProcess = spawn('python', ['-u', 'generator.py', publicDir]);
    
    let output = "";
    let errorOutput = "";
    
    pythonProcess.stdout.on('data', (data) => output += data.toString());
    pythonProcess.stderr.on('data', (data) => errorOutput += data.toString());
    
    pythonProcess.on('close', (code) => {
        if (code === 0 && output.trim().includes("presentatie.pptx")) {
            console.log("✅ PowerPoint succesvol gemaakt met echte Unsplash foto's!");
            res.json({ success: true, url: 'presentatie.pptx' });
        } else {
            console.error("❌ VERBORGEN PYTHON MELDING:\n", output);
            res.status(500).json({ success: false, error: output || errorOutput });
        }
    });

    pythonProcess.stdin.write(JSON.stringify({ proposal, stijl }));
    pythonProcess.stdin.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Junior AI League Server succesvol gestart!`);
    console.log(`🌍 Open je browser op: http://localhost:${PORT}`);
    console.log(`--------------------------------------------------`);
});