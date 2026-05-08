// --- 1. NAVIGATIE LOGICA ---
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- 2. SPRAAKCOACH LOGICA ---
const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    statusText.innerText = "Browser ondersteunt geen spraak.";
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.continuous = true;
    recognition.interimResults = false;

    let isListening = false;
    let isSpeaking = false;
    let silenceTimer;
    let verzameldeTekst = "";

    startBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            startBtn.innerText = "Start met meeluisteren";
            startBtn.classList.remove("is-listening");
            statusText.innerText = "Gestopt.";
        } else {
            recognition.start();
            startBtn.innerText = "Stop met meeluisteren";
            startBtn.classList.add("is-listening");
            statusText.innerText = "Ik luister mee...";
        }
        isListening = !isListening;
    });

    recognition.onresult = (event) => {
        if (isSpeaking) return;

        const current = event.resultIndex;
        let transcript = event.results[current][0].transcript.trim();

        if (transcript.length < 2) return;

        verzameldeTekst += transcript + ". ";
        appendMessage("Jullie: " + transcript, "user-message");

        clearTimeout(silenceTimer);

        // Wacht 7 seconden voor een reactie
        silenceTimer = setTimeout(() => {
            if (verzameldeTekst.trim() !== "") {
                vraagHulpAanAI(verzameldeTekst);
                verzameldeTekst = "";
            }
        }, 7000);
    };

    recognition.onend = () => {
        if (isListening && !isSpeaking) {
            recognition.start();
        }
    };

    async function vraagHulpAanAI(transcript) {
        statusText.innerText = "AI denkt na...";
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript })
            });

            const data = await response.json();
            
            appendMessage("AI Coach: " + data.reply, "ai-message");
            speak(data.reply);

        } catch (error) {
            console.error("Fout:", error);
            appendMessage("AI Coach: Oeps, verbinding weg.", "ai-message");
            statusText.innerText = "Gestopt.";
        }
    }

    function appendMessage(text, className) {
        const div = document.createElement('div');
        div.className = className;
        div.innerText = text; // Tip: als je ook visueel de sterretjes weg wilt in de chat, kun je hier text.replace(/[*#_]/g, "") doen!
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // We maken een lijstje aan om de ingebouwde stemmen van de browser in op te slaan
    let beschikbareStemmen = [];

    // Browsers laden stemmen soms wat vertraagd in, dit zorgt dat we ze vangen zodra ze klaar zijn
    window.speechSynthesis.onvoiceschanged = () => {
        beschikbareStemmen = window.speechSynthesis.getVoices();
    };

    function speak(text) {
        isSpeaking = true;
        recognition.stop(); // Microfoon uit tijdens praten
        
        // NIEUW: Maak de tekst schoon voordat hij wordt uitgesproken
        // Dit haalt alle sterretjes (*), hekjes (#) en lage streepjes (_) weg
        const schoneTekst = text.replace(/[*#_]/g, "");
        
        const utterance = new SpeechSynthesisUtterance(schoneTekst);
        utterance.lang = 'nl-NL';

        // 1. Maak haar vriendelijker: iets rustiger praten en een iets hogere, vrolijkere toon
        utterance.rate = 0.95; 
        utterance.pitch = 1.1; 

        // 2. Zoek alle Nederlandse stemmen op jouw computer
        const nlStemmen = beschikbareStemmen.filter(stem => stem.lang.includes('nl'));

        // 3. Probeer een mooie vrouwelijke/cloud stem te vinden
        let leraresStem = nlStemmen.find(stem => 
            stem.name.includes('Google') || 
            stem.name.includes('Colette') || 
            stem.name.includes('Claire') || 
            stem.name.includes('Fenna') ||  
            stem.name.includes('Female') || 
            stem.name.includes('Vrouw')
        );

        // Koppel de stem als we er een gevonden hebben
        if (leraresStem) {
            utterance.voice = leraresStem;
        } else if (nlStemmen.length > 0) {
            utterance.voice = nlStemmen[0];
        }

        utterance.onend = () => {
            isSpeaking = false;
            statusText.innerText = "Ik luister weer mee...";
            if (isListening) {
                recognition.start(); // Microfoon weer aan
            }
        };

        window.speechSynthesis.speak(utterance);
    }
}

// --- 3. CO-CREATIE MINDMAP LOGICA ---
const mindmapInput = document.getElementById('mindmapInput');
const addNodeBtn = document.getElementById('addNodeBtn');
const canvas = document.getElementById('mindmap-canvas');

let mindmapWoorden = [];
let laatsteAiZet = 0; // Hierin onthouden we hoe laat de AI voor het laatst een paars blokje plaatste
const COOLDOWN_TIJD = 3 * 60 * 1000; // 3 minuten (in milliseconden)

addNodeBtn.addEventListener('click', voegWoordToe);
mindmapInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') voegWoordToe();
});

async function voegWoordToe() {
    const nieuwWoord = mindmapInput.value.trim();
    if (!nieuwWoord) return;

    mindmapInput.value = ""; 
    mindmapWoorden.push(nieuwWoord);

    const bubbel = tekenBubbel(nieuwWoord, "⏳", "user-node");

    try {
        const response = await fetch('/api/mindmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ woord: nieuwWoord, alleWoorden: mindmapWoorden })
        });
        const data = await response.json();

        // 1. Update de bubbel van de gebruiker altijd met de AI emoji
        bubbel.innerHTML = `<span style="font-size: 24px;">${data.emoji}</span><br><b>${nieuwWoord}</b>`;

        // 2. Heeft de AI een eigen suggestie? Check dan eerst de klok!
        if (data.aiSuggestie && data.aiSuggestie.toLowerCase() !== "geen") {
            const nu = Date.now(); // Hoe laat is het nu?
            
            // Controleer of de 3 minuten voorbij zijn sinds de laatste keer
            if (nu - laatsteAiZet > COOLDOWN_TIJD) {
                setTimeout(() => {
                    mindmapWoorden.push(data.aiSuggestie);
                    tekenBubbel(data.aiSuggestie, "✨", "ai-node");
                    
                    laatsteAiZet = Date.now(); // Reset de klok nadat hij iets heeft geplaatst!
                }, 1500);
            } else {
                console.log("AI wilde iets toevoegen, maar moet nog even wachten op de cooldown.");
            }
        }

    } catch (error) {
        console.error("Mindmap fout:", error);
        bubbel.innerHTML = `<span style="font-size: 24px;">📝</span><br><b>${nieuwWoord}</b>`;
    }
}

function tekenBubbel(tekst, icoon, cssClass) {
    const node = document.createElement('div');
    node.className = `mindmap-node ${cssClass}`;
    
    node.style.padding = "15px 20px";
    node.style.borderRadius = "20px";
    node.style.textAlign = "center";
    node.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    node.style.transition = "transform 0.2s";
    node.style.minWidth = "100px";
    
    if (cssClass === "ai-node") {
        node.style.background = "linear-gradient(135deg, #4318FF, #868CFF)";
        node.style.color = "white";
        node.style.border = "2px dashed #FFF";
        node.style.animation = "pulseGlow 2s infinite";
    } else {
        node.style.background = "white";
        node.style.border = "2px solid #4318FF";
        node.style.color = "#2B3674";
    }

    node.innerHTML = `<span style="font-size: 24px;">${icoon}</span><br><b>${tekst}</b>`;
    canvas.appendChild(node);
    
    return node;
}