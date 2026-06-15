require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { spawn } = require('child_process');
const path = require('path');
const Replicate = require('replicate');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// De centrale casus van het project
const huidigeCasus = "Bedenk een oplossing voor de plastic soep in de oceaan.";

// ==========================================
// 1. ROUTE: AI ADVISEUR (Fase 5 Sidebar)
// ==========================================
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
        console.error("OpenAI Fout (propose-layout):", error);
        res.status(500).json({ error: "Fout bij de AI verbinding" });
    }
});

// ==========================================
// 2. ROUTE: LIVE SPRAAKCOACH (Fase 1)
// ==========================================
app.post('/api/chat', async (req, res) => {
    const { transcript } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Je bent een gezellige, meedenkende coach voor kinderen (9-15 jaar) in de Junior AI League.
                    De casus van vandaag: ${huidigeCasus}.
                    
                    Jouw gedragsregels:
                    1. GEEF FEITEN & UITLEG: Leg feiten kort en simpel uit.
                    2. DEEL BRONNEN: Noem 1 of 2 echte, bekende websites (zoals WNF.nl) als ze ergens over twijfelen.
                    3. NIET DE EINDOPLOSSING VOORZEGGEN: Het idee moeten ze zelf verzinnen.
                    4. STOP MET EINDELOZE VRAGEN: Val niet in herhaling. Prijs goede ideeën!
                    5. GRENZEN BEWAKEN: Kap ongepaste grappen (geweld, etc.) vlot en luchtig af.`
                },
                { role: "user", content: transcript }
            ]
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI Fout (chat):", error);
        res.status(500).json({ error: "Fout bij de spraakcoach verbinding" });
    }
});

// ==========================================
// 3. ROUTE: CO-CREATIE MINDMAP (Fase 1)
// ==========================================
app.post('/api/mindmap', async (req, res) => {
    const { woord, alleWoorden } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }, 
            messages: [
                {
                    role: "system",
                    content: `Je bent een mindmap-assistent voor kinderen die brainstormen over: ${huidigeCasus}.
                    De kinderen hebben net het woord "${woord}" toegevoegd. De hele lijst tot nu toe is: ${alleWoorden.join(", ")}.
                    
                    Jouw taak:
                    1. Kies EEN perfecte, duidelijke Emoji die het woord "${woord}" visualiseert.
                    2. KIJK of er een heel belangrijk woord of invalshoek ontbreekt in hun lijst. 
                       - Zo ja, geef dan 1 sterk, kort nieuw woord terug als suggestie.
                       - Zo nee, geef dan exact het woord "geen" terug.
                    
                    Je MOET antwoorden in dit exacte JSON formaat:
                    {"emoji": "🌍", "aiSuggestie": "nieuw woord of 'geen'"}`
                }
            ]
        });
        res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
        console.error("OpenAI Fout (mindmap):", error);
        res.status(500).json({ error: "Fout bij de mindmap verwerking" });
    }
});

// ==========================================
// 4. ROUTE: LIVE UNSPLASH PREVIEW IMAGE PROXY
// ==========================================
app.get('/api/unsplash-image', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).send('Keyword mist');

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1`, {
            headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
        });
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            res.redirect(data.results[0].urls.regular);
        } else {
            res.redirect('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'); 
        }
    } catch (err) {
        console.error("🚨 Unsplash API Fout:", err.message);
        res.status(500).send('Kon Unsplash afbeelding niet ophalen');
    }
});

// ==========================================
// 5. ROUTE: FINALE GENERATOR (Pitch/Liedje)
// ==========================================
app.post('/api/finale', async (req, res) => {
    const { idee, type } = req.body;

    let promptRegels = "";
    if (type === "pitch") {
        promptRegels = `Schrijf een enthousiaste, overtuigende presentatie (pitch) van maximaal 1 minuut. Verdeel het duidelijk in: 1. Een pakkende opening. 2. De uitleg van het idee. 3. Een sterke afsluiting.`;
    } else {
        promptRegels = `Schrijf een kort, vrolijk en stoer liedje (bijvoorbeeld een rap of popnummer) over dit idee. Maak 2 coupletten en een catchy refrein dat makkelijk mee te zingen is. Gebruik rijm!`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.8, 
            messages: [
                {
                    role: "system",
                    content: `Je bent een creatieve tekstschrijver voor kinderen (9-15 jaar) in de Junior AI League. De casus is: ${huidigeCasus}. 
                    ${promptRegels} 
                    Zorg dat de tekst VOLLEDIG draait om het idee dat de kinderen aanleveren. Gebruik spreektaal en wees lekker enthousiast.`
                },
                { role: "user", content: `Dit is onze oplossing: ${idee}` }
            ]
        });
        res.json({ resultaat: response.choices[0].message.content });
    } catch (error) {
        console.error("Fout bij OpenAI (Finale):", error);
        res.status(500).json({ error: "Er ging iets mis bij het maken van de tekst." });
    }
});

// ==========================================
// 6. ROUTE: JURY SIMULATOR (Fase 3)
// ==========================================
app.post('/api/jury', async (req, res) => {
    const { idee } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content: `Je bent een kritische, maar eerlijke en opbouwende jury voor de Junior AI League (kinderen van 9-15 jaar). 
                    De casus is: ${huidigeCasus}.
                    Lees de oplossing van het team. Bedenk 3 scherpe, slimme vragen die je aan ze zou stellen om te kijken of ze goed over hun idee hebben nagedacht (denk aan haalbaarheid, kosten, of of mensen het wel gaan gebruiken).
                    Zet de 3 vragen in een overzichtelijk, genummerd lijstje en wees bemoedigend.`
                },
                { role: "user", content: `Dit is onze oplossing die we gaan presenteren of onze pitch: ${idee}` }
            ]
        });
        res.json({ vragen: response.choices[0].message.content });
    } catch (error) {
        console.error("Fout bij OpenAI (Jury):", error);
        res.status(500).json({ error: "De jury is even pauze aan het houden." });
    }
});

// ==========================================
// 7. ROUTE: POWERPOINT INHOUD GENERATOR
// ==========================================
app.post('/api/pptx-data', async (req, res) => {
    const { idee } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }, 
            messages: [
                {
                    role: "system",
                    content: `Je bent een expert in het maken presentaties voor kinderen. 
                    Maak een structuur voor een PowerPoint presentatie van 5 slides over dit idee: ${idee}.
                    Gegeef een JSON terug met een lijst genaamd 'slides'. 
                    Elke slide heeft een 'titel' en een lijst 'punten' (max 3 korte bullets per slide).
                    Slide 1: Titelpagina. Slide 2: Het Probleem. Slide 3: Onze Oplossing. Slide 4: Waarom AI? Slide 5: Afsluiting.`
                }
            ]
        });
        res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
        console.error("Fout bij PowerPoint AI:", error);
        res.status(500).json({ error: "Kon de presentatie nochtans niet voorbereiden." });
    }
});

// ==========================================
// 8. ROUTE: REPLICATE MUSICGEN AUDIO BEAT
// ==========================================
app.post('/api/muziek', async (req, res) => {
    const { idee } = req.body;
    try {
        const aiTekst = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.8,
            messages: [
                {
                    role: "system",
                    content: `Je bent een songwriter. Schrijf een hit (2 coupletten, 1 refrein) over dit idee: ${idee}. Gebruik moderne spreektaal.`
                }
            ]
        });
        const songtekst = aiTekst.choices[0].message.content;
        
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            return res.status(400).json({ error: "Oeps! Je moet eerst je Replicate API-Token in je .env bestand zetten." });
        }

        const replicate = new Replicate({ auth: replicateToken });
        const output = await replicate.run(
            "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3423a1f0b7d7",
            {
                input: {
                    prompt: `Upbeat, energetic pop and hip-hop instrumental beat, perfect for a presentation about: ${idee.substring(0, 100)}`,
                    duration: 60 
                }
            }
        );

        let uiteindelijkeAudioUrl = typeof output === "string" ? output : (output?.url ? output.url().toString() : output[0]);
        res.json({ lyrics: songtekst, audio_url: uiteindelijkeAudioUrl });
    } catch (error) {
        console.error("Fout bij Muziek API:", error);
        res.status(500).json({ error: "De studio is overbelast. Probeer het zo nog eens!" });
    }
});

// ==========================================
// 9. ROUTE: PROTOTYPE CONCEPTEN (App/Game Tekst)
// ==========================================
app.post('/api/prototype', async (req, res) => {
    const { idee, type } = req.body;
    let promptRegels = "";
    
    if (type === "app") {
        promptRegels = `Bedenk een concept voor een mobiele app of website. Geef de app een naam, beschrijf wat je op het startscherm ziet, en bedenk 3 handige knoppen of functies die de app moet hebben.`;
    } else if (type === "game") {
        promptRegels = `Bedenk een concept voor een bordspel of videogame. Bedenk een toffe titel, beschrijf in 2 zinnen het doel van het spel, en geef 3 simpele spelregels (bijv. hoe win of verlies je?).`;
    } else {
        promptRegels = `Bedenk een creatief concept voor een liedje of muzikaal prototype dat aansluit bij de hackathon.`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.8,
            messages: [
                {
                    role: "system",
                    content: `Je helpt kinderen (9-15 jaar) bij het bedenken van een tof prototype voor de Junior AI League. De casus is: ${huidigeCasus}. 
                    ${promptRegels}
                    Zorg dat de tekst helemaal draait om hun ingezonden idee. Wees lekker creatief en gebruik emoticons!`
                },
                { role: "user", content: `Dit is ons idee: ${idee}` }
            ]
        });
        res.json({ resultaat: response.choices[0].message.content });
    } catch (error) {
        console.error("Fout bij OpenAI (Prototype Tekst):", error);
        res.status(500).json({ error: "Er ging iets mis bij het bedenken van het concept." });
    }
});

// ==========================================
// 10. ROUTE: POSTER GENERATOR (VIA REPLICATE FLUX)
// ==========================================
app.post('/api/generate-image', async (req, res) => {
    const { idee } = req.body;
    try {
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) return res.status(400).json({ error: "Replicate token ontbreekt." });

        const p = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ 
                role: "system", 
                content: `Create a highly detailed, vibrant vector illustration prompt in English for a kid-friendly poster about: ${idee}. 
                Important: Do NOT include any text, words, or letters in the image. Reply ONLY with the prompt itself.` 
            }]
        });
        const prompt = p.choices[0].message.content;

        const replicate = new Replicate({ auth: replicateToken });
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            { input: { prompt: prompt, aspect_ratio: "1:1", output_format: "png" } }
        );

        let imageUrl = Array.isArray(output) ? output[0] : output;
        res.json({ audio_url: imageUrl });
    } catch (e) {
        console.error("Fout bij genereren van afbeelding:", e);
        res.status(500).json({ error: "De AI-artiest is overbelast." });
    }
});

// ==========================================
// 11. ROUTE: PYTHON POWERPOINT EXPORTER (`python-pptx`)
// ==========================================
app.post('/api/export-pptx', async (req, res) => {
    const publicDir = path.join(__dirname, 'public');
    const { proposal, stijl } = req.body;

    for (let slide of proposal) {
        if (slide.afbeelding && slide.afbeelding.trim() !== "") {
            try {
                const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(slide.afbeelding)}&per_page=1`, {
                    headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
                });
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    slide.img_url = data.results[0].urls.regular;
                }
            } catch (e) {
                console.error(`🚨 Kon Unsplash link voor slide ${slide.nr} niet ophalen:`, e.message);
            }
        }
    }

    const pythonProcess = spawn('python', ['-u', 'generator.py', publicDir]);
    let output = "";
    let errorOutput = "";
    
    pythonProcess.stdout.on('data', (data) => output += data.toString());
    pythonProcess.stderr.on('data', (data) => errorOutput += data.toString());
    
    pythonProcess.on('close', (code) => {
        if (code === 0 && output.trim().includes("presentatie.pptx")) {
            res.json({ success: true, url: 'presentatie.pptx' });
        } else {
            res.status(500).json({ success: false, error: output || errorOutput });
        }
    });

    pythonProcess.stdin.write(JSON.stringify({ proposal, stijl }));
    pythonProcess.stdin.end();
});

// SERVER STARTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Junior AI League Server succesvol gestart!`);
    console.log(`🌍 Open je browser op: http://localhost:${PORT}`);
    console.log(`--------------------------------------------------`);
});