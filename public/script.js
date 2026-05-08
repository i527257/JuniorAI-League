const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Oeps! Je browser ondersteunt deze microfoon-tool niet. Gebruik Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.continuous = true;
    recognition.interimResults = false;

    let isListening = false;
    let isSpeaking = false; // Houdt bij of de AI aan het woord is
    let silenceTimer; // De timer voor de stilte
    let verzameldeTekst = ""; // Hier sparen we de zinnen in op

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
        // Als de AI praat, negeren we de microfoon!
        if (isSpeaking) return;

        const current = event.resultIndex;
        let transcript = event.results[current][0].transcript.trim();

        // Negeer lege of hele korte ruis-berichtjes
        if (transcript.length < 2) return;

        // Voeg de nieuwe zin toe aan de verzameling en laat hem zien
        verzameldeTekst += transcript + ". ";
        appendMessage("Jullie: " + transcript, "user-message");

        // Reset de timer! De kinderen zijn weer aan het praten.
        clearTimeout(silenceTimer);

        // Start een nieuwe timer. Als het nu 7 seconden stil blijft, roepen we de AI in.
        silenceTimer = setTimeout(() => {
            if (verzameldeTekst.trim() !== "") {
                vraagHulpAanAI(verzameldeTekst);
                verzameldeTekst = ""; // Maak de opgespaarde tekst weer leeg
            }
        }, 7000); // 7000 milliseconden = 7 seconden wachten
    };

    // Omdat we de microfoon soms tijdelijk pauzeren, moet hij automatisch weer aan als we nog in de "luister-modus" zitten
    recognition.onend = () => {
        if (isListening && !isSpeaking) {
            recognition.start();
        }
    };

    async function vraagHulpAanAI(transcript) {
        statusText.innerText = "Status: AI denkt even na...";
        
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
            appendMessage("AI Coach: Oeps, de verbinding is even weg.", "ai-message");
            statusText.innerText = "Status: Ik luister mee...";
        }
    }

    function appendMessage(text, className) {
        const p = document.createElement('p');
        p.className = className;
        p.innerText = text;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function speak(text) {
        isSpeaking = true; // Vertel het systeem dat de AI praat
        recognition.stop(); // Zet de microfoon DIRECT uit
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL';

        // Wat doen we als de AI klaar is met praten?
        utterance.onend = () => {
            isSpeaking = false; // AI is klaar
            statusText.innerText = "Status: Ik luister weer mee...";
            if (isListening) {
                recognition.start(); // Zet de microfoon weer aan!
            }
        };

        window.speechSynthesis.speak(utterance);
    }
}