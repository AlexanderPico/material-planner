(function () {
    const panel = document.getElementById('panel');
    const wb = document.getElementById('workbench');
    const gear = document.getElementById('gear');
    const saveBtn = document.getElementById('wb-exit');
    const layoutKey = 'layout-v1';
    const create = window.WoodenPlanner;
    const slots = [...panel.querySelectorAll('.slot')];

    /* ---------- utilities ---------- */
    function loadLayout() { return JSON.parse(localStorage.getItem(layoutKey) || 'null'); }
    function saveLayout(l) { localStorage.setItem(layoutKey, JSON.stringify(l)); }

    /* ---------- render current layout ---------- */
    function renderLayout() {
        let layout = loadLayout();
        if (!layout) {
            layout = [
                { slot: 'TL', type: 'calendar' },
                { slot: 'TR', type: 'checklist' },
                { slot: 'BL', type: 'habit' },
                { slot: 'BR', type: 'gauge' },
                { slot: 'FT', type: 'pomodoro' }
            ]; saveLayout(layout);
        }

        slots.forEach(s => s.innerHTML = '');
        layout.forEach(cfg => {
            const slotEl = panel.querySelector(`[data-slot="${cfg.slot}"]`);
            if (slotEl) slotEl.append(create[cfg.type](cfg.props || {}));
        });
    }

    /* ---------- workbench controls ---------- */
    function openWB() { wb.hidden = false; }
    function closeWB() { wb.hidden = true; renderLayout(); }

    gear.addEventListener('click', openWB);

    saveBtn.addEventListener('click', () => {
        const sel = [...wb.querySelectorAll('[data-selected]')];
        if (sel.length) {
            const layout = [];
            sel.forEach((btn, i) => {
                if (slots[i]) layout.push({ slot: slots[i].dataset.slot, type: btn.dataset.type });
            });
            if (layout.length) saveLayout(layout);
        }
        // regardless of selections, exit overlay
        wb.querySelectorAll('[data-selected]').forEach(b => b.removeAttribute('data-selected'));
        closeWB();
    });

    /* palette selection visual */
    wb.querySelectorAll('#palette button[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.toggleAttribute('data-selected');
            btn.style.opacity = btn.hasAttribute('data-selected') ? 1 : .5;
        });
    });

    /* ---------- bootstrap ---------- */
    wb.hidden = true; // absolute guarantee overlay starts hidden
    renderLayout();
})();