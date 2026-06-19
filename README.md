# 🚀 Junior AI League - Team Dashboard

Een interactief en kindvriendelijk AI-platform, speciaal gebouwd voor deelnemers van de **Junior AI League**. Dit dashboard begeleidt teams stap voor stap bij het bedenken, uitwerken en presenteren van oplossingen voor maatschappelijke problemen.

## ✨ Functionaliteiten

Het platform is verdeeld in vijf overzichtelijke fases, waarbij AI de kinderen op een speelse manier ondersteunt:

* **🧠 Fase 1: Probleem & Context**
  * **Live Spraakcoach:** Een spraakgestuurde AI die meeluistert via de microfoon, tips geeft en terugpraat (Voice-to-Text & Text-to-Speech).
  * **Mindmap Co-creator:** Een brainstorm-tool waarbij de AI meedenkt en automatisch emoji's en suggesties toevoegt.
* **💡 Fase 2: Oplossing Bedenken**
  * Tekstanalyse voor het aanscherpen van het bedachte concept via gerichte AI-feedback.
* **🎤 Fase 3: Finale & Presentatie**
  * **Finale Generator:** Zet een kort idee automatisch om in een pitch-script, een PowerPoint (.pptx) presentatie, of een AI-gegenereerde instrumentale beat (via MusicGen).
  * **Pitch Oefenen:** Leerlingen spreken hun pitch in, waarna de AI-jury feedback geeft op overtuigingskracht en inhoud.
  * **Jury Simulator:** Bedenkt drie kritische vragen die de echte jury zou kunnen stellen.
* **🛠️ Fase 4: Prototype Bouwen**
  * **Poster Ontwerpen:** Genereert direct een concept-affiche voor het idee (via het Flux AI afbeeldingsmodel).
  * **App / Game Concept:** Schrijft een gedetailleerd stappenplan of spelregels uit voor de gekozen oplossing.
* **📊 Fase 5: Presentatie Bouwen**
  * **Interactive Slide Builder:** Kinderen bouwen zelfstandig hun dia's op, passen lay-outs aan en kunnen dia's live sorteren via handige pijltjestoetsen (▲ / ▼).
  * **Live Thema Preview:** Direct visueel resultaat in de browser bij het schakelen tussen thema's (Modern, Futuristisch, Vrolijk of Zakelijk).
  * **Slimme Beeldzoeker:** Toont automatisch passende foto's bij dia-trefwoorden via een geautomatiseerde achtergrondvertaling.

---

## 🛠️ Gebruikte Technologieën

* **Frontend:** HTML5, CSS3 (Flexbox layout), Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **AI Modellen (Tekst & Logica):** OpenAI API (`gpt-4o-mini`)
* **AI Modellen (Beeld & Geluid):** Replicate API (`meta/musicgen` & `black-forest-labs/flux-schnell`)
* **Foto API:** Unsplash API
* **Extra Libraries:** `pptxgenjs` (voor frontend PowerPoint generatie), `dotenv`, `cors`.

---

## ⚙️ Installatie & Setup

Wil je dit project lokaal draaien? Volg dan deze stappen:

### 1. Vereisten
Zorg dat je het volgende hebt geïnstalleerd en klaargezet:
* [Node.js](https://nodejs.org/)
* Een werkende **OpenAI API Key**
* Een werkende **Replicate API Token**
* Een werkende **Unsplash Access Key**

### 2. Project klonen & installeren
```bash
git clone [https://github.com/jouw-gebruikersnaam/JuniorAI-League.git](https://github.com/jouw-gebruikersnaam/JuniorAI-League.git)
cd JuniorAI-League
npm install
pip install python-pptx
