require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json()); // Om JSON data te kunnen lezen
app.use(express.static('public')); // Zorgt dat je index.html geladen wordt

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Hier kan je makkelijk de wekelijkse casus aanpassen!
const huidigeCasus = "Bedenk een oplossing voor de plastic soep in de oceaan.";

app.post('/api/chat', async (req, res) => {
    const { transcript } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7, // Dit maakt zijn antwoorden iets losser en minder robotisch
            messages: [
                {
                    role: "system",
                    content: `Je bent een gezellige, meedenkende coach voor kinderen (9-15 jaar) in de Junior AI League.
                    De casus van vandaag: ${huidigeCasus}.
                    
                    Jouw gedragsregels:
                    1. GEEF FEITEN & UITLEG: Als ze vragen hoe iets werkt (bijv. "hoe wordt plastic gemaakt?") leg het dan kort en simpel uit! Je mag feiten, geschiedenis en achtergrondinfo gewoon delen.
                    2. DEEL BRONNEN: Als ze om een bron vragen of als ze ergens over twijfelen, noem dan 1 of 2 echte, bekende websites (zoals WNF.nl, National Geographic, Milieudefensie of Wikipedia) waar ze het kunnen opzoeken. Zeg bijvoorbeeld: "Check de website van het WNF eens voor cijfers hierover!"
                    3. NIET DE EINDOPLOSSING VOORZEGGEN: Je mag ze helpen met informatie, maar het *uiteindelijke idee* om de casus op te lossen moeten ze zelf verzinnen.
                    4. STOP MET EINDELOZE VRAGEN: Val niet in herhaling. Als ze een goed idee hebben (zoals statiegeld of tassen hergebruiken), prijs ze dan gewoon! Zeg: "Geniaal idee, schrijf die zeker op!" Je hoeft niet altijd een nieuwe vraag terug te stellen. Laat ze daarna weer lekker zelf praten.
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
        console.error("Fout bij OpenAI:", error);
        res.status(500).json({ error: "Er ging iets mis bij het nadenken." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server draait op http://localhost:${PORT}`);
});