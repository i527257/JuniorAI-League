require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const Replicate = require('replicate');
const { spawn } = require('child_process'); // TOEGEVOEGD VOOR POWERPOINT
const path = require('path'); // TOEGEVOEGD VOOR POWERPOINT
 
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
 
// De casus van de week
const huidigeCasus = "Bedenk een oplossing voor zwerfafval in Tilburg en hoe je dit kan voorkomen. Denk aan de oorzaken, gevolgen en mogelijke oplossingen.";
 
// ==========================================
// 1. ROUTE VOOR DE SPRAAKCOACH (Coach Nova - Fase 1)
// ==========================================
app.post('/api/chat', async (req, res) => {
    const { transcript } = req.body;
 
    try {
      const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7, 
          messages: [
              {
                role: "system",
                content: `Je bent Coach Nova, een gezellige coach voor kinderen
(9-15 jaar) in de Junior AI League.
                De casus van vandaag is: ${huidigeCasus}.
                
                JOUW BELANGRIJKSTE REGEL VOOR FASE 1:
                Jullie gaan ALLEEN brainstormen over het PROBLEEM (de oorzaken en gevolgen). 
                Je mag absoluut NIET vragen naar een oplossing, een uitvinding of een idee. Dat doen ze pas later in Fase 2!
                
                Jouw gedragsregels:
                1. FOCUS OP HET PROBLEEM: Als ze een vraag stellen, geef kort antwoord en stel een wedervraag over de oorzaak of het gevolg (bijv. "Hoe denk je dat het in zee komt?" of "Welke dieren hebben daar last van?").
                2. VRAAG NOOIT NAAR OPLOSSINGEN: Gebruik nooit zinnen als "Hoe gaan we dit oplossen?" of "Wat is jullie idee?".
                3. GEEF FEITEN & DEEL BRONNEN: Leg dingen simpel uit en noem bekende websites (zoals WNF.nl) als ze ergens over twijfelen.
                4. STOP MET EINDELOZE VRAGEN: Stel maximaal 1 korte wedervraag per keer.
                5. GRENZEN BEWAKEN: Kap ongepaste grappen (geweld, etc.) vlot en luchtig af.`
                },
              {
                  role: "user",
                  content: transcript
              }
          ]
      });
 
      res.json({ reply: response.choices[0].message.content });
 
  } catch (error) {
      console.error("Fout bij OpenAI (Chat):", error);
      res.status(500).json({ error: "Er ging iets mis bij het nadenken." });
    }
});

// ==========================================
// 1.5 ROUTE VOOR COACH STORM (Fase 2)
// ==========================================
app.post('/api/chat-fase2', async (req, res) => {
    const { transcript, context } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7, 
            messages: [
                {
                    role: "system",
                    content: `Je bent Coach Storm, een stoere, nuchtere en behulpzame AI-expert voor kinderen (9-15 jaar) in de Junior AI League.
                    De casus is: ${huidigeCasus}.
                    
                    BELANGRIJK GEHEUGEN UIT FASE 1:
                    Hier is wat de kinderen en Coach Nova in de vorige fase hebben besproken:
                    "${context}"
                    
                    Jouw taak in Fase 2:
                    De kinderen moeten nu een concrete oplossing bedenken.
                    1. Bedenk NIET de oplossing voor ze.
                    2. Help ze door maximaal 1 of 2 scherpe, open vragen te stellen (bijv. "Hoe ga je dat aandrijven?" of "Welke materialen heb je daarvoor nodig?").
                    3. Gebruik spreektaal, wees bemoedigend en reageer kort op wat ze net zeiden.`
                },
                {
                    role: "user",
                    content: transcript
                }
            ]
        });

        res.json({ reply: response.choices[0].message.content });

    } catch (error) {
        console.error("Fout bij Storm:", error);
        res.status(500).json({ error: "Storm is even de weg kwijt." });
    }
});
 
// ==========================================
// 2. ROUTE VOOR DE MINDMAP
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
                {"emoji": "🌍", "aiSuggestie": "nieuw woord of 'geen'"}
                `
              }
          ]
      });
 
      res.json(JSON.parse(response.choices[0].message.content));
 
  } catch (error) {
      console.error("Fout bij OpenAI (Mindmap):", error);
      res.status(500).json({ error: "Kon geen mindmap data genereren." });
    }
});
 
// ==========================================
// 3. ROUTE VOOR DE FINALE GENERATOR (Liedje)
// ==========================================
app.post('/api/finale', async (req, res) => {
    const { idee, type } = req.body;
 
    let promptRegels = "";
 
  if (type === "liedje") {
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
                {
                role: "user",
                content: `Dit is onze oplossing: ${idee}`
                }
          ]
      });
 
      res.json({ resultaat: response.choices[0].message.content });
 
  } catch (error) {
      console.error("Fout bij OpenAI (Finale):", error);
      res.status(500).json({ error: "Er ging iets mis bij het maken van de tekst." });
  }
});
 
// ==========================================
// 4. ROUTE VOOR DE JURY SIMULATOR
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
                {
                role: "user",
                content: `Dit is onze oplossing die we gaan presenteren of onze pitch: ${idee}`
                }
          ]
      });
 
      res.json({ vragen: response.choices[0].message.content });
 
  } catch (error) {
      console.error("Fout bij OpenAI (Jury):", error);
      res.status(500).json({ error: "De jury is even pauze aan het houden." });
  }
});
 
// ==========================================
// 5. NIEUWE ROUTES VOOR POWERPOINT EXPORT (Fase 5)
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
        console.error("OpenAI Fout:", error);
        res.status(500).json({ error: "Fout bij de AI verbinding" });
    }
});

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

app.post('/api/export-pptx', async (req, res) => {
    const publicDir = path.join(__dirname, 'public');
    const { proposal, stijl } = req.body;

    console.log("📸 Unsplash links verzamelen voor de PowerPoint export...");

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
 
// ==========================================
// 6. ROUTE VOOR ECHTE MUZIEK GENERATIE (META MUSICGEN BEAT - 60 SECONDES)
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
 
        console.log("Instrumentale beat genereren via Meta MusicGen (dit duurt ca. 45 seconden)...");
        
        const Replicate = require("replicate");
        const replicate = new Replicate({
          auth: replicateToken,
      });
 
      const output = await replicate.run(
          "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3423a1f0b7d7",
          {
              input: {
                  prompt: `Upbeat, energetic pop and hip-hop instrumental beat, perfect for a presentation about: ${idee.substring(0, 100)}`,
                  duration: 60 
                }
            }
        );
 
        console.log("✅ Gelukt! Replicate stuurde data terug! Link uitpakken...");
 
        let uiteindelijkeAudioUrl = "";
        
        if (output && typeof output.url === 'function') {
           uiteindelijkeAudioUrl = output.url().href || output.url().toString();
        } else if (typeof output === "string") {
          uiteindelijkeAudioUrl = output; 
      } else if (Array.isArray(output)) {
          let eersteItem = output[0];
          if (eersteItem && typeof eersteItem.url === 'function') {
              uiteindelijkeAudioUrl = eersteItem.url().href || eersteItem.url().toString();
          } else {
              uiteindelijkeAudioUrl = eersteItem;
          }
      } else if (output && output.audio) {
          if (typeof output.audio.url === 'function') {
              uiteindelijkeAudioUrl = output.audio.url().href || output.audio.url().toString();
          } else {
               uiteindelijkeAudioUrl = output.audio; 
            }
        } else {
           uiteindelijkeAudioUrl = output; 
        }
 
        if (!uiteindelijkeAudioUrl || uiteindelijkeAudioUrl.toString().includes("ReadableStream")) {
            throw new Error("Geen geldige audio link gekregen.");
        }
 
        res.json({ lyrics: songtekst, audio_url: uiteindelijkeAudioUrl });
 
    } catch (error) {
      console.error("Fout bij Muziek API:", error);
      res.status(500).json({ error: "De studio is overbelast. Probeer het zo nog eens!" });
    }
});
 
// ==========================================
// 7. ROUTE VOOR PROTOTYPE CONCEPTEN (App/Game - Tekst)
// ==========================================
app.post('/api/prototype', async (req, res) => {
    const { idee, type } = req.body;
 
    let promptRegels = "";
 
  if (type === "app") {
      promptRegels = `Bedenk een concept voor een mobiele app of website. Geef de app een naam, beschrijf wat je op het startscherm ziet, en bedenk 3 handige knoppen of functies die de app moet hebben.`;
    } else if (type === "game") {
        promptRegels = `Bedenk een concept voor een bordspel of videogame. Bedenk een toffe titel, beschrijf in 2 zinnen het doel van het spel, en geef 3 simpele spelregels (bijv. hoe win of verlies je?).`;
    } else {
      return res.status(400).json({error: "Onbekend prototype type voor deze route."});
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
                {
                role: "user",
                content: `Dit is ons idee: ${idee}`
                }
          ]
      });
 
      res.json({ resultaat: response.choices[0].message.content });
 
  } catch (error) {
      console.error("Fout bij OpenAI (Prototype Tekst):", error);
      res.status(500).json({ error: "Er ging iets mis bij het bedenken van het concept." });
  }
});
 
// ==========================================
// 8. NIEUW: POSTER GENERATOR (VIA REPLICATE FLUX)
// ==========================================
app.post('/api/generate-image', async (req, res) => {
  const { idee } = req.body;
 
  try {
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      if (!replicateToken) return res.status(400).json({ error: "Replicate token ontbreekt." });
 
        console.log("1. ChatGPT bedenkt de prompt voor de poster...");
        // Stap 1: Prompt maken
        const p = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ 
              role: "system", 
              content: `Create a highly detailed, vibrant vector illustration prompt in English for a kid-friendly poster about: ${idee}. 
              Important: Do NOT include any text, words, or letters in the image. Reply ONLY with the prompt itself.` 
          }]
      });
 
      const prompt = p.choices[0].message.content;
 
      console.log("2. Afbeelding genereren via Replicate (Flux)...");
        // Stap 2: Afbeelding maken via Flux
      const Replicate = require("replicate");
      const replicate = new Replicate({ auth: replicateToken });
 
      const output = await replicate.run(
          "black-forest-labs/flux-schnell",
          { input: { prompt: prompt, aspect_ratio: "1:1", output_format: "png" } }
      );
 
        // 3. KOGELVRIJ UITPAKKEN VAN DE LINK
        let imageUrl = "";
        if (output && typeof output.url === 'function') {
          imageUrl = output.url().href || output.url().toString();
      } else if (Array.isArray(output)) {
          let eerste = output[0];
            if (eerste && typeof eerste.url === 'function') {
               imageUrl = eerste.url().href || eerste.url().toString();
            } else {
               imageUrl = eerste;
            }
        } else {
            imageUrl = output;
        }
 
        console.log("✅ Gelukt! Link naar poster:", imageUrl);
        res.json({ audio_url: imageUrl });
 
  } catch (e) {
        console.error("Fout bij genereren van afbeelding:", e);
        res.status(500).json({ error: "De AI-artiest is even overbelast. Probeer het zo nog eens!" });
    }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Dashboard draait op http://localhost:${PORT}`);
});