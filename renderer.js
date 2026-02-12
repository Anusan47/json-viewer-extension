class JsonRenderer {
    constructor(container) {
        this.container = container;
        this.rootData = null;
    }

    render(data) {
        this.rootData = data;
        this.container.innerHTML = '';
        // We wrap in a root node to maintain consistency but we can style it to be invisible if needed.
        // Path starts at empty string or specific root.
        const rootNode = this.createNode('JSON', data, '');
        rootNode.classList.add('root');
        this.container.appendChild(rootNode);
    }

    createNode(key, value, path) {
        const type = this.getType(value);
        const isComplex = type === 'object' || type === 'array';

        // Determine path for this node
        // If path is empty, it's the root.
        // If we are inside the recursion, 'path' passed in is the PARENT's path.
        // Wait, the recursion below constructs the child path. 
        // So 'path' argument here IS the path to THIS node.

        const nodeEl = document.createElement('div');
        nodeEl.className = `node ${isComplex ? 'collapsible expanded' : 'leaf'}`;
        nodeEl.dataset.path = path;

        // Header
        const headerEl = document.createElement('div');
        headerEl.className = 'node-header';

        // Expand Icon
        const icon = document.createElement('span');
        icon.className = 'expand-icon';
        if (isComplex) {
            icon.onclick = (e) => {
                e.stopPropagation();
                this.toggleNode(nodeEl);
            };
        }
        headerEl.appendChild(icon);

        // Key
        // If key is 'JSON' (our root), we might want to hide it or show it.
        // Let's show it.
        const keyEl = document.createElement('span');
        keyEl.className = 'key';
        keyEl.textContent = key;
        keyEl.title = 'Click to copy path';
        keyEl.onclick = (e) => {
            e.stopPropagation();
            this.copyToClipboard(path || key); // Fallback to key if path empty
            this.showToast(e.pageX, e.pageY, 'Path copied!');
        };
        headerEl.appendChild(keyEl);

        const sep = document.createElement('span');
        sep.className = 'separator';
        sep.textContent = ': ';
        headerEl.appendChild(sep);

        // Value
        if (isComplex) {
            const openBracket = document.createElement('span');
            openBracket.textContent = type === 'array' ? '[' : '{';
            headerEl.appendChild(openBracket);

            const meta = document.createElement('span');
            meta.className = 'meta';
            const count = type === 'array' ? value.length : Object.keys(value).length;
            meta.textContent = type === 'array' ? `${count} items` : `${count} keys`;
            headerEl.appendChild(meta);

            const closeBracket = document.createElement('span');
            closeBracket.className = 'close-bracket-collapsed';
            closeBracket.textContent = type === 'array' ? '] ...' : '} ...';
            closeBracket.style.display = 'none';
            headerEl.appendChild(closeBracket);

            openBracket.onclick = meta.onclick = (e) => {
                e.stopPropagation();
                this.toggleNode(nodeEl);
            };

        } else {
            const valEl = document.createElement('span');
            valEl.className = `value ${type}`;
            valEl.textContent = this.formatValue(value, type);
            // Optional: Copy value on click
            valEl.onclick = (e) => {
                e.stopPropagation();
                // Copy raw value?
                this.copyToClipboard(String(value));
                this.showToast(e.pageX, e.pageY, 'Value copied!');
            };
            valEl.title = 'Click to copy value';
            headerEl.appendChild(valEl);
        }

        nodeEl.appendChild(headerEl);

        // Children
        if (isComplex) {
            const childrenEl = document.createElement('div');
            childrenEl.className = 'children';

            const keys = Object.keys(value);
            keys.forEach(k => {
                let childPath;
                if (path === '') {
                    childPath = k;
                } else {
                    if (type === 'array') {
                        childPath = `${path}[${k}]`;
                    } else {
                        // Check if key is simple identifier
                        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) {
                            childPath = `${path}.${k}`;
                        } else {
                            childPath = `${path}["${k}"]`;
                        }
                    }
                }

                const childNode = this.createNode(k, value[k], childPath);
                childrenEl.appendChild(childNode);
            });

            nodeEl.appendChild(childrenEl);

            const footerEl = document.createElement('div');
            footerEl.className = 'node-footer';
            footerEl.textContent = type === 'array' ? ']' : '}';
            childrenEl.appendChild(footerEl);
        }

        return nodeEl;
    }

    toggleNode(nodeEl) {
        nodeEl.classList.toggle('expanded');
        const isExpanded = nodeEl.classList.contains('expanded');

        const header = nodeEl.querySelector('.node-header');
        const closeBracket = header.querySelector('.close-bracket-collapsed');
        if (closeBracket) {
            closeBracket.style.display = isExpanded ? 'none' : 'inline';
        }
    }

    expandAll() {
        this.container.querySelectorAll('.collapsible').forEach(el => {
            el.classList.add('expanded');
            const cb = el.querySelector('.close-bracket-collapsed');
            if (cb) cb.style.display = 'none';
        });
    }

    collapseAll() {
        this.container.querySelectorAll('.collapsible').forEach(el => {
            if (!el.classList.contains('root')) {
                el.classList.remove('expanded');
                const cb = el.querySelector('.close-bracket-collapsed');
                if (cb) cb.style.display = 'inline';
            }
        });
    }

    filter(term) {
        const allNodes = this.container.querySelectorAll('.node');

        if (!term) {
            allNodes.forEach(el => el.classList.remove('hidden'));
            return;
        }

        term = term.toLowerCase();

        // First hide all
        allNodes.forEach(el => el.classList.add('hidden'));

        // Traverse and show matches
        allNodes.forEach(node => {
            const header = node.querySelector('.node-header');
            if (!header) return;

            const keyEl = header.querySelector('.key');
            const valEl = header.querySelector('.value');

            let matches = false;
            if (keyEl && keyEl.textContent.toLowerCase().includes(term)) matches = true;
            if (valEl && valEl.textContent.toLowerCase().includes(term)) matches = true;

            if (matches) {
                let curr = node;
                while (curr && curr !== this.container) {
                    curr.classList.remove('hidden');
                    if (curr.classList.contains('collapsible') && !curr.classList.contains('expanded')) {
                        curr.classList.add('expanded');
                        const cb = curr.querySelector('.close-bracket-collapsed');
                        if (cb) cb.style.display = 'none';
                    }
                    curr = curr.parentNode.closest('.node');
                }
            }
        });
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    formatValue(value, type) {
        if (type === 'string') return `"${value}"`;
        return String(value);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    showToast(x, y, msg) {
        let toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.left = x + 'px';
        toast.style.top = y + 'px';
        toast.style.background = '#333';
        toast.style.color = 'white';
        toast.style.padding = '4px 8px';
        toast.style.borderRadius = '4px';
        toast.style.fontSize = '12px';
        toast.style.pointerEvents = 'none';
        toast.style.zIndex = '99999';
        toast.style.opacity = '0.9';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 1500);
    }
}

window.JsonRenderer = JsonRenderer;
