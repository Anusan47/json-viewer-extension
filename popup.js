document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const parseBtn = document.getElementById('parseBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const searchInput = document.getElementById('searchInput');
    const treeRoot = document.getElementById('treeRoot');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    const clearBtn = document.getElementById('clearBtn');
    const renderer = new JsonRenderer(treeRoot);

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

    fullscreenBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
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
