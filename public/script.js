const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat');

// Check of de browser Web Speech API ondersteunt
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Oeps! Je browser ondersteunt deze microfoon-tool niet. Gebruik Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL'; // Nederlandse spraakherkenning
    recognition.continuous = true; // Blijf luisteren
    recognition.interimResults = false; // Stuur pas data als iemand klaar is met praten

    let isListening = false;

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

    // Wat gebeurt er als de browser tekst heeft gehoord?
    recognition.onresult = async (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;

        // Laat zien wat de kinderen zeiden (in grijs)
        appendMessage("Jullie: " + transcript, "user-message");

        // Stuur de tekst naar je backend (Node.js)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript })
            });

            const data = await response.json();
            
            // Laat het antwoord van de AI zien (in blauw)
            appendMessage("AI Coach: " + data.reply, "ai-message");

            // Extra tof: Laat de browser het antwoord ook hardop voorlezen!
            speak(data.reply);

        } catch (error) {
            console.error("Fout:", error);
            appendMessage("AI Coach: Oeps, de verbinding is even weg.", "ai-message");
        }
    };

    function appendMessage(text, className) {
        const p = document.createElement('p');
        p.className = className;
        p.innerText = text;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll automatisch naar beneden
    }

    // Laat de AI terugpraten met een computerstem
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL';
        window.speechSynthesis.speak(utterance);
    }
}