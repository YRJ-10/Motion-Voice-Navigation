document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    
    toggleBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
        window.close(); // Tutup popup otomatis
    });
});
