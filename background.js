chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VOICE_COMMAND') {
    const cmd = message.command;
    const payload = message.payload;
    
    if (cmd === 'tab_baru') {
        chrome.tabs.create({});
        return;
    } else if (cmd === 'cari' && payload) {
        chrome.tabs.create({ url: 'https://www.google.com/search?q=' + encodeURIComponent(payload) });
        return;
    } else if (cmd === 'buka' && payload) {
        let url = payload.replace(/\s+/g, '');
        if (!url.includes('.')) url += '.com';
        chrome.tabs.create({ url: 'https://www.' + url });
        return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) return;
        const activeTab = tabs[0];
        
        if (cmd === 'tutup_tab') {
            if (!activeTab.url.includes('dashboard.html')) {
                chrome.tabs.remove(activeTab.id);
            }
            return;
        } else if (cmd === 'geser_kanan' || cmd === 'geser_kiri') {
            chrome.tabs.query({currentWindow: true}, (allTabs) => {
                let currentIndex = activeTab.index;
                let newIndex = cmd === 'geser_kanan' ? currentIndex + 1 : currentIndex - 1;
                if (newIndex >= allTabs.length) newIndex = 0;
                if (newIndex < 0) newIndex = allTabs.length - 1;
                chrome.tabs.update(allTabs[newIndex].id, {active: true});
            });
            return;
        } else if (cmd === 'perbesar') {
            chrome.tabs.getZoom(activeTab.id, (zoom) => chrome.tabs.setZoom(activeTab.id, zoom + 0.25));
            return;
        } else if (cmd === 'perkecil') {
            chrome.tabs.getZoom(activeTab.id, (zoom) => chrome.tabs.setZoom(activeTab.id, Math.max(0.25, zoom - 0.25)));
            return;
        } else if (cmd === 'layar_penuh') {
            chrome.windows.update(activeTab.windowId, { state: 'fullscreen' });
        } else if (cmd === 'keluar_layar') {
            chrome.windows.update(activeTab.windowId, { state: 'maximized' });
        }
        
        if (activeTab.url && (activeTab.url.startsWith('chrome://') || activeTab.url.includes(chrome.runtime.id))) {
            return;
        }
        
        chrome.scripting.executeScript({
          target: {tabId: activeTab.id},
          files: ['content.js']
        }, () => {
          chrome.tabs.sendMessage(activeTab.id, { type: 'EXECUTE_COMMAND', command: cmd, payload: payload });
        });
    });
  } else if (message.type === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    chrome.tabs.query({url: dashboardUrl}, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {active: true});
            chrome.windows.update(tabs[0].windowId, {focused: true});
        } else {
            chrome.tabs.create({ url: dashboardUrl, pinned: true });
        }
    });
  }
});
