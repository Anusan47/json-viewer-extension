// content.js
function isJsonPage() {
    // Basic detection
    const pre = document.body.querySelector('pre');
    if (document.body.childNodes.length === 1 && pre) {
        return tryParse(pre.innerText);
    } else if (document.body.childNodes.length > 0 && document.body.innerText.length < 10000000) {
        const txt = document.body.innerText.trim();
        if (txt.startsWith('{') || txt.startsWith('[')) {
            return tryParse(txt);
        }
    }
    return null;
}

function tryParse(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

const jsonData = isJsonPage();

if (jsonData) {
    console.log('JSON Viewer: JSON detected, rendering tree view...');

    // Inject CSS
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('styles.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.body.innerHTML = '';
    document.body.className = 'json-viewer-body';

    // Container
    const appContainer = document.createElement('div');
    appContainer.id = 'json-viewer-app';
    appContainer.className = 'viewer-container';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'viewer-toolbar';

    const rawBtn = document.createElement('button');
    rawBtn.textContent = 'Raw JSON';
    rawBtn.className = 'btn btn-secondary';

    const expandBtn = document.createElement('button');
    expandBtn.textContent = 'Expand All';
    expandBtn.className = 'btn btn-secondary hidden'; // Hidden for code view

    const collapseBtn = document.createElement('button');
    collapseBtn.textContent = 'Collapse All';
    collapseBtn.className = 'btn btn-secondary hidden'; // Hidden for code view

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Formatted';
    copyBtn.className = 'btn btn-primary';
    copyBtn.onclick = () => {
        const formatted = JSON.stringify(jsonData, null, 2);
        navigator.clipboard.writeText(formatted).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = originalText, 1500);
        });
    };

    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search...';
    searchInput.className = 'search-input hidden'; // Hidden for code view

    toolbar.appendChild(rawBtn);
    // toolbar.appendChild(expandBtn); // Keep hidden/removed
    // toolbar.appendChild(collapseBtn); // Keep hidden/removed
    toolbar.appendChild(copyBtn);
    // toolbar.appendChild(searchInput); // Keep hidden/removed

    appContainer.appendChild(toolbar);

    // Tree Container (Now Code Container)
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tree-root';
    treeContainer.className = 'json-tree'; // Keeping class for compatibility, or change to json-code-container
    treeContainer.tabIndex = 0; // Make focusable

    // Handle Ctrl+A
    treeContainer.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const range = document.createRange();
            range.selectNodeContents(treeContainer);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    appContainer.appendChild(treeContainer);

    // Raw Container (Hidden)
    const rawContainer = document.createElement('pre');
    rawContainer.className = 'raw-json hidden';
    rawContainer.textContent = JSON.stringify(jsonData, null, 2);
    appContainer.appendChild(rawContainer);

    document.body.appendChild(appContainer);

    if (typeof JsonRenderer !== 'undefined') {
        const renderer = new JsonRenderer(treeContainer);
        renderer.render(jsonData);

        rawBtn.onclick = () => {
            if (treeContainer.classList.contains('hidden')) {
                treeContainer.classList.remove('hidden');
                rawContainer.classList.add('hidden');
                rawBtn.textContent = 'Raw JSON';
            } else {
                treeContainer.classList.add('hidden');
                rawContainer.classList.remove('hidden');
                rawBtn.textContent = 'Formatted View';
            }
        };

    } else {
        console.error('JsonRenderer not loaded');
        treeContainer.textContent = 'Error: JsonRenderer library not loaded.';
    }
}
