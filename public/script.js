// ==========================================
// 1. NAVIGATIE LOGICA
// ==========================================
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
// 4. FINALE: PITCH & JURY (Fase 3)
// ==========================================
const finaleInput = document.getElementById('finaleInput');
const genPitchBtn = document.getElementById('genPitchBtn');
const genJuryBtn = document.getElementById('genJuryBtn');
const finaleOutput = document.getElementById('finaleOutput');

// PITCH
genPitchBtn.addEventListener('click', async () => {
    const idee = finaleInput.value.trim();
    if (!idee) return alert("Typ eerst jullie fantastische idee in het vakje!");

    finaleOutput.style.display = "block";
    finaleOutput.innerHTML = "<i>AI is de pennen aan het slijpen en schrijft jullie pitch... ⏳</i>";

    try {
        const response = await fetch('/api/finale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee, type: "pitch" })
        });
        
        const data = await response.json();
        if (data.error) finaleOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
        else finaleOutput.innerHTML = data.resultaat.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    } catch (error) {
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, de verbinding is even weg! Probeer het nog eens.</b>`;
    }
});

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
// 6. POWERPOINT GENERATOR LOGICA 
// ==========================================
const genPptxBtn = document.getElementById('genPptxBtn');

genPptxBtn.addEventListener('click', async () => {
    const idee = finaleInput.value.trim();
    if (!idee) return alert("Typ eerst jullie idee in het vak hierboven!");

    finaleOutput.style.display = "block";
    finaleOutput.innerHTML = "<i>AI ontwerpt de slides voor jullie... 🎨</i>";

    try {
        const response = await fetch('/api/pptx-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee })
        });
        
        const data = await response.json();
        
        if (data.error) return finaleOutput.innerHTML = `<b style="color: red;">Server zegt: ${data.error}</b>`;
        if (!data.slides || !Array.isArray(data.slides)) return finaleOutput.innerHTML = `<b style="color: red;">Oeps, de AI was even in de war met de layout. Klik nog een keer!</b>`;

        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        const COLOR_BG = "F3F0DF";       
        const COLOR_PRIMARY = "002B49";  
        const COLOR_ACCENT = "11CAA0";   
        const COLOR_WHITE = "FFFFFF";    

        data.slides.forEach((slideData, index) => {
            let slide = pptx.addSlide();

            if (index === 0) {
                slide.background = { color: COLOR_PRIMARY };
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '3%', h: '100%', fill: { color: COLOR_ACCENT } });
                slide.addText("JUNIOR AI LEAGUE", { x: 1, y: 2, w: '80%', fontSize: 24, color: COLOR_ACCENT, bold: true, letterSpacing: 2 });
                const titelTekst = slideData.titel || "Onze Oplossing";
                slide.addText(titelTekst, { x: 1, y: 2.6, w: '80%', fontSize: 54, color: COLOR_BG, bold: true });
                let puntenTekst = Array.isArray(slideData.punten) ? slideData.punten.join(" ") : (slideData.punten || "");
                slide.addText(puntenTekst, { x: 1, y: 4.5, w: '80%', h: 2, fontSize: 20, color: COLOR_WHITE });
            } else {
                slide.background = { color: COLOR_BG };
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: COLOR_PRIMARY } });
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.2, w: '100%', h: 0.05, fill: { color: COLOR_ACCENT } });
                slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.6, w: 9.0, h: 3.5, fill: { color: COLOR_WHITE } });
                const titelTekst = slideData.titel || "Slide";
                slide.addText(titelTekst, { x: 0.5, y: 0.15, w: '90%', h: 0.9, fontSize: 36, color: COLOR_WHITE, bold: true });
                let puntenTekst = Array.isArray(slideData.punten) ? slideData.punten.join("\n") : (slideData.punten || "");
                slide.addText(puntenTekst, { x: 0.8, y: 1.8, w: '8.4', h: 3.0, fontSize: 24, color: COLOR_PRIMARY, bullet: { color: COLOR_ACCENT }, lineSpacing: 45, valign: 'top' });
                slide.addText("🚀 Junior AI League", { x: 0.5, y: 5.2, fontSize: 12, color: '888888' });
            }
        });

        await pptx.writeFile({ fileName: `Presentatie_JuniorAI_${Date.now()}.pptx` });
        finaleOutput.innerHTML = "<b>✅ Klaar! Jullie strakke PowerPoint is zojuist gedownload. Check je downloadmap!</b>";
    } catch (error) {
        console.error("PowerPoint fout:", error);
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, er ging iets mis bij het maken van de presentatie. Probeer het nog eens.</b>`;
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