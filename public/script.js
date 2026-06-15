// ==========================================
// GLOBALE STATE & INITIALISATIE
// ==========================================
let slideCount = 0;
let isListening = false;
let isSpeaking = false;
let verzameldeTekst = "";
let silenceTimer;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// ==========================================
// 1. ALGEMENE NAVIGATIE LOGICA
// ==========================================
function openTab(tabId) {
    // Sla eventuele slide-aanpassingen op als we wisselen
    if (document.getElementById('slide-list')) {
        slaSlidesOp();
    }

    // Verberg alle tabbladen
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Maak alle menu-items inactief
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
    });

    // Activeer het gekozen tabblad
    const gekozenTab = document.getElementById(tabId);
    if (gekozenTab) gekozenTab.classList.add('active');

    // Maak het bijbehorende menu-item actief
    const actiefMenuIteem = Array.from(document.querySelectorAll('.nav-links li')).find(li => {
        return li.getAttribute('onclick') && li.getAttribute('onclick').includes(tabId);
    });
    if (actiefMenuIteem) actiefMenuIteem.classList.add('active');

    // Als we naar de presentatietab gaan, activeer dan direct de live styling
    if (tabId === 'fase-presentatie') {
        pasLiveStijlToe();
    }
}
window.openTab = openTab; // Zorg dat de HTML de functie kan aanroepen

// ==========================================
// 2. FASE 1: LIVE SPRAAKCOACH LOGICA
// ==========================================
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        if (isSpeaking) return;

        const current = event.resultIndex;
        let transcript = event.results[current][0].transcript.trim();

        if (transcript.length < 2) return;

        verzameldeTekst += transcript + ". ";
        appendMessage("Jullie: " + transcript, "user-message");

        clearTimeout(silenceTimer);

        // Als het 7 seconden stil is, sturen we de tekst naar de AI
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
}

async function vraagHulpAanAI(transcript) {
    const statusText = document.getElementById('status');
    if (statusText) statusText.innerText = "Status: AI denkt na...";
    
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
        if (statusText) statusText.innerText = "Status: Gestopt.";
    }
}

function appendMessage(text, className) {
    const chatBox = document.getElementById('chat');
    if (!chatBox) return;
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
    if (recognition) recognition.stop(); 
    
    const statusText = document.getElementById('status');
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

    if (leraresStem) utterance.voice = leraresStem;
    else if (nlStemmen.length > 0) utterance.voice = nlStemmen[0];

    utterance.onend = () => {
        isSpeaking = false;
        if (statusText) statusText.innerText = "Status: Ik luister weer mee...";
        if (isListening && recognition) {
            recognition.start(); 
        }
    };
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// 3. FASE 1: CO-CREATIE MINDMAP LOGICA
// ==========================================
let mindmapWoorden = [];
let laatsteAiZet = 0; 
const COOLDOWN_TIJD = 3 * 60 * 1000; 

async function voegWoordToe() {
    const mindmapInput = document.getElementById('mindmapInput');
    if (!mindmapInput) return;
    
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
    const canvas = document.getElementById('mindmap-canvas');
    if (!canvas) return;
    
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
// 4. FASE 3: FINALE GENERATOR & JURY LOGICA
// ==========================================
async function genereerFinaleContent(type) {
    const finaleInput = document.getElementById('finaleInput');
    const finaleOutput = document.getElementById('finaleOutput');
    if (!finaleInput || !finaleOutput) return;

    const idee = finaleInput.value.trim();
    if (!idee) return alert("Typ eerst jullie fantastische idee in het vakje!");

    finaleOutput.style.display = "block";
    finaleOutput.innerHTML = type === "pitch" ? "<i>AI schrijft jullie pitch... ⏳</i>" : "<i>De studio componeert jullie track... 🎧🎶</i>";

    try {
        const url = type === "pitch" ? '/api/finale' : '/api/muziek';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idee: idee, type: type })
        });
        const data = await response.json();
        
        if (data.error) {
            finaleOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;
        } else if (type === "pitch") {
            finaleOutput.innerHTML = data.resultaat.replace(/\*\*(.*?)\*\"/g, '<b>$1</b>');
        } else {
            let opgemaakteLyrics = data.lyrics.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            finaleOutput.innerHTML = `
                <div style="margin-bottom: 20px; padding: 15px; background: #E2E8F0; border-radius: 10px; text-align: center;">
                    <h3 style="margin-top: 0;">🎵 Jullie AI Track is klaar!</h3>
                    <audio controls style="width: 100%;" src="${data.audio_url}"></audio>
                </div>
                <div style="white-space: pre-wrap;">${opgemaakteLyrics}</div>`;
        }
    } catch (e) {
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, er ging iets mis! Probeer het opnieuw.</b>`;
    }
}

async function genereerJuryVragen() {
    const finaleInput = document.getElementById('finaleInput');
    const finaleOutput = document.getElementById('finaleOutput');
    if (!finaleInput || !finaleOutput) return;

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
    } catch (e) {
        finaleOutput.innerHTML = `<b style="color: red;">Oeps, verbinding weg.</b>`;
    }
}

// ==========================================
// 5. FASE 3: PITCH OEFENEN LOGICA (MICROFOON)
// ==========================================
let pitchRecognition;
let isPitchRecording = false;
let verzameldePitchTekst = "";

function setupPitchOefenen() {
    if (!SpeechRecognition) return;

    pitchRecognition = new SpeechRecognition();
    pitchRecognition.lang = 'nl-NL';
    pitchRecognition.continuous = true;
    pitchRecognition.interimResults = false;

    pitchRecognition.onstart = () => {
        const finaleOutput = document.getElementById('finaleOutput');
        if (finaleOutput) {
            finaleOutput.style.display = "block";
            finaleOutput.innerHTML = "<i>🎙️ Microfoon staat aan! Spreek je pitch in... (Klik op 'Stop & Beoordeel' als je klaar bent)</i>";
        }
    };

    pitchRecognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        verzameldePitchTekst += transcript + " ";
        
        const finaleOutput = document.getElementById('finaleOutput');
        if (finaleOutput) {
            finaleOutput.innerHTML = `
                <i>🎙️ Microfoon staat aan! Spreek je pitch in...<br><br>
                <b>Jouw pitch tot nu toe:</b> "${verzameldePitchTekst}"
            `;
        }
    };
}

async function togglePitchOefenen() {
    const oefenPitchBtn = document.getElementById('oefenPitchBtn');
    const finaleOutput = document.getElementById('finaleOutput');
    if (!oefenPitchBtn || !finaleOutput) return;

    if (!SpeechRecognition) return alert("Je browser ondersteunt geen spraakherkenning. Gebruik Chrome!");

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

        finaleOutput.innerHTML = `<p><b>Jouw volledige pitch:</b> "${verzameldePitchTekst}"</p><i>AI Jury analyseert... 🧐</i>`;

        try {
            const response = await fetch('/api/jury', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    idee: `Hier is een pitch van een deelnemer. Geef kort feedback: "${verzameldePitchTekst}"` 
                })
            });
            const data = await response.json();
            finaleOutput.innerHTML = `
                <p><b>Jouw volledige pitch:</b> "${verzameldePitchTekst}"</p><hr>
                <h3>Jouw Pitch Feedback:</h3>
                ${data.vragen.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}`;
        } catch (e) {
            finaleOutput.innerHTML = `<b style="color: red;">Oeps, verbinding weg met de jury!</b>`;
        }
    }
}

// ==========================================
// 6. FASE 4: PROTOTYPE BOUWEN LOGICA
// ==========================================
function getIdeeInvoer() {
    const prototypeInput = document.getElementById('prototypeInput');
    let idee = prototypeInput ? prototypeInput.value.trim() : "";
    if (!idee) {
        const finaleInvoer = document.getElementById('finaleInput');
        if (finaleInvoer) idee = finaleInvoer.value.trim();
    }
    return idee;
}

async function genereerPosterAffiche() {
    const prototypeOutput = document.getElementById('prototypeOutput');
    const idee = getIdeeInvoer();
    if (!idee || !prototypeOutput) return alert("Typ eerst jullie idee in, of vul iets in bij Fase 3!");

    prototypeOutput.style.display = "block";
    prototypeOutput.innerHTML = "<i>AI-artiest maakt jullie affiche... Eventjes geduld! 🎨🖌️⏳</i>";

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
                <img src="${data.audio_url}" alt="Poster" style="max-width: 100%; height: auto; border-radius: 15px; margin-top: 10px;">
                <p style="font-size: 14px; color: #666; margin-top: 10px;"><i>Gegenereerd door Imagen 3 ter inspiratie!</i></p>`;
        }
    } catch (e) {
        prototypeOutput.innerHTML = `<b style="color: red;">Oeps, de AI-artiest heeft even pauze.</b>`;
    }
}

async function genereerTekstPrototype(type) {
    const prototypeOutput = document.getElementById('prototypeOutput');
    const idee = getIdeeInvoer();
    if (!idee || !prototypeOutput) return alert("Typ eerst jullie idee in!");

    prototypeOutput.style.display = "block";
    prototypeOutput.innerHTML = "<i>AI bedenkt een stappenplan voor jullie prototype... 🛠️⏳</i>";

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
        prototypeOutput.innerHTML = `<b style="color: red;">Verbinding verloren!</b>`;
    }
}

// ==========================================
// 7. FASE 5: SLIDE TEMPLATES & POWERPOINT EXPORT
// ==========================================
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
            if (titelInput) titelInput.style.textAlign = "center";
            if (bodyInput) bodyInput.style.textAlign = "center";
            if (gekozenStijl === 'professional') slide.style.backgroundColor = "#0f2043";
            if (gekozenStijl === 'playful') slide.style.backgroundColor = "#ff5e00";
        } else {
            slide.style.padding = "25px";
            if (titelInput) titelInput.style.textAlign = "left";
            if (bodyInput) bodyInput.style.textAlign = "left";
            if (gekozenStijl === 'professional' && titelInput) {
                titelInput.style.backgroundColor = "#0f2043";
                titelInput.style.padding = "8px 12px";
                titelInput.style.borderRadius = "4px";
            }
        }

        if (titelInput) titelInput.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;
        if (bodyInput) bodyInput.style.color = (gekozenLayout === "title" && gekozenStijl === 'professional') ? "#ffffff" : config.tekst;
        if (nummerLabel) nummerLabel.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;

        if (gekozenStijl === 'futuristic') slide.style.boxShadow = "0 0 15px rgba(0, 255, 204, 0.2)";
        else if (gekozenStijl === 'playful') slide.style.boxShadow = "6px 6px 0px #282828";
        else slide.style.boxShadow = "5px 5px 0px #eee";
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
}

function voegSlideElementToe(titel = "", body = "", layout = "content", afbeelding = "") {
    const slideList = document.getElementById('slide-list');
    if (!slideList) return;

    const emptyMsg = document.getElementById('empty-msg');
    if (emptyMsg) emptyMsg.style.display = 'none';

    slideCount++;
    const slideDiv = document.createElement('div');
    slideDiv.className = "card slide-item";
    slideDiv.style = "border: 2px solid #333; position: relative; aspect-ratio: 16/9; margin-bottom: 15px; display: flex; flex-direction: column;";
    
    slideDiv.innerHTML = `
        <div style="position: absolute; right: 10px; top: 10px; z-index: 10; display: flex; gap: 5px;">
            <button class="move-up-btn" style="border: none; background: #341f97; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold;">▲</button>
            <button class="move-down-btn" style="border: none; background: #341f97; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold;">▼</button>
            <button class="delete-slide-btn" style="border: none; background: #ff4757; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold;">×</button>
        </div>
        
        <div style="position: absolute; left: 25px; top: 10px; z-index: 10; display: flex; gap: 15px; align-items: center;">
            <div>
                <label style="font-size: 0.7rem; font-weight: bold; color: #666;">Indeling:</label>
                <select class="slide-layout-select" style="font-size: 0.7rem; color: black; background: white;">
                    <option value="content" ${layout === 'content' ? 'selected' : ''}>Standaard (Inhoud)</option>
                    <option value="title" ${layout === 'title' ? 'selected' : ''}>Titel Slide (Midden)</option>
                </select>
            </div>
            <div>
                <label style="font-size: 0.7rem; font-weight: bold; color: #666;">🖼️ Unsplash:</label>
                <input type="text" class="slide-keyword-input" placeholder="trefwoord..." value="${afbeelding}" style="font-size: 0.7rem; width: 120px; color: black; background: white;">
            </div>
        </div>

        <input type="text" class="slide-title-input" placeholder="Titel..." value="${titel}" style="font-size: 1.5rem; font-weight: bold; border: none; border-bottom: 2px solid #eee; width: 100%; outline: none; background: transparent; margin-top: 25px;">
        
        <div style="display: flex; width: 100%; height: 60%; position: relative;">
            <textarea class="slide-body-input" placeholder="Vertel hier jullie idee..." style="width: 100%; height: 100%; border: none; resize: none; background: transparent;">${body}</textarea>
            <img class="slide-img-preview" src="" alt="Preview" style="position: absolute; right: 0; top: 0; width: 40%; height: 90%; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; display: none;">
        </div>
        <div class="slide-number" style="position: absolute; bottom: 10px; right: 15px; font-size: 0.7rem; font-weight: bold;">SLIDE ${slideCount}</div>`;
    
    slideList.appendChild(slideDiv);

    slideDiv.querySelector('.slide-title-input').addEventListener('input', slaSlidesOp);
    slideDiv.querySelector('.slide-body-input').addEventListener('input', slaSlidesOp);
    slideDiv.querySelector('.slide-keyword-input').addEventListener('input', () => { pasLiveStijlToe(); slaSlidesOp(); resetDownloadKnop(); });
    slideDiv.querySelector('.slide-layout-select').addEventListener('change', () => { pasLiveStijlToe(); slaSlidesOp(); resetDownloadKnop(); });

    slideDiv.querySelector('.move-up-btn').onclick = () => {
        const vorige = slideDiv.previousElementSibling;
        if (vorige && vorige.classList.contains('slide-item')) {
            slideList.insertBefore(slideDiv, vorige);
            updateSlideNummers(); slaSlidesOp(); pasLiveStijlToe(); resetDownloadKnop();
        }
    };

    slideDiv.querySelector('.move-down-btn').onclick = () => {
        const volgende = slideDiv.nextElementSibling;
        if (volgende && volgende.classList.contains('slide-item')) {
            slideList.insertBefore(volgende, slideDiv);
            updateSlideNummers(); slaSlidesOp(); pasLiveStijlToe(); resetDownloadKnop();
        }
    };

    slideDiv.querySelector('.delete-slide-btn').onclick = () => {
        slideDiv.remove();
        updateSlideNummers(); slaSlidesOp(); resetDownloadKnop();
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
    slidesData.forEach(data => voegSlideElementToe(data.titel, data.body, data.layout, data.afbeelding || ""));
    pasLiveStijlToe();
}

// ==========================================
// 8. INITIALISATIE & KLIK LISTENERS (ONLOAD)
// ==========================================
window.onload = () => {
    // Laad slides uit LocalStorage
    laadSlidesOp();
    setupPitchOefenen();

    // Fase 1: Spraakcoach Knop
    const startBtn = document.getElementById('startBtn');
    const statusText = document.getElementById('status');
    if (startBtn && recognition) {
        startBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                isListening = false;
                startBtn.innerText = "Start met meeluisteren";
                if (statusText) statusText.innerText = "Status: Gestopt.";
            } else {
                isListening = true;
                recognition.start();
                startBtn.innerText = "Stop met meeluisteren";
                if (statusText) statusText.innerText = "Status: Ik luister mee...";
            }
        });
    }

    // Fase 1: Mindmap Knoppen
    const addNodeBtn = document.getElementById('addNodeBtn');
    const mindmapInput = document.getElementById('mindmapInput');
    if (addNodeBtn) addNodeBtn.addEventListener('click', voegWoordToe);
    if (mindmapInput) {
        mindmapInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') voegWoordToe(); });
    }

    // Fase 3: Knoppen
    if (document.getElementById('genPitchBtn')) {
        document.getElementById('genPitchBtn').onclick = () => genereerFinaleContent('pitch');
    }
    if (document.getElementById('genSongBtn')) {
        document.getElementById('genSongBtn').onclick = () => genereerFinaleContent('song');
    }
    if (document.getElementById('genJuryBtn')) {
        document.getElementById('genJuryBtn').onclick = genereerJuryVragen;
    }
    if (document.getElementById('oefenPitchBtn')) {
        document.getElementById('oefenPitchBtn').onclick = togglePitchOefenen;
    }

    // Fase 3: Snelle Front-end PowerPoint Generator
    const genPptxBtn = document.getElementById('genPptxBtn');
    if (genPptxBtn) {
        genPptxBtn.addEventListener('click', async () => {
            const finaleInput = document.getElementById('finaleInput');
            const finaleOutput = document.getElementById('finaleOutput');
            const idee = finaleInput.value.trim();
            if (!idee) return alert("Typ eerst jullie idee in!");

            finaleOutput.style.display = "block";
            finaleOutput.innerHTML = "<i>AI ontwerpt de slides voor jullie... 🎨</i>";

            try {
                const response = await fetch('/api/pptx-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idee: idee })
                });
                const data = await response.json();
                
                if (data.error) return finaleOutput.innerHTML = `<b style="color: red;">${data.error}</b>`;

                let pptx = new PptxGenJS();
                pptx.layout = 'LAYOUT_16x9';

                data.slides.forEach((slideData, index) => {
                    let slide = pptx.addSlide();
                    if (index === 0) {
                        slide.background = { color: "002B49" };
                        slide.addText(slideData.titel || "Onze Oplossing", { x: 1, y: 2.6, w: '80%', fontSize: 54, color: "F3F0DF", bold: true });
                    } else {
                        slide.background = { color: "F3F0DF" };
                        slide.addText(slideData.titel || "Slide", { x: 0.5, y: 0.15, w: '90%', fontSize: 36, color: "002B49", bold: true });
                        let punten = Array.isArray(slideData.punten) ? slideData.punten.join("\n") : slideData.punten;
                        slide.addText(punten, { x: 0.8, y: 1.8, w: '8.4', fontSize: 24, color: "002B49" });
                    }
                });

                await pptx.writeFile({ fileName: `Presentatie_JuniorAI_${Date.now()}.pptx` });
                finaleOutput.innerHTML = "<b>✅ Klaar! PowerPoint gedownload. Check je downloadmap!</b>";
            } catch (e) {
                finaleOutput.innerHTML = `<b style="color: red;">Oeps, er ging iets mis!</b>`;
            }
        });
    }

    // Fase 4: Knoppen
    if (document.getElementById('protoPosterBtn')) document.getElementById('protoPosterBtn').onclick = genereerPosterAffiche;
    if (document.getElementById('protoAppBtn')) document.getElementById('protoAppBtn').onclick = () => genereerTekstPrototype('app');
    if (document.getElementById('protoGameBtn')) document.getElementById('protoGameBtn').onclick = () => genereerTekstPrototype('game');
    if (document.getElementById('protoSongBtn')) document.getElementById('protoSongBtn').onclick = () => genereerTekstPrototype('song');

    // Fase 5: Slide Editor Knoppen
    const stijlSelector = document.getElementById('presentation-style');
    if (stijlSelector) stijlSelector.addEventListener('change', () => { pasLiveStijlToe(); slaSlidesOp(); resetDownloadKnop(); });

    const addSlideBtn = document.getElementById('addSlideBtn');
    if (addSlideBtn) {
        addSlideBtn.onclick = () => { voegSlideElementToe("", "", "content", ""); pasLiveStijlToe(); slaSlidesOp(); };
    }

    // Fase 5: AI Advies Knop
    const getAiAdviceBtn = document.getElementById('getAiAdviceBtn');
    if (getAiAdviceBtn) {
        getAiAdviceBtn.onclick = () => {
            const age = document.getElementById('user-age').value;
            const adviceBox = document.getElementById('ai-advice-content');
            adviceBox.innerHTML = `
                <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                    <p style="color: #007bff; font-weight: bold; margin-bottom: 5px;">AI Coach (${age} jr):</p>
                    <input type="text" id="ai-user-input" placeholder="Typ jullie plan..." style="width: 100%; padding: 8px; margin-bottom: 10px; color: black; background: white;">
                    <button id="sendToAi" class="btn primary" style="width: 100%; font-size: 0.7rem;">Vraag Slide Advies</button>
                </div>`;

            document.getElementById('sendToAi').onclick = async () => {
                const plan = document.getElementById('ai-user-input').value.trim();
                if (!plan) return alert("Vul eerst jullie plan in!");
                adviceBox.innerHTML = "<p>⌛ Coach denkt na...</p>";
                try {
                    const res = await fetch('/api/propose-layout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uitleg: plan, leeftijd: age })
                    });
                    const data = await res.json();
                    adviceBox.innerHTML = `
                        <p style="font-weight: bold; color: #28a745;">Mijn advies:</p>
                        <ul style="padding-left: 15px; font-size: 0.8rem;">
                            ${data.slides.map(s => `<li>${s.titel}</li>`).join('')}
                        </ul>`;
                } catch (e) { adviceBox.innerHTML = "<p style='color:red;'>Fout bij laden.</p>"; }
            };
        };
    }

    // Fase 5: PowerPoint Export via Python Backend
    const exportPptxBtn = document.getElementById('exportPptxBtn');
    if (exportPptxBtn) {
        exportPptxBtn.onclick = async () => {
            const slideItems = document.querySelectorAll('.slide-item');
            const gekozenStijl = document.getElementById('presentation-style').value;
            const slides = Array.from(slideItems).map((item, idx) => ({
                nr: idx + 1,
                titel: item.querySelector('.slide-title-input').value || "Geen titel",
                body: item.querySelector('.slide-body-input').value || "",
                layout: item.querySelector('.slide-layout-select').value,
                afbeelding: item.querySelector('.slide-keyword-input').value.trim()
            }));

            if (slides.length === 0) return alert("Maak eerst slides aan!");
            exportPptxBtn.innerText = "🎨 Stijl toepassen & PowerPoint maken...";
            
            try {
                const res = await fetch('/api/export-pptx', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposal: slides, stijl: gekozenStijl })
                });
                const data = await res.json();
                if (data.success) {
                    exportPptxBtn.innerText = "🚀 Exporteer naar PowerPoint";
                    document.getElementById('downloadLinkContainer').innerHTML = 
                        `<a href="${data.url}" class="btn primary" style="background:#28a745; text-decoration:none; display:block; text-align:center; padding:10px;" download>✅ Download met Stijl!</a>`;
                } else {
                    alert("Fout: " + data.error);
                    exportPptxBtn.innerText = "🚀 Exporteer naar PowerPoint";
                }
            } catch (e) { exportPptxBtn.innerText = "❌ Fout bij export"; }
        };
    }
};