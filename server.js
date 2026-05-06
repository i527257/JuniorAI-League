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
            messages: [
                {
                    role: "system",
                    content: `Je bent een enthousiaste coach voor kinderen (9-15 jaar) in de Junior AI League. 
                    Jouw rol is om mee te luisteren en te helpen als ze vastlopen. 
                    Je mag de oplossing NOOIT voorzeggen. Stel alleen een inspirerende, korte vraag om ze aan het denken te zetten.
                    De casus van vandaag is: ${huidigeCasus}. 
                    Gebruik simpele, kindvriendelijke taal. Als het transcript rommelig is, probeer de context te begrijpen.`
                },
                {
                    role: "user",
                    content: transcript // Dit is wat de kinderen zojuist gezegd hebben
                }
            ],
            // Optioneel: Hier voeg je later de Function Calling (tools) voor Google Search toe
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