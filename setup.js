document.getElementById('request-btn').addEventListener('click', async () => {
    const statusText = document.getElementById('status');
    try {
        // Meminta akses mikrofon secara eksplisit
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Jika berhasil, matikan kembali stream agar tidak dipakai terus
        stream.getTracks().forEach(track => track.stop());
        statusText.innerText = "✅ Izin berhasil diberikan! Silakan tutup tab ini dan klik 'Mulai Navigasi Suara' di popup ekstensi.";
        statusText.style.color = "#4CAF50";
    } catch (err) {
        console.error("Error getting mic permission:", err);
        statusText.innerText = "❌ Gagal mendapatkan izin: " + err.message + ". Pastikan Anda mengklik 'Allow'.";
        statusText.style.color = "red";
    }
});
