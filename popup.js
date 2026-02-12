document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const parseBtn = document.getElementById('parseBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const searchInput = document.getElementById('searchInput');
    const treeRoot = document.getElementById('treeRoot');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    const copyBtn = document.getElementById('copyBtn');

    const clearBtn = document.getElementById('clearBtn');
    const renderer = new JsonRenderer(treeRoot);

    // Check for fullscreen mode
    const urlParams = new URLSearchParams(window.location.search);
    const isFullscreen = urlParams.get('mode') === 'fullscreen';

    if (isFullscreen) {
        document.body.classList.add('full-screen');
        fullscreenBtn.textContent = 'Close Full Screen';
    }

    // Load last input
    chrome.storage.local.get(['lastJson'], (result) => {
        if (result.lastJson) {
            jsonInput.value = result.lastJson;
            if (result.lastJson.length < 500000) {
                tryParse(true); // Silent parse on load
            }
        }
    });

    // Auto-parse on input
    jsonInput.addEventListener('input', () => {
        tryParse(true); // Silent parse
    });

    parseBtn.addEventListener('click', () => tryParse(false)); // Explicit parse showing errors

    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        treeRoot.innerHTML = '';
        chrome.storage.local.remove(['lastJson']);
        jsonInput.focus();
    });

    copyBtn.addEventListener('click', () => {
        if (renderer.rootData) {
            const formatted = JSON.stringify(renderer.rootData, null, 2);
            navigator.clipboard.writeText(formatted).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = originalText, 1500);
            });
        }
    });

    // Handle Ctrl+A in tree view
    treeRoot.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            // Select all text within treeRoot
            const range = document.createRange();
            range.selectNodeContents(treeRoot);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    fullscreenBtn.addEventListener('click', () => {
        if (isFullscreen) {
            window.close();
        } else {
            chrome.tabs.create({ url: 'popup.html?mode=fullscreen' });
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderer.filter(e.target.value);
    });

    expandAllBtn.addEventListener('click', () => renderer.expandAll());
    collapseAllBtn.addEventListener('click', () => renderer.collapseAll());

    function tryParse(silent = false) {
        const raw = jsonInput.value.trim();
        if (!raw) {
            // If empty, clear tree but don't error
            treeRoot.innerHTML = '';
            return;
        }

        try {
            const data = JSON.parse(raw);
            chrome.storage.local.set({ lastJson: raw });
            renderer.render(data);
            // On success, any previous error message is wiped by render
        } catch (e) {
            if (!silent) {
                treeRoot.innerHTML = `<div style="color: red; padding: 10px;">Error parsing JSON: ${e.message}</div>`;
            }
            // If silent, do nothing (keep previous valid tree or empty)
        }
    }
});
