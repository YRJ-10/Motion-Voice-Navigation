if (typeof window.voiceNavInjected === 'undefined') {
    window.voiceNavInjected = true;
    window.autoScrollInterval = null;
    window.autoScrollSpeed = 2;

    let activeClickLabels = [];
    let clickMap = new Map();

    function removeClickLabels() {
        activeClickLabels.forEach(el => el.remove());
        activeClickLabels = [];
        clickMap.clear();
    }

    function drawClickLabels() {
        removeClickLabels();
        const selectors = 'a, button, input, [role="button"], video, .yt-simple-endpoint';
        const elements = document.querySelectorAll(selectors);
        let counter = 1;
        const drawnRects = [];
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            
            // 1. Filter Ukuran Minimum (Abaikan elemen sampah)
            if (rect.width < 15 || rect.height < 15) return;
            
            // Cek batas layar
            const inViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) && 
                rect.bottom > 0 && 
                rect.left < (window.innerWidth || document.documentElement.clientWidth) && 
                rect.right > 0;
            if (!inViewport) return;
            
            // 2. Filter Visibilitas Asli (CSS)
            const style = window.getComputedStyle(el);
            if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') return;
            
            // 3. Filter Tumpang Tindih (Anti-Overlap)
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            let isOverlapping = false;
            
            for (let drawn of drawnRects) {
                // Jarak antar pusat atau jarak antar sudut kiri atas
                const distCenter = Math.hypot(drawn.cx - cx, drawn.cy - cy);
                const distCorner = Math.hypot(drawn.left - rect.left, drawn.top - rect.top);
                
                // Jika posisi X,Y sangat berdekatan (< 20px), anggap itu elemen yang sama/berlapis
                if (distCenter < 20 || distCorner < 20) {
                    isOverlapping = true;
                    break;
                }
            }
            if (isOverlapping) return;
            
            // Lolos semua filter, simpan jejak
            drawnRects.push({ cx: cx, cy: cy, left: rect.left, top: rect.top });
                
            const label = document.createElement('div');
            label.innerText = counter;
            label.style.cssText = `
                position: fixed;
                top: ${rect.top <= 0 ? 5 : rect.top}px;
                left: ${rect.left <= 0 ? 5 : rect.left}px;
                background-color: rgba(20, 20, 20, 0.85);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                padding: 3px 7px;
                font-size: 13px;
                font-weight: bold;
                backdrop-filter: blur(4px);
                z-index: 999999;
                pointer-events: none;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(label);
            activeClickLabels.push(label);
            clickMap.set(counter, el);
            counter++;
        });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'EXECUTE_COMMAND') {
            const cmd = request.command;
            const payload = request.payload;
            
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
            else if (cmd === 'layar_penuh') {
                const player = document.querySelector('.html5-video-player') || document.querySelector('video');
                if (player) {
                    player.classList.add('ai-fake-fullscreen');
                    player.style.cssText = "position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; background: black !important;";
                }
            }
            else if (cmd === 'keluar_layar') {
                const player = document.querySelector('.ai-fake-fullscreen');
                if (player) {
                    player.classList.remove('ai-fake-fullscreen');
                    player.style.cssText = "";
                }
            }
            else if (cmd === 'putar_video') {
                if (window.location.hostname.includes('youtube.com')) {
                    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
                    if (player) player.focus();
                    const btn = document.querySelector('.ytp-play-button');
                    if (btn) btn.click();
                } else {
                    const video = document.querySelector('video');
                    if (video) {
                        if (video.paused) video.play().catch(()=>{});
                        else video.pause();
                    }
                }
            }
            else if (cmd === 'suara_video') {
                if (window.location.hostname.includes('youtube.com')) {
                    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
                    if (player) player.focus();
                    const btn = document.querySelector('.ytp-mute-button');
                    if (btn) btn.click();
                } else {
                    const video = document.querySelector('video');
                    if (video) video.muted = !video.muted;
                }
            }
            
            // --- Fitur Klik Cerdas ---
            else if (cmd === 'mode_klik') {
                drawClickLabels();
            }
            else if (cmd === 'batal_klik') {
                removeClickLabels();
            }
            // --- Fitur Pro: Dikte, TTS ---
            else if (cmd === 'ketik' && payload) {
                const el = document.activeElement;
                if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
                    if (el.isContentEditable) {
                        el.innerText = payload;
                    } else {
                        el.value = payload;
                    }
                    // Trigger events agar framework seperti React menyadari perubahan nilai
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            else if (cmd === 'eksekusi_klik') {
                const numKey = parseInt(payload, 10);
                console.log('[AI-KLIK] Menerima perintah. payload:', payload, '→ numKey:', numKey, '| clickMap size:', clickMap.size);
                const target = clickMap.get(numKey);
                console.log('[AI-KLIK] Target ditemukan:', target);
                if (target) {
                    try {
                        if (typeof target.focus === 'function') target.focus();
                        if (typeof target.click === 'function') target.click();
                        
                        const rect = target.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const eventOpts = { view: window, bubbles: true, cancelable: true, clientX: cx, clientY: cy };
                        
                        target.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
                        target.dispatchEvent(new MouseEvent('mousedown', eventOpts));
                        target.dispatchEvent(new PointerEvent('pointerup', eventOpts));
                        target.dispatchEvent(new MouseEvent('mouseup', eventOpts));
                        target.dispatchEvent(new MouseEvent('click', eventOpts));
                    } catch (e) {
                        console.error('[AI-KLIK] Error:', e);
                    } finally {
                        removeClickLabels();
                    }
                } else {
                    console.warn('[AI-KLIK] TIDAK ADA TARGET untuk nomor:', numKey, '| Keys di clickMap:', [...clickMap.keys()]);
                    removeClickLabels();
                }
            }
            
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
