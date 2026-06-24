// ==========================================
// 1. NAVIGATIE LOGICA
// ==========================================
function openTab(tabId) {
    if(typeof slaSlidesOp === 'function') slaSlidesOp(); // Auto-save bij wisselen van tab!
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabId === 'fase-presentatie' && typeof pasLiveStijlToe === 'function') {
        pasLiveStijlToe(); // Update live preview als je naar Fase 5 gaat
    }
}

// ==========================================
// 2. SPRAAKCOACH LOGICA (Fase 1)
// ==========================================
const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat');
const novaAvatar = document.getElementById('novaAvatar'); // AVATAR CONNECTIE

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
            statusText.innerText = "Status: Gestopt.";
        } else {
            recognition.start();
            startBtn.innerText = "Stop met meeluisteren";
            startBtn.classList.add("is-listening");
            statusText.innerText = "Status: Ik luister mee...";
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
        statusText.innerText = "Status: Coach Nova denkt na...";
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript })
            });

            const data = await response.json();
            
            appendMessage("Coach Nova: " + data.reply, "ai-message");
            fase1Notulen += "Team in Fase 1: " + transcript + " | Coach Nova antwoordde: " + data.reply + " | ";
            speak(data.reply); 

        } catch (error) {
            console.error("Fout:", error);
            appendMessage("Coach Nova: Oeps, verbinding weg.", "ai-message");
            statusText.innerText = "Status: Gestopt.";
        }
    }

    function appendMessage(text, className) {
        const div = document.createElement('div');
        div.className = className;
        div.innerText = text.replace(/[*#_]/g, ""); 
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    let beschikbareStemmen = [];

    window.speechSynthesis.onvoiceschanged = () => {
        beschikbareStemmen = window.speechSynthesis.getVoices();
    };

function speak(text) {
        isSpeaking = true;
        recognition.stop(); 
        
        // 1. ZET AVATAR OP PRATEN (ANIMATIE & GIF AAN)
        if (novaAvatar) {
            // Dit is een tijdelijke pratende GIF om te testen hoe het werkt!
            novaAvatar.src = "nova-praat.gif";
            novaAvatar.classList.add("talking");
        }
        
        const schoneTekst = text.replace(/[*#_]/g, "");
        const utterance = new SpeechSynthesisUtterance(schoneTekst);
        utterance.lang = 'nl-NL';
        utterance.rate = 0.95; 
        utterance.pitch = 1.1; 

        const nlStemmen = beschikbareStemmen.filter(stem => stem.lang.includes('nl'));
        let leraresStem = nlStemmen.find(stem => 
            stem.name.includes('Google') || 
            stem.name.includes('Colette') || 
            stem.name.includes('Claire') || 
            stem.name.includes('Fenna') ||  
            stem.name.includes('Female') || 
            stem.name.includes('Vrouw')
        );

        if (leraresStem) {
            utterance.voice = leraresStem;
        } else if (nlStemmen.length > 0) {
            utterance.voice = nlStemmen[0];
        }

        utterance.onend = () => {
            isSpeaking = false;
            statusText.innerText = "Status: Ik luister weer mee...";
            
            // 2. ZET AVATAR TERUG NAAR STIL (GIF UIT)
            if (novaAvatar) {
                // Dit is de stilstaande Coach Nova
                novaAvatar.src = "nova-praat.png"; 
                novaAvatar.classList.remove("talking");
            }

            if (isListening) {
                recognition.start(); 
            }
        };

        window.speechSynthesis.speak(utterance);
    }
}


// ==========================================
// 2.5 HET GEHEUGEN & COACH STORM (Fase 2)
// ==========================================
let fase1Notulen = ""; // Dit is het onzichtbare notitieblokje!

const startStormBtn = document.getElementById('startStormBtn');
const stormStatusText = document.getElementById('stormStatus');
const stormChatBox = document.getElementById('stormChat');
const stormAvatar = document.getElementById('stormAvatar');

if (SpeechRecognition && startStormBtn) {
    const stormRecognition = new SpeechRecognition();
    stormRecognition.lang = 'nl-NL';
    stormRecognition.continuous = true;
    stormRecognition.interimResults = false;

    let stormIsListening = false;
    let stormIsSpeaking = false;
    let stormSilenceTimer;
    let stormVerzameldeTekst = "";

    startStormBtn.addEventListener('click', () => {
        if (stormIsListening) {
            stormRecognition.stop();
            startStormBtn.innerText = "Overleg met Storm";
            startStormBtn.classList.remove("is-listening");
            stormStatusText.innerText = "Status: Gestopt.";
        } else {
            stormRecognition.start();
            startStormBtn.innerText = "Stop met luisteren";
            startStormBtn.classList.add("is-listening");
            stormStatusText.innerText = "Status: Storm luistert...";
        }
        stormIsListening = !stormIsListening;
    });

    stormRecognition.onresult = (event) => {
        if (stormIsSpeaking) return;

        const current = event.resultIndex;
        let transcript = event.results[current][0].transcript.trim();

        if (transcript.length < 2) return;

        stormVerzameldeTekst += transcript + ". ";
        appendStormMessage("Jullie: " + transcript, "user-message");

        // Voeg het ook toe aan de notulen
        fase1Notulen += "Fase 2 Team: " + transcript + " | ";

        clearTimeout(stormSilenceTimer);
        stormSilenceTimer = setTimeout(() => {
            if (stormVerzameldeTekst.trim() !== "") {
                vraagStormAanAI(stormVerzameldeTekst);
                stormVerzameldeTekst = "";
            }
        }, 7000);
    };

    stormRecognition.onend = () => {
        if (stormIsListening && !stormIsSpeaking) stormRecognition.start();
    };

    async function vraagStormAanAI(transcript) {
        stormStatusText.innerText = "Status: Storm overdenkt dit...";
        
        try {
            const response = await fetch('/api/chat-fase2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    transcript: transcript,
                    context: fase1Notulen // We sturen ALLES wat is gezegd stiekem mee!
                })
            });

            const data = await response.json();
            
            fase1Notulen += "Storm: " + data.reply + " | ";
            appendStormMessage("Coach Storm: " + data.reply, "ai-message");
            speakStorm(data.reply); 

        } catch (error) {
            console.error("Fout:", error);
            stormStatusText.innerText = "Status: Gestopt.";
        }
    }

    function appendStormMessage(text, className) {
        const div = document.createElement('div');
        div.className = className;
        div.innerText = text.replace(/[*#_]/g, ""); 
        // We veranderen de AI kleur naar Storm's kleur (oranje/rood)
        if (className === "ai-message") div.style.background = "#FF5733"; 
        stormChatBox.appendChild(div);
        stormChatBox.scrollTop = stormChatBox.scrollHeight;
    }

    function speakStorm(text) {
        stormIsSpeaking = true;
        stormRecognition.stop(); 
        
        if (stormAvatar) {
            stormAvatar.src = "storm-praat.gif"; // De nieuwe animatie!
            stormAvatar.classList.add("talking");
        }
        
        const schoneTekst = text.replace(/[*#_]/g, "");
        const utterance = new SpeechSynthesisUtterance(schoneTekst);
        utterance.lang = 'nl-NL';
        utterance.rate = 0.95; 
        utterance.pitch = 0.6; // We maken de stem zwaarder door de pitch omlaag te halen!

        const nlStemmen = window.speechSynthesis.getVoices().filter(stem => stem.lang.includes('nl'));
        
        // We zoeken specifiek naar een mannelijke stem
        let manStem = nlStemmen.find(stem => 
            stem.name.includes('Maarten') || 
            stem.name.includes('Willem') || 
            stem.name.includes('Bart') || 
            stem.name.includes('Male') || 
            stem.name.includes('Man')
        );

        if (manStem) utterance.voice = manStem;
        else if (nlStemmen.length > 0) utterance.voice = nlStemmen[0];

        utterance.onend = () => {
            stormIsSpeaking = false;
            stormStatusText.innerText = "Status: Storm luistert...";
            
            if (stormAvatar) {
                stormAvatar.src = "storm-stil.png"; 
                stormAvatar.classList.remove("talking");
            }
            if (stormIsListening) stormRecognition.start(); 
        };

        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 3. CO-CREATIE MINDMAP LOGICA (Fase 1)
// ==========================================
const mindmapInput = document.getElementById('mindmapInput');
const addNodeBtn = document.getElementById('addNodeBtn');
const canvas = document.getElementById('mindmap-canvas');

let mindmapWoorden = [];
let laatsteAiZet = 0; 
const COOLDOWN_TIJD = 3 * 60 * 1000; 

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

        bubbel.innerHTML = `<span style="font-size: 24px;">${data.emoji}</span><br><b>${nieuwWoord}</b>`;

        if (data.aiSuggestie && data.aiSuggestie.toLowerCase() !== "geen") {
            const nu = Date.now(); 
            
            if (nu - laatsteAiZet > COOLDOWN_TIJD) {
                setTimeout(() => {
                    mindmapWoorden.push(data.aiSuggestie);
                    tekenBubbel(data.aiSuggestie, "✨", "ai-node");
                    
                    laatsteAiZet = Date.now(); 
                }, 1500);
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

// ==========================================
// 4. FINALE: JURY (Fase 3)
// ==========================================
const finaleInput = document.getElementById('finaleInput');
const genJuryBtn = document.getElementById('genJuryBtn');
const finaleOutput = document.getElementById('finaleOutput');

// JURY
genJuryBtn.addEventListener('click', async () => {
    const idee = finaleInput.value.trim();
    if (!idee) return alert("Typ eerst jullie idee in het vak hierboven!");

    finaleOutput.style.display = "block";
    finaleOutput.innerHTML = "<i>De jury is jullie plan aan het lezen en overlegt even... 🧐</i>";

    try {
        const response = await fetch('/api/jury', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee })
        });
        
        const data = await response.json();
        if (data.error) finaleOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
        else finaleOutput.innerHTML = data.vragen.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    } catch (error) {
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, verbinding weg.</b>`;
    }
});

// ==========================================
// 5. FINALE: DE MUZIEK GENERATOR 
// ==========================================
const genSongBtn = document.getElementById('genSongBtn');

genSongBtn.addEventListener('click', async () => {
    const idee = finaleInput.value.trim();
    if (!idee) return alert("Typ eerst jullie fantastische idee in het vakje!");

    finaleOutput.style.display = "block";
    finaleOutput.innerHTML = "<i>De studio is bezig... Het componeren van de muziek duurt soms eventjes! 🎧🎶</i>";

    try {
        const response = await fetch('/api/muziek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee })
        });
        
        const data = await response.json();
        
        if (data.error) {
            finaleOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
        } else {
            let opgemaakteTekst = data.lyrics.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            
            finaleOutput.innerHTML = `
                <div style="margin-bottom: 20px; padding: 15px; background: #E2E8F0; border-radius: 10px; text-align: center;">
                    <h3 style="margin-top: 0;">🎵 Jullie AI Track is klaar!</h3>
                    <audio controls style="width: 100%;" src="${data.audio_url}"></audio>
                </div>
                <div style="white-space: pre-wrap;">${opgemaakteTekst}</div>
            `;
        }
    } catch (error) {
        console.error("Muziek fout:", error);
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, de studio had even storing! Probeer het nog eens.</b>`;
    }
});

// ==========================================
// 7. PITCH OEFENEN LOGICA 
// ==========================================
const oefenPitchBtn = document.getElementById('oefenPitchBtn');

if (oefenPitchBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let pitchRecognition;
    let isPitchRecording = false;
    let verzameldePitchTekst = "";

    if (SpeechRecognition) {
        pitchRecognition = new SpeechRecognition();
        pitchRecognition.lang = 'nl-NL';
        pitchRecognition.continuous = true; 
        pitchRecognition.interimResults = false;

        pitchRecognition.onstart = () => {
            finaleOutput.style.display = "block";
            finaleOutput.innerHTML = "<i>🎙️ Microfoon staat aan! Spreek je pitch in... (Klik op 'Stop & Beoordeel' als je helemaal klaar bent)</i>";
        };

        pitchRecognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            verzameldePitchTekst += transcript + " ";
            
            finaleOutput.innerHTML = `
                <i>🎙️ Microfoon staat aan! Spreek je pitch in... (Klik op 'Stop & Beoordeel' als je helemaal klaar bent)</i><br><br>
                <b>Jouw pitch tot nu toe:</b> "${verzameldePitchTekst}"
            `;
        };

        pitchRecognition.onerror = (event) => {
            console.error("Spraakfout:", event.error);
            if (event.error !== 'no-speech') {
                finaleOutput.innerHTML = `<b style="color: red;">Er ging iets mis met de microfoon (${event.error}).</b>`;
            }
        };
    }

    oefenPitchBtn.addEventListener('click', async () => {
        if (!SpeechRecognition) {
            return alert("Je browser ondersteunt helaas geen spraakherkenning. Probeer Google Chrome!");
        }

        if (!isPitchRecording) {
            isPitchRecording = true;
            verzameldePitchTekst = "";
            oefenPitchBtn.innerText = "⏹️ Stop & Beoordeel";
            oefenPitchBtn.style.backgroundColor = "#ff4d4d"; 
            oefenPitchBtn.style.color = "white";
            pitchRecognition.start();
        } else {
            isPitchRecording = false;
            pitchRecognition.stop();
            oefenPitchBtn.innerText = "🗣️ Oefen Pitch";
            oefenPitchBtn.style.backgroundColor = ""; 
            oefenPitchBtn.style.color = "";

            if (verzameldePitchTekst.trim().length < 5) {
                finaleOutput.innerHTML = `<i>Je was te stil of de pitch was te kort. Probeer het nog eens!</i>`;
                return;
            }

            finaleOutput.innerHTML = `
                <p><b>Jouw volledige pitch:</b> "${verzameldePitchTekst}"</p>
                <i>AI Jury is je pitch aan het analyseren... 🧐</i>
            `;

            try {
                const response = await fetch('/api/jury', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        idee: `Hier is een letterlijk uitgeschreven pitch van een deelnemer voor de Junior AI League. 
                        Beoordeel de pitch kort en opbouwend op 2 onderdelen:
                        1. INHOUD: Is het idee helder en sterk beargumenteerd?
                        2. OVERTUIGING & ENTHOUSIASME: Bevat de tekst actieve en vlotte zinnen? Geef ze daarnaast altijd 1 praktische presentatietip mee over hun stemgebruik, enthousiasme of lichaamshouding (bijv: "Vergeet niet de jury aan te kijken!").
                        
                        De pitch tekst: "${verzameldePitchTekst}"` 
                    })
                });
                
                const data = await response.json();
                
                finaleOutput.innerHTML = `
                    <p><b>Jouw volledige pitch:</b> "${verzameldePitchTekst}"</p>
                    <hr>
                    <h3>Jouw Pitch Feedback:</h3>
                    ${data.vragen.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
                `;
            } catch (error) {
                finaleOutput.innerHTML = `<b style="color: red;">Oeps, verbinding weg met de jury! Probeer het opnieuw.</b>`;
            }
        }
    });
}

// ==========================================
// 8. PROTOTYPE BOUWEN LOGICA (Fase 4)
// ==========================================
const prototypeInput = document.getElementById('prototypeInput');
const protoPosterBtn = document.getElementById('protoPosterBtn');
const protoAppBtn = document.getElementById('protoAppBtn');
const protoGameBtn = document.getElementById('protoGameBtn');
const prototypeOutput = document.getElementById('prototypeOutput');

function getIdeeInvoer() {
    let idee = prototypeInput.value.trim();
    if (!idee) {
        const finaleInvoer = document.getElementById('finaleInput');
        if (finaleInvoer) idee = finaleInvoer.value.trim();
    }
    return idee;
}

if (protoPosterBtn) {
    protoPosterBtn.addEventListener('click', async () => {
        const idee = getIdeeInvoer();
        if (!idee) return alert("Typ eerst jullie fantastische idee in het vakje, of vul iets in bij Fase 3!");

        prototypeOutput.style.display = "block";
        prototypeOutput.innerHTML = "<i>AI-artiest is de verf aan het mengen en schildert jullie affiche... Dit duurt ongeveer 10 seconden. 🎨🖌️⏳</i>";

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idee: idee })
            });
            
            const data = await response.json();
            
            if (data.error) {
                prototypeOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
            } else {
                prototypeOutput.innerHTML = `
                    <h3>🎨 Jullie AI Affiche Concept:</h3>
                    <img src="${data.audio_url}" alt="AI Gegenereerde Poster" style="max-width: 100%; height: auto; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-top: 10px;">
                    <p style="font-size: 14px; color: #666; margin-top: 10px;"><i>Dit is een concept. Jullie kunnen dit als inspiratie gebruiken voor jullie eigen poster!</i></p>
                `;
            }
        } catch (error) {
            console.error("Poster fout:", error);
            prototypeOutput.innerHTML = `<b style="color: red;">Oeps, de AI-artiest heeft even pauze. Probeer het nog eens.</b>`;
        }
    });
}

async function genereerTekstPrototype(type) {
    const idee = getIdeeInvoer();
    if (!idee) return alert("Typ eerst jullie fantastische idee in het vakje, of vul iets in bij Fase 3!");

    prototypeOutput.style.display = "block";
    prototypeOutput.innerHTML = "<i>AI bedenkt een meesterplan voor jullie prototype... 🛠️⏳</i>";

    try {
        const response = await fetch('/api/prototype', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee, type: type })
        });
        
        const data = await response.json();
        if (data.error) prototypeOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
        else prototypeOutput.innerHTML = data.resultaat.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    } catch (error) {
        prototypeOutput.innerHTML = `<b style="color: red;">Oeps, de verbinding is even weg! Probeer het nog eens.</b>`;
    }
}

if (protoAppBtn) protoAppBtn.addEventListener('click', () => genereerTekstPrototype('app'));
if (protoGameBtn) protoGameBtn.addEventListener('click', () => genereerTekstPrototype('game'));


// ==========================================
// 9. NIEUW: POWERPOINT BUILDER & EXPORT LOGICA (Fase 5)
// ==========================================

let slideCount = 0;

function updateSlideNummers() {
    const nummers = document.querySelectorAll('.slide-number');
    nummers.forEach((num, idx) => {
        num.innerText = `SLIDE ${idx + 1}`;
    });
    slideCount = nummers.length;
}

function pasLiveStijlToe() {
    const stijlSelector = document.getElementById('presentation-style');
    if (!stijlSelector) return;
    
    const gekozenStijl = stijlSelector.value;
    const slides = document.querySelectorAll('.slide-item');

    const stijlen = {
        futuristic: { bg: "#0c0e24", kaart: "#141838", rand: "#ff0080", titel: "#00ffcc", tekst: "#f0f0ff" },
        playful: { bg: "#f0f8ff", kaart: "#ff5e00", rand: "#282828", titel: "#ffffff", tekst: "#282828" },
        professional: { bg: "#1f2937", kaart: "#f4f5f7", rand: "#0066cc", titel: "#ffffff", tekst: "#1e293b" },
        modern: { bg: "#ffffff", kaart: "#ffffff", rand: "#9435b1", titel: "#141414", tekst: "#3c3c3c" }
    };

    const config = stijlen[gekozenStijl] || stijlen.modern;

    slides.forEach(slide => {
        const layoutSelect = slide.querySelector('.slide-layout-select');
        const gekozenLayout = layoutSelect ? layoutSelect.value : 'content';
        const titelInput = slide.querySelector('.slide-title-input');
        const bodyInput = slide.querySelector('.slide-body-input');
        const nummerLabel = slide.querySelector('.slide-number');
        const imgPreview = slide.querySelector('.slide-img-preview');
        const trefwoordInput = slide.querySelector('.slide-keyword-input');

        slide.style.backgroundColor = config.kaart;
        slide.style.borderColor = config.rand;
        
        if (titelInput) {
            titelInput.style.backgroundColor = "transparent";
            titelInput.style.padding = "0";
            titelInput.style.borderRadius = "0";
            titelInput.style.width = "100%";
        }

        if (trefwoordInput && trefwoordInput.value.trim() !== "" && gekozenLayout !== "title") {
            const kw = encodeURIComponent(trefwoordInput.value.trim());
            imgPreview.src = `/api/unsplash-image?keyword=${kw}`;
            imgPreview.style.display = "block";
            if (bodyInput) bodyInput.style.width = "50%"; 
        } else {
            imgPreview.style.display = "none";
            if (bodyInput) bodyInput.style.width = "100%";
        }

        if (gekozenLayout === "title") {
            imgPreview.style.display = "none";
            slide.style.padding = "40px";
            if (titelInput) { titelInput.style.textAlign = "center"; }
            if (bodyInput) bodyInput.style.textAlign = "center";
            
            if (gekozenStijl === 'professional') slide.style.backgroundColor = "#0f2043";
            if (gekozenStijl === 'playful') slide.style.backgroundColor = "#ff5e00";
        } else {
            slide.style.padding = "25px";
            if (titelInput) { titelInput.style.textAlign = "left"; }
            if (bodyInput) bodyInput.style.textAlign = "left";

            if (gekozenStijl === 'professional' && titelInput) {
                titelInput.style.backgroundColor = "#0f2043";
                titelInput.style.padding = "8px 12px";
                titelInput.style.borderRadius = "4px";
                titelInput.style.width = "calc(100% - 24px)";
            }
        }

        if (titelInput) titelInput.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;
        if (bodyInput) bodyInput.style.color = (gekozenLayout === "title" && gekozenStijl === 'professional') ? "#ffffff" : config.tekst;
        if (nummerLabel) nummerLabel.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;

        if (gekozenStijl === 'futuristic') {
            slide.style.boxShadow = "0 0 15px rgba(0, 255, 204, 0.2)";
        } else if (gekozenStijl === 'playful') {
            slide.style.boxShadow = "6px 6px 0px #282828";
        } else {
            slide.style.boxShadow = "5px 5px 0px #eee";
        }
    });
}

function slaSlidesOp() {
    const slideItems = document.querySelectorAll('.slide-item');
    const slidesData = Array.from(slideItems).map(item => ({
        titel: item.querySelector('.slide-title-input').value,
        body: item.querySelector('.slide-body-input').value,
        layout: item.querySelector('.slide-layout-select').value,
        afbeelding: item.querySelector('.slide-keyword-input').value
    }));
    localStorage.setItem('junior_ai_slides', JSON.stringify(slidesData));
    console.log("💾 Slides succesvol opgeslagen!");
}

function voegSlideElementToe(titel = "", body = "", layout = "content", afbeelding = "") {
    const slideList = document.getElementById('slide-list');
    if (!slideList) return;

    const emptyMsg = document.getElementById('empty-msg');
    if (emptyMsg) emptyMsg.style.display = 'none';

    slideCount++;
    const slideDiv = document.createElement('div');
    slideDiv.className = "card slide-item";
    slideDiv.style = "border: 2px solid #333; position: relative; aspect-ratio: 16/9; margin-bottom: 15px; transition: all 0.3s ease; display: flex; flex-direction: column;";
    
    slideDiv.innerHTML = `
        <div style="position: absolute; right: 10px; top: 10px; z-index: 10; display: flex; gap: 5px;">
            <button class="move-up-btn" style="border: none; background: #341f97; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold; transition: 0.2s;">▲</button>
            <button class="move-down-btn" style="border: none; background: #341f97; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold; transition: 0.2s;">▼</button>
            <button class="delete-slide-btn" style="border: none; background: #ff4757; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold; transition: 0.2s;">×</button>
        </div>
        
        <div style="position: absolute; left: 25px; top: 10px; z-index: 10; display: flex; gap: 15px; align-items: center;">
            <div>
                <label style="font-size: 0.7rem; font-weight: bold; color: #666;">Indeling:</label>
                <select class="slide-layout-select" style="font-size: 0.7rem; padding: 2px; border-radius: 4px; border: 1px solid #ccc; color: black; background: white;">
                    <option value="content" ${layout === 'content' ? 'selected' : ''}>Standaard (Inhoud)</option>
                    <option value="title" ${layout === 'title' ? 'selected' : ''}>Titel Slide (Midden)</option>
                </select>
            </div>
            <div>
                <label style="font-size: 0.7rem; font-weight: bold; color: #666;">🖼️ Unsplash Foto:</label>
                <input type="text" class="slide-keyword-input" placeholder="bijv. robot, workspace..." value="${afbeelding}"
                       style="font-size: 0.7rem; padding: 2px; border-radius: 4px; border: 1px solid #ccc; width: 120px; color: black; background: white;">
            </div>
        </div>

        <input type="text" class="slide-title-input" placeholder="Titel van deze slide..." value="${titel}"
               style="font-size: 1.5rem; font-weight: bold; border: none; border-bottom: 2px solid #eee; margin-bottom: 15px; width: 100%; outline: none; background: transparent; margin-top: 15px;">
        
        <div style="display: flex; width: 100%; height: 60%; position: relative;">
            <textarea class="slide-body-input" placeholder="Vertel hier meer over jullie idee..." 
                      style="width: 100%; height: 100%; border: none; resize: none; font-size: 1rem; outline: none; background: transparent;">${body}</textarea>
            
            <img class="slide-img-preview" src="" alt="Preview" 
                 style="position: absolute; right: 0; top: 0; width: 40%; height: 90%; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; display: none;">
        </div>

        <div class="slide-number" style="position: absolute; bottom: 10px; right: 15px; font-size: 0.7rem; font-weight: bold;">SLIDE ${slideCount}</div>
    `;
    
    slideList.appendChild(slideDiv);

    slideDiv.querySelector('.slide-title-input').addEventListener('input', slaSlidesOp);
    slideDiv.querySelector('.slide-body-input').addEventListener('input', slaSlidesOp);
    
    slideDiv.querySelector('.slide-keyword-input').addEventListener('input', () => {
        pasLiveStijlToe();
        slaSlidesOp();
        resetDownloadKnop();
    });
    
    slideDiv.querySelector('.slide-layout-select').addEventListener('change', () => {
        pasLiveStijlToe();
        slaSlidesOp();
        resetDownloadKnop();
    });

    slideDiv.querySelector('.move-up-btn').onclick = () => {
        const vorigeSlide = slideDiv.previousElementSibling;
        if (vorigeSlide && vorigeSlide.classList.contains('slide-item')) {
            slideList.insertBefore(slideDiv, vorigeSlide);
            updateSlideNummers();
            slaSlidesOp();
            pasLiveStijlToe();
            resetDownloadKnop();
        }
    };

    slideDiv.querySelector('.move-down-btn').onclick = () => {
        const volgendeSlide = slideDiv.nextElementSibling;
        if (volgendeSlide && volgendeSlide.classList.contains('slide-item')) {
            slideList.insertBefore(volgendeSlide, slideDiv); 
            updateSlideNummers();
            slaSlidesOp();
            pasLiveStijlToe();
            resetDownloadKnop();
        }
    };

    slideDiv.querySelector('.delete-slide-btn').onclick = () => {
        slideDiv.remove();
        updateSlideNummers();
        slaSlidesOp();
        resetDownloadKnop();
        if (slideCount === 0 && emptyMsg) emptyMsg.style.display = 'block';
    };
}

function resetDownloadKnop() {
    const container = document.getElementById('downloadLinkContainer');
    if (container) container.innerHTML = '';
}

function laadSlidesOp() {
    const saved = localStorage.getItem('junior_ai_slides');
    if (!saved) return;
    
    const slidesData = JSON.parse(saved);
    const slideList = document.getElementById('slide-list');
    if (!slideList || slidesData.length === 0) return;
    
    slideList.innerHTML = '';
    slideCount = 0;
    
    slidesData.forEach(data => {
        voegSlideElementToe(data.titel, data.body, data.layout, data.afbeelding || "");
    });
    
    pasLiveStijlToe();
}

// ==========================================
// INITIALISATIE VAN EVENTS (Fase 5)
// ==========================================
setTimeout(() => {
    laadSlidesOp();

    const stijlSelector = document.getElementById('presentation-style');
    if (stijlSelector) {
        stijlSelector.addEventListener('change', () => {
            pasLiveStijlToe();
            slaSlidesOp();
            resetDownloadKnop();
        });
    }

    const addSlideBtn = document.getElementById('addSlideBtn');
    if (addSlideBtn) {
        addSlideBtn.onclick = () => {
            voegSlideElementToe("", "", "content", "");
            pasLiveStijlToe();
            slaSlidesOp();
        };
    }

    const getAiAdviceBtn = document.getElementById('getAiAdviceBtn');
    const adviceBox = document.getElementById('ai-advice-content');

    if (getAiAdviceBtn) {
        getAiAdviceBtn.onclick = () => {
            const age = document.getElementById('user-age').value;
            adviceBox.innerHTML = `
                <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                    <p style="color: #007bff; font-weight: bold; margin-bottom: 5px;">AI Coach (${age} jr):</p>
                    <p style="font-size: 0.8rem; margin-bottom: 10px;">Leg in één zin jullie oplossing uit:</p>
                    <input type="text" id="ai-user-input" placeholder="Typ jullie plan..." style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; color: black;">
                    <button id="sendToAi" class="btn primary" style="width: 100%; font-size: 0.7rem;">Vraag Slide Advies</button>
                </div>
            `;

            document.getElementById('sendToAi').onclick = async () => {
                const plan = document.getElementById('ai-user-input').value.trim();
                if (!plan) return alert("Vul eerst jullie plan in!");

                adviceBox.innerHTML = "<p>⌛ Coach is aan het nadenken...</p>";

                try {
                    const res = await fetch('/api/propose-layout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uitleg: plan, leeftijd: age })
                    });
                    const data = await res.json();
                    
                    adviceBox.innerHTML = `
                        <p style="font-weight: bold; font-size: 0.8rem; color: #28a745;">Mijn advies voor jou:</p>
                        <ul style="padding-left: 15px; font-size: 0.8rem; margin-top: 5px;">
                            ${data.slides.map(s => `<li style="margin-bottom: 4px;">${s.titel}</li>`).join('')}
                        </ul>
                        <button onclick="location.reload()" class="btn secondary" style="width: 100%; font-size: 0.6rem; padding: 4px; margin-top: 5px;">Opnieuw overleggen</button>
                    `;
                } catch (e) {
                    adviceBox.innerHTML = "<p style='color:red;'>Oeps, de coach is even weg. Check de server!</p>";
                }
            };
        };
    }

    const exportBtn = document.getElementById('exportPptxBtn');
    if (exportBtn) {
        exportBtn.onclick = async () => {
            const slideItems = document.querySelectorAll('.slide-item');
            const gekozenStijl = document.getElementById('presentation-style').value;

            const slides = Array.from(slideItems).map((item, idx) => ({
                nr: idx + 1,
                titel: item.querySelector('.slide-title-input').value || "Geen titel",
                body: item.querySelector('.slide-body-input').value || "" ,
                layout: item.querySelector('.slide-layout-select').value,
                afbeelding: item.querySelector('.slide-keyword-input').value.trim() 
            }));

            if (slides.length === 0) return alert("Maak eerst slides aan!");

            exportBtn.innerText = "🎨 Stijl toepassen & PowerPoint maken...";
            
            try {
                const res = await fetch('/api/export-pptx', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposal: slides, stijl: gekozenStijl })
                });
                const data = await res.json();
                if (data.success) {
                    exportBtn.innerText = "🚀 Exporteer naar PowerPoint";
                    document.getElementById('downloadLinkContainer').innerHTML = 
                        `<a href="${data.url}" class="btn primary" style="background:#28a745; text-decoration:none; display:block; text-align:center; padding:10px; margin-top:10px;" download>✅ Download met Stijl!</a>`;
                } else {
                    alert("Server fout: " + (data.error || "Onbekend"));
                    exportBtn.innerText = "🚀 Exporteer naar PowerPoint";
                }
            } catch (e) {
                exportBtn.innerText = "❌ Fout bij export";
            }
        };
    }
}, 500); // 500ms timeout zorgt dat de knoppen zeker geladen zijn