class JsonRenderer {
    constructor(container) {
        this.container = container;
        this.rootData = null;
    }

    render(data) {
        this.rootData = data;
        this.container.innerHTML = '';

        // Formatted JSON string
        const jsonString = JSON.stringify(data, null, 4); // 4 spaces indent as per user pref/standard

        // Syntax Highlight
        // Regex to match:
        // 1. Keys: "key":
        // 2. Strings: "string"
        // 3. Numbers: 123
        // 4. Booleans: true/false
        // 5. Null: null

        const html = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="${cls}">${match}</span>`;
            });

        const pre = document.createElement('pre');
        pre.className = 'json-code';
        pre.innerHTML = html;
        this.container.appendChild(pre);
    }

    // Filter/Expand/Collapse are no longer relevant in text view, 
    // but we keep empty methods to avoid breaking existing calls in popup.js
    filter(term) {
        // Search could be implemented as highlighting in text, but for now we leave it empty or implement simple text search later
    }
    expandAll() { }
    collapseAll() { }
}

window.JsonRenderer = JsonRenderer;
