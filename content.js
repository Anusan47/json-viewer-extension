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
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#f8f9fa';

    // Container
    const appContainer = document.createElement('div');
    appContainer.id = 'json-viewer-app';
    appContainer.style.padding = '20px';
    appContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.marginBottom = '20px';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '10px';
    toolbar.style.alignItems = 'center';

    const rawBtn = document.createElement('button');
    rawBtn.textContent = 'Raw JSON';
    styleButton(rawBtn);

    const expandBtn = document.createElement('button');
    expandBtn.textContent = 'Expand All';
    styleButton(expandBtn);

    const collapseBtn = document.createElement('button');
    collapseBtn.textContent = 'Collapse All';
    styleButton(collapseBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Formatted';
    styleButton(copyBtn);
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
    searchInput.style.padding = '6px 10px';
    searchInput.style.borderRadius = '4px';
    searchInput.style.border = '1px solid #dee2e6';
    searchInput.style.width = '200px';

    toolbar.appendChild(rawBtn);
    toolbar.appendChild(expandBtn);
    toolbar.appendChild(collapseBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(searchInput);

    appContainer.appendChild(toolbar);

    // Tree Container
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tree-root';
    treeContainer.className = 'json-tree';
    treeContainer.tabIndex = 0; // Make focusable
    treeContainer.style.outline = 'none';

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
    rawContainer.style.display = 'none';
    rawContainer.style.whiteSpace = 'pre-wrap';
    rawContainer.style.wordBreak = 'break-all';
    rawContainer.style.backgroundColor = '#fff';
    rawContainer.style.padding = '10px';
    rawContainer.style.border = '1px solid #dee2e6';
    rawContainer.style.borderRadius = '4px';
    rawContainer.textContent = JSON.stringify(jsonData, null, 2);
    appContainer.appendChild(rawContainer);

    document.body.appendChild(appContainer);

    if (typeof JsonRenderer !== 'undefined') {
        const renderer = new JsonRenderer(treeContainer);
        renderer.render(jsonData);

        searchInput.addEventListener('input', (e) => renderer.filter(e.target.value));
        expandBtn.onclick = () => renderer.expandAll();
        collapseBtn.onclick = () => renderer.collapseAll();

        rawBtn.onclick = () => {
            if (treeContainer.style.display !== 'none') {
                treeContainer.style.display = 'none';
                rawContainer.style.display = 'block';
                rawBtn.textContent = 'Tree View';
                // Hide other controls?
                expandBtn.style.display = 'none';
                collapseBtn.style.display = 'none';
                searchInput.style.display = 'none';
            } else {
                treeContainer.style.display = 'block';
                rawContainer.style.display = 'none';
                rawBtn.textContent = 'Raw JSON';
                expandBtn.style.display = 'inline-block';
                collapseBtn.style.display = 'inline-block';
                searchInput.style.display = 'inline-block';
            }
        };

    } else {
        console.error('JsonRenderer not loaded');
        treeContainer.textContent = 'Error: JsonRenderer library not loaded.';
    }
}

function styleButton(btn) {
    btn.style.backgroundColor = '#0d6efd';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '6px 12px';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = '500';
    btn.onmouseover = () => btn.style.backgroundColor = '#0b5ed7';
    btn.onmouseout = () => btn.style.backgroundColor = '#0d6efd';
}
