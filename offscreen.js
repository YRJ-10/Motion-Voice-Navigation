// Request microphone access
// The offscreen document will use webkitSpeechRecognition
let recognition;
let isRecording = false;

function startRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        console.error("Speech recognition not supported in this browser.");
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = false;
    recognition.lang = 'id-ID'; // Indonesian

    recognition.onstart = function() {
        console.log("Voice recognition started.");
        isRecording = true;
    };

    recognition.onresult = function(event) {
        // Get the latest transcript
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                let transcript = event.results[i][0].transcript.trim().toLowerCase();
                console.log("Recognized:", transcript);
                
                // Parse command
                if (transcript.includes('bawah') || transcript.includes('lanjut') || transcript.includes('next')) {
                    sendCommand('bawah');
                } else if (transcript.includes('atas') || transcript.includes('kembali') || transcript.includes('prev')) {
                    sendCommand('atas');
                } else if (transcript.includes('kanan')) {
                    sendCommand('kanan');
                } else if (transcript.includes('kiri')) {
                    sendCommand('kiri');
                } else if (transcript.includes('jeda') || transcript.includes('stop')) {
                    sendCommand('jeda');
                }
            }
        }
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function() {
        console.log("Voice recognition ended.");
        // Auto restart if it wasn't intentionally stopped
        if (isRecording) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to auto-restart:", e);
            }
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Failed to start recognition:", e);
    }
}

function sendCommand(cmd) {
    chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', command: cmd });
}

// Ensure getUserMedia permission has been granted, then start
navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        // Stop the stream right away, we just needed to check permission
        stream.getTracks().forEach(track => track.stop());
        startRecognition();
    })
    .catch((err) => {
        console.error("Microphone permission denied or error:", err);
    });
