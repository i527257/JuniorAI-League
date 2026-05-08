require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Pas hier wekelijks de casus aan!
const huidigeCasus = "Bedenk een oplossing voor de plastic soep in de oceaan.";

// --- 1. ROUTE VOOR DE SPRAAKCOACH ---
app.post('/api/chat', async (req, res) => {
    const { transcript } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7, 
            messages: [
                {
                    role: "system",
                    content: `Je bent een gezellige, meedenkende coach voor kinderen (9-15 jaar) in de Junior AI League.
                    De casus van vandaag: ${huidigeCasus}.
                    
                    Jouw gedragsregels:
                    1. GEEF FEITEN & UITLEG: Als ze vragen hoe iets werkt (bijv. "hoe wordt plastic gemaakt?") leg het dan kort en simpel uit! Je mag feiten, geschiedenis en achtergrondinfo gewoon delen.
                    2. DEEL BRONNEN: Als ze om een bron vragen of als ze ergens over twijfelen, noem dan 1 of 2 echte, bekende websites (zoals WNF.nl, National Geographic, Milieudefensie of Wikipedia) waar ze het kunnen opzoeken.
                    3. NIET DE EINDOPLOSSING VOORZEGGEN: Je mag ze helpen met informatie, maar het *uiteindelijke idee* om de casus op te lossen moeten ze zelf verzinnen.
                    4. STOP MET EINDELOZE VRAGEN: Val niet in herhaling. Als ze een goed idee hebben (zoals statiegeld of tassen hergebruiken), prijs ze dan gewoon! Zeg: "Geniaal idee, schrijf die zeker op!" Laat ze daarna weer lekker zelf praten.
                    5. GRENZEN BEWAKEN: Kinderen gaan je testen. Als ze grapjes maken over geweld, aanslagen, drugs of andere ongepaste dingen, wees dan niet te serieus, maar kap het vlot af. Bijv: "Haha, laten we de actiefilms even vergeten en weer focussen op de oceaan!"`
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

// --- 2. ROUTE VOOR DE MINDMAP ---
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
                    2. KIJK of er een heel belangrijk woord of invalshoek ontbreekt in hun lijst (denk aan kosten, regels, materialen, doelgroep). 
                       - Zo ja, geef dan 1 sterk, kort nieuw woord terug als suggestie.
                       - Zo nee (of als de lijst nog te kort is), geef dan exact het woord "geen" terug.
                    
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server draait op http://localhost:${PORT}`);
});