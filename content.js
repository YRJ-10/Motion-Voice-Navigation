if (typeof window.voiceNavInjected === 'undefined') {
    window.voiceNavInjected = true;
    window.autoScrollInterval = null;
    window.autoScrollSpeed = 2;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'EXECUTE_COMMAND') {
            const cmd = request.command;
            
            // Auto-stop jika ada perintah manual selain pengaturan baca
            if (window.autoScrollInterval && !['cepat', 'lambat', 'auto_bawah', 'auto_atas'].includes(cmd)) {
                clearInterval(window.autoScrollInterval);
                window.autoScrollInterval = null;
            }
            
            let key = '';
            let keyCode = 0;
            
            if (cmd === 'bawah') { key = 'ArrowDown'; keyCode = 40; }
            else if (cmd === 'atas') { key = 'ArrowUp'; keyCode = 38; }
            else if (cmd === 'kanan') { key = 'ArrowRight'; keyCode = 39; }
            else if (cmd === 'kiri') { key = 'ArrowLeft'; keyCode = 37; }
            else if (cmd === 'spasi') { key = ' '; keyCode = 32; }
            else if (cmd === 'enter') { key = 'Enter'; keyCode = 13; }

            if (cmd === 'segarkan') { window.location.reload(); }
            else if (cmd === 'kembali') { window.history.back(); }
            else if (cmd === 'puncak') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
            else if (cmd === 'dasar') { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
            else if (cmd === 'salin') { document.execCommand('copy'); }
            else if (cmd === 'tempel') { document.execCommand('paste'); }
            
            // Fitur Baru: Auto Scroll & Auto Like
            else if (cmd === 'auto_bawah' || cmd === 'auto_atas') {
                window.autoScrollDirection = (cmd === 'auto_bawah') ? 1 : -1;
                if (!window.autoScrollInterval) {
                    window.autoScrollInterval = setInterval(() => {
                        window.scrollBy(0, window.autoScrollSpeed * window.autoScrollDirection);
                    }, 20);
                }
            } else if (cmd === 'cepat') {
                window.autoScrollSpeed += 1;
            } else if (cmd === 'lambat') {
                window.autoScrollSpeed = Math.max(1, window.autoScrollSpeed - 1);
            } else if (cmd === 'suka') {
                // Radar khusus Instagram
                if (window.location.hostname.includes('instagram.com')) {
                    // Cari ikon Suka/Like (menghindari tombol like komentar yang ukurannya kecil)
                    const icons = document.querySelectorAll('svg[aria-label="Like"], svg[aria-label="Suka"]');
                    let mainLikeBtn = null;
                    
                    for (let icon of icons) {
                        // Cek apakah icon ada di layar yang terlihat (viewport)
                        const rect = icon.getBoundingClientRect();
                        const isVisible = (rect.top >= 0 && rect.bottom <= window.innerHeight && rect.width > 0);

                        // Tombol like utama biasanya berukuran 24x24 pixel, like komentar < 16px
                        if ((icon.clientWidth > 16 || icon.clientHeight > 16 || icon.getAttribute('height') > '16') && isVisible) {
                            mainLikeBtn = icon;
                            break;
                        }
                    }
                    
                    if (!mainLikeBtn && icons.length > 0) mainLikeBtn = icons[0];
                    
                    if (mainLikeBtn) {
                        const likeButton = mainLikeBtn.closest('button, [role="button"], a') || mainLikeBtn.parentNode;
                        if (likeButton) {
                            likeButton.click();
                            return; // Selesai, jangan lanjut eksekusi double-click
                        }
                    }
                }

                // Default untuk TikTok & Website Lain (Klik ganda di tengah layar)
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const activeElement = document.elementFromPoint(centerX, centerY) || document.body;
                
                const eventOpts = {
                    view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY
                };
                
                // TikTok dan Instagram menggunakan framework React modern yang seringkali mengabaikan
                // event 'dblclick' mentah. Kita harus menyimulasikan urutan klik fisik secara utuh.
                const simulateClick = () => {
                    activeElement.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
                    activeElement.dispatchEvent(new MouseEvent('mousedown', eventOpts));
                    activeElement.dispatchEvent(new PointerEvent('pointerup', eventOpts));
                    activeElement.dispatchEvent(new MouseEvent('mouseup', eventOpts));
                    activeElement.dispatchEvent(new MouseEvent('click', eventOpts));
                };

                // Tembakan klik pertama
                simulateClick();
                
                // Jeda 120 milidetik layaknya jari manusia, lalu tembakan klik kedua
                // (Tanpa mengirim event 'dblclick' mentah agar tidak tereksekusi 2x oleh TikTok)
                setTimeout(() => {
                    simulateClick();
                }, 120);
            }

            if (key) {
                const activeElement = document.activeElement || document.body;
                const eventOpts = { key: key, code: key, keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true, composed: true };
                activeElement.dispatchEvent(new KeyboardEvent('keydown', eventOpts));
                activeElement.dispatchEvent(new KeyboardEvent('keypress', eventOpts));
                activeElement.dispatchEvent(new KeyboardEvent('keyup', eventOpts));
                
                // 2. Fallback: Scroll layar secara manual
                setTimeout(() => {
                    if (cmd === 'bawah') window.scrollBy({ top: window.innerHeight * 0.8, left: 0, behavior: 'smooth' });
                    else if (cmd === 'atas') window.scrollBy({ top: -window.innerHeight * 0.8, left: 0, behavior: 'smooth' });
                    else if (cmd === 'kanan') window.scrollBy({ top: 0, left: window.innerWidth * 0.5, behavior: 'smooth' });
                    else if (cmd === 'kiri') window.scrollBy({ top: 0, left: -window.innerWidth * 0.5, behavior: 'smooth' });
                }, 50);
            }
        }
    });
}
