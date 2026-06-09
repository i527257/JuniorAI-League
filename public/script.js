let slideCount = 0;

// ==========================================
// 1. HELPER: Slide nummers live herberekenen
// ==========================================
function updateSlideNummers() {
    const nummers = document.querySelectorAll('.slide-number');
    nummers.forEach((num, idx) => {
        num.innerText = `SLIDE ${idx + 1}`;
    });
    slideCount = nummers.length;
}

// ==========================================
// 2. LIVE PREVIEW: Pas Stijl, Lay-out & Unsplash-Afbeelding toe
// ==========================================
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

        // Basis reset
        slide.style.backgroundColor = config.kaart;
        slide.style.borderColor = config.rand;
        
        if (titelInput) {
            titelInput.style.backgroundColor = "transparent";
            titelInput.style.padding = "0";
            titelInput.style.borderRadius = "0";
            titelInput.style.width = "100%";
        }

        // Unsplash API koppeling via de server-route
        if (trefwoordInput && trefwoordInput.value.trim() !== "" && gekozenLayout !== "title") {
            const kw = encodeURIComponent(trefwoordInput.value.trim());
            imgPreview.src = `/api/unsplash-image?keyword=${kw}`;
            imgPreview.style.display = "block";
            if (bodyInput) bodyInput.style.width = "50%"; 
        } else {
            imgPreview.style.display = "none";
            if (bodyInput) bodyInput.style.width = "100%";
        }

        // Uitlijning op basis van lay-out
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

        // Kleuren instellen
        if (titelInput) titelInput.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;
        if (bodyInput) bodyInput.style.color = (gekozenLayout === "title" && gekozenStijl === 'professional') ? "#ffffff" : config.tekst;
        if (nummerLabel) nummerLabel.style.color = (gekozenLayout === "title" && (gekozenStijl === 'professional' || gekozenStijl === 'playful')) ? "#ffffff" : config.titel;

        // Schaduw effecten
        if (gekozenStijl === 'futuristic') {
            slide.style.boxShadow = "0 0 15px rgba(0, 255, 204, 0.2)";
        } else if (gekozenStijl === 'playful') {
            slide.style.boxShadow = "6px 6px 0px #282828";
        } else {
            slide.style.boxShadow = "5px 5px 0px #eee";
        }
    });
}

// ==========================================
// 3. AUTO-SAVE: Sla data op
// ==========================================
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

// ==========================================
// 4. CORE: Bouw Slide op in HTML (Met sorteerknoppen)
// ==========================================
function voegSlideElementToe(titel = "", body = "", layout = "content", afbeelding = "") {
    const slideList = document.getElementById('slide-list');
    if (!slideList) return;

    const emptyMsg = document.getElementById('empty-msg');
    if (emptyMsg) emptyMsg.style.display = 'none';

    slideCount++;
    const slideDiv = document.createElement('div');
    slideDiv.className = "card slide-item";
    slideDiv.style = "border: 2px solid #333; position: relative; aspect-ratio: 16/9; margin-bottom: 15px; transition: all 0.3s ease; display: flex; flex-direction: column;";
    
    // NIEUW: Knoppenpaneel rechtsboven toegevoegd voor volgorde (▲ / ▼) en verwijderen (×)
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

    // Koppel tekst- en invoerluisteraars
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

    // NIEUW: Logica om slide OMHOOG te schuiven
    slideDiv.querySelector('.move-up-btn').onclick = () => {
        const vorigeSlide = slideDiv.previousElementSibling;
        if (vorigeSlide && vorigeSlide.classList.contains('slide-item')) {
            slideList.insertBefore(slideDiv, vorigeSlide); // Verplaats in de HTML structuur
            updateSlideNummers();
            slaSlidesOp();
            pasLiveStijlToe();
            resetDownloadKnop();
        }
    };

    // NIEUW: Logica om slide OMLAAG te schuiven
    slideDiv.querySelector('.move-down-btn').onclick = () => {
        const volgendeSlide = slideDiv.nextElementSibling;
        if (volgendeSlide && volgendeSlide.classList.contains('slide-item')) {
            slideList.insertBefore(volgendeSlide, slideDiv); // Schuif de volgende slide vóór deze
            updateSlideNummers();
            slaSlidesOp();
            pasLiveStijlToe();
            resetDownloadKnop();
        }
    };

    // Verwijderknop logica
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

// ==========================================
// 5. AUTO-LOAD: Inladen bij opstarten
// ==========================================
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
// 6. INITIALISATIE & EVENT LISTENERS
// ==========================================
window.onload = () => {
    laadSlidesOp();

    window.openTab = (tabId) => {
        slaSlidesOp();
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        const gekozenTab = document.getElementById(tabId);
        if (gekozenTab) gekozenTab.classList.add('active');
        if (tabId === 'fase-presentatie') pasLiveStijlToe();
    };

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

    // AI Adviseur Knop
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

    // PowerPoint Export Knop
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
};