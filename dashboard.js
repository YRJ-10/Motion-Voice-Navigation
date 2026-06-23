let recognition;
let isRecording = false;
let lastCommandTime = 0;
let lastTriggeredWordCount = 0;
let lastTriggeredCmd = "";
let lastResultIndex = -1;

function startRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        document.getElementById('transcript').innerText = "Browser tidak mendukung Speech Recognition.";
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onstart = function() {
        isRecording = true;
        document.getElementById('indicator').style.background = '#4CAF50';
        document.getElementById('indicator').style.animation = 'pulse 1.5s infinite';
    };

    recognition.onresult = function(event) {
        if (event.resultIndex !== lastResultIndex) {
            lastTriggeredWordCount = 0;
            lastResultIndex = event.resultIndex;
        }

        let isFinal = event.results[event.results.length - 1].isFinal;

        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript.toLowerCase() + " ";
        }
        
        let cleanTranscript = currentTranscript.toLowerCase().replace(/[.,!?]/g, "").trim();
        document.getElementById('transcript').innerText = `Mendengar: "${cleanTranscript}..."`;
        
        let now = Date.now();
        let words = cleanTranscript.split(/\s+/);
        let newWords = words.slice(lastTriggeredWordCount);
        let newPhrase = newWords.join(" ");
        
        let cmd = null;
        let payload = null;

        if (newPhrase.includes('tab baru')) cmd = 'tab_baru';
        else if (newPhrase.includes('tutup tab')) cmd = 'tutup_tab';
        else if (newPhrase.includes('geser kanan') || newPhrase.includes('tab kanan')) cmd = 'geser_kanan';
        else if (newPhrase.includes('geser kiri') || newPhrase.includes('tab kiri')) cmd = 'geser_kiri';
        else if (newPhrase.includes('auto atas') || newPhrase.includes('baca atas')) cmd = 'auto_atas';
        else if (newPhrase.includes('auto bawah') || newPhrase.includes('baca bawah')) cmd = 'auto_bawah';
        else if (newPhrase.includes('puncak') || newPhrase.includes('paling atas')) cmd = 'puncak';
        else if (newPhrase.includes('dasar') || newPhrase.includes('paling bawah')) cmd = 'dasar';
        else if (newPhrase.includes('perbesar') || newPhrase.includes('zoom in')) cmd = 'perbesar';
        else if (newPhrase.includes('perkecil') || newPhrase.includes('zoom out')) cmd = 'perkecil';
        else if (newPhrase.includes('salin') || newPhrase.includes('copy')) cmd = 'salin';
        else if (newPhrase.includes('tempel') || newPhrase.includes('paste')) cmd = 'tempel';
        else if (newPhrase.includes('layar penuh') || newPhrase.includes('full screen')) cmd = 'layar_penuh';
        else if (newPhrase.includes('keluar layar') || newPhrase.includes('exit fullscreen')) cmd = 'keluar_layar';
        else if (newPhrase.includes('putar') || newPhrase.includes('jeda') || newPhrase.includes('stop') || newPhrase.includes('play') || newPhrase.includes('pause')) cmd = 'putar_video';
        else if (newPhrase.includes('bisukan') || newPhrase.includes('mute') || newPhrase.includes('suara')) cmd = 'suara_video';
        
        // --- Fitur Klik Cerdas ---
        else if (newPhrase === 'klik' || newPhrase === 'mode klik' || newPhrase === 'tampilkan klik') cmd = 'mode_klik';
        else if (newPhrase === 'batal' || newPhrase === 'batal klik' || newPhrase === 'cancel') cmd = 'batal_klik';
        else if (newPhrase.startsWith('klik ')) {
            let target = newPhrase.substring(5).trim();
            const numMap = {'satu':1,'dua':2,'tiga':3,'empat':4,'lima':5,'enam':6,'tujuh':7,'delapan':8,'sembilan':9,'sepuluh':10,'sebelas':11,'dua belas':12,'tiga belas':13,'dua puluh':20,'kosong':0};
            let num = numMap[target] !== undefined ? numMap[target] : parseInt(target);
            if (!isNaN(num)) { cmd = 'eksekusi_klik'; payload = num; }
        }
        else if (newPhrase.includes('cari ')) {
            cmd = 'cari';
            payload = newPhrase.substring(newPhrase.indexOf('cari ') + 5).trim();
        } else if (newPhrase.includes('buka ')) {
            cmd = 'buka';
            payload = newPhrase.substring(newPhrase.indexOf('buka ') + 5).trim();
        }
        
        // --- Fitur Pro: Dikte, Pindah Tab, TTS ---
        else if (newPhrase.startsWith('ketik ')) {
            cmd = 'ketik';
            payload = newPhrase.substring(6).trim();
        }
        else if (newPhrase.startsWith('pindah tab ') || newPhrase.startsWith('ke tab ')) {
            cmd = 'pindah_tab';
            let prefixLen = newPhrase.startsWith('pindah tab ') ? 11 : 7;
            payload = newPhrase.substring(prefixLen).trim();
        }
        else if (newPhrase.includes('berhenti baca') || newPhrase.includes('stop baca')) cmd = 'stop_baca';
        else if (newPhrase.includes('bacakan') || newPhrase.includes('baca ini')) cmd = 'bacakan';
        
        if (!cmd && newWords.length > 0) {
            for (let i = newWords.length - 1; i >= 0; i--) {
                let w = newWords[i];
                if (['bawah', 'lanjut', 'turun'].includes(w)) { cmd = 'bawah'; break; }
                if (['atas', 'naik'].includes(w)) { cmd = 'atas'; break; }
                if (['kanan'].includes(w)) { cmd = 'kanan'; break; }
                if (['kiri'].includes(w)) { cmd = 'kiri'; break; }
                if (['spasi', 'jeda', 'stop', 'berhenti'].includes(w)) { cmd = 'spasi'; break; }
                if (['enter', 'masuk'].includes(w)) { cmd = 'enter'; break; }
                if (['segarkan', 'refresh', 'ulang'].includes(w)) { cmd = 'segarkan'; break; }
                if (['kembali', 'mundur', 'balik'].includes(w)) { cmd = 'kembali'; break; }
                if (['penuh', 'fullscreen'].includes(w)) { cmd = 'layar_penuh'; break; }
                if (['putar', 'jeda', 'stop', 'play', 'pause'].includes(w)) { cmd = 'putar_video'; break; }
                if (['bisukan', 'mute', 'suara', 'bisik'].includes(w)) { cmd = 'suara_video'; break; }
                
                // Fitur Klik Cerdas
                if (['klik'].includes(w)) { cmd = 'mode_klik'; break; }
                if (['batal', 'cancel'].includes(w)) { cmd = 'batal_klik'; break; }
                
                const numMapSingle = {'satu':1,'dua':2,'tiga':3,'empat':4,'lima':5,'enam':6,'tujuh':7,'delapan':8,'sembilan':9,'sepuluh':10};
                let n = numMapSingle[w] !== undefined ? numMapSingle[w] : parseInt(w);
                if (!isNaN(n)) { cmd = 'eksekusi_klik'; payload = n; break; }
                
                // Fitur Baru
                if (['baca', 'otomatis'].includes(w)) { cmd = 'auto_bawah'; break; }
                if (['cepat', 'ngebut'].includes(w)) { cmd = 'cepat'; break; }
                if (['lambat', 'pelan'].includes(w)) { cmd = 'lambat'; break; }
                if (['suka', 'like', 'mantap'].includes(w)) { cmd = 'suka'; break; }
                if (['bacakan'].includes(w)) { cmd = 'bacakan'; break; }
            }
        }

        if (cmd) {
            if ((cmd === 'cari' || cmd === 'buka' || cmd === 'eksekusi_klik' || cmd === 'ketik' || cmd === 'pindah_tab') && !isFinal) {
                return;
            }

            if (cmd === lastTriggeredCmd && (now - lastCommandTime < 500)) {
                // abaikan duplikat cepat
            } else {
                chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', command: cmd, payload: payload });
                lastCommandTime = now;
                lastTriggeredWordCount = words.length;
                lastTriggeredCmd = cmd;
            }
        }
    };

    recognition.onerror = function(event) {
        if (event.error === 'not-allowed') {
            document.getElementById('transcript').innerText = "Izin mikrofon ditolak!";
            document.getElementById('indicator').style.background = 'red';
            document.getElementById('indicator').style.animation = 'none';
        }
    };

    recognition.onend = function() {
        if (isRecording && document.getElementById('indicator').style.background !== 'red') {
            try { recognition.start(); } catch (e) {}
        }
    };

    try { recognition.start(); } catch (e) {}
}

// --- Anti-Throttling Hack ---
// Memutar frekuensi tak terdengar agar Chrome mengira tab ini sedang memutar lagu (tidak akan pernah ditidurkan)
function startAntiThrottlingAudio() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 20000; // Ultrasonik
        gainNode.gain.value = 0.01;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
    } catch (e) {}
}

navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        stream.getTracks().forEach(track => track.stop());
        startAntiThrottlingAudio();
        startRecognition();
    })
    .catch((err) => {
        document.getElementById('transcript').innerText = "Gagal mengakses mikrofon.";
        document.getElementById('indicator').style.background = '#ff9800';
    });

// --- Motion Tracking Logic (Auto-Connect Python WebSocket) ---
let ws = null;
const toggleCamBtn = document.getElementById('toggle-cam');
const webcam = document.getElementById('webcam');
const motionStatus = document.getElementById('motion-status');

if (webcam) webcam.style.display = 'none';
toggleCamBtn.style.display = 'none'; // Tombol tidak lagi dibutuhkan

let isConnecting = false;

function connectMotionServer() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) || isConnecting) {
        return;
    }
    
    isConnecting = true;
    ws = new WebSocket('ws://localhost:8765');

    ws.onopen = () => {
        isConnecting = false;
        motionStatus.innerText = '✅ Terhubung ke AI Python (Auto). Sensor Wajah Aktif!';
        motionStatus.style.color = '#4CAF50';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'MOTION_COMMAND' && data.command) {
                chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', command: data.command, payload: null });
                motionStatus.innerText = `🔄 Perintah Wajah: ${data.command.toUpperCase()}`;
                
                setTimeout(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        motionStatus.innerText = '✅ Terhubung ke AI Python (Auto). Sensor Wajah Aktif!';
                    }
                }, 1000);
            }
        } catch (e) {
            console.error("Error parsing websocket message", e);
        }
    };

    ws.onclose = () => {
        isConnecting = false;
        motionStatus.innerText = '❌ AI Python tidak aktif. (Buka Mulai_AI.bat untuk menyalakan)';
        motionStatus.style.color = '#aaa';
        ws = null;
    };
    
    ws.onerror = (err) => {
        isConnecting = false;
    };
}

// Coba auto-connect setiap 3 detik di latar belakang
setInterval(connectMotionServer, 3000);
// Langsung coba saat halaman dimuat
connectMotionServer();
