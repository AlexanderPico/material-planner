(function () {
    const create = window.WoodenPlanner;
    const layoutKey = 'layout-v1';
    const slots = [...document.querySelectorAll('#panel .slot')];
    const palette = document.getElementById('palette');

    /* --- helpers --- */
    function saveLayout(l) { localStorage.setItem(layoutKey, JSON.stringify(l)); }
    function loadLayout() { return JSON.parse(localStorage.getItem(layoutKey) || '[]'); }
    function findEmptySlot() { return slots.find(s => !s.firstElementChild); }

    /* --- initial render from storage --- */
    function render() {
        const layout = loadLayout();
        // clear slots
        slots.forEach(s => { s.innerHTML = ''; });
        // restore widgets
        layout.forEach(cfg => {
            const slot = document.querySelector(`[data-slot="${cfg.slot}"]`);
            if (slot) slot.append(create[cfg.type](cfg.props || {}));
        });
    }

    render();

    /* --- drag from palette to board --- */
    palette.addEventListener('dragstart', e => {
        const type = e.target.dataset.type;
        if (!type) return;
        e.dataTransfer.setData('text/plain', type);
    });

    /* --- drag from board back to palette --- */
    document.getElementById('panel').addEventListener('dragstart', e => {
        if (!e.target.classList.contains('widget')) return;
        const slotEl = e.target.closest('.slot');
        e.dataTransfer.setData('text/plain', JSON.stringify({ remove: slotEl.dataset.slot, type: e.target.dataset.type }));
    });

    /* --- slot dragover / drop --- */
    slots.forEach(slot => {
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault(); slot.classList.remove('drag-over');
            if (slot.firstElementChild) return; // already occupied
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            let type = data;
            try { const obj = JSON.parse(data); if (obj.remove) { removeFromLayout(obj.remove); type = obj.type; } } catch { }
            addToLayout(slot.dataset.slot, type);
        });
    });

    /* --- palette drop (remove) --- */
    palette.addEventListener('dragover', e => e.preventDefault());
    palette.addEventListener('drop', e => {
        const data = e.dataTransfer.getData('text/plain');
        try { const obj = JSON.parse(data); if (obj.remove) { removeFromLayout(obj.remove); } } catch { }
    });

    /* --- layout mutators --- */
    function addToLayout(slotId, type) {
        const layout = loadLayout();
        // avoid duplicates of same type
        if (layout.some(l => l.type === type)) return;
        layout.push({ slot: slotId, type });
        saveLayout(layout);
        render();
    }
    function removeFromLayout(slotId) {
        let layout = loadLayout();
        layout = layout.filter(l => l.slot !== slotId);
        saveLayout(layout);
        render();
    }

    /* --- palette blocks should grey out if already on board --- */
    function updatePalette() {
        const layout = loadLayout();
        [...palette.querySelectorAll('.block')].forEach(b => {
            const used = layout.some(l => l.type === b.dataset.type);
            b.style.opacity = used ? .5 : 1;
        });
    }
    window.addEventListener('storage', () => { render(); updatePalette(); });
    updatePalette();
})();