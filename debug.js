document.getElementById('start-btn').addEventListener('click', () => {
    const log = document.getElementById('log');
    const video = document.getElementById('video');
    
    log.innerHTML += `[${new Date().toLocaleTimeString()}] Meminta izin kamera dan mic murni...<br>`;
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            log.innerHTML += `<span style="color:green">[${new Date().toLocaleTimeString()}] Izin diberikan! Menampilkan video...</span><br>`;
            video.srcObject = stream;
            
            stream.getTracks().forEach(track => {
                log.innerHTML += `Track aktif: ${track.kind} - ${track.label}<br>`;
                track.onended = () => {
                    log.innerHTML += `<span style="color:red; font-weight:bold;">[${new Date().toLocaleTimeString()}] TRACK TERPUTUS (onended): ${track.kind} - ${track.label}</span><br>`;
                };
            });
        })
        .catch((err) => {
            log.innerHTML += `<span style="color:red; font-weight:bold;">[${new Date().toLocaleTimeString()}] ERROR: ${err.name} - ${err.message}</span><br>`;
        });
});
