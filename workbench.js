(function () {
    const panel = document.getElementById('panel');
    const wb = document.getElementById('workbench');
    const gear = document.getElementById('gear');
    const saveBtn = document.getElementById('wb-exit');
    const layoutKey = 'layout-v1';
    const create = WoodenPlanner;

    const slots = [...panel.querySelectorAll('.slot')];

    function renderLayout() {
        let layout = JSON.parse(localStorage.getItem(layoutKey) || 'null');
        if (!layout) {
            layout = [
                { slot: 'TL', type: 'calendar' },
                { slot: 'TR', type: 'checklist' },
                { slot: 'BL', type: 'habit' },
                { slot: 'BR', type: 'gauge' },
                { slot: 'FT', type: 'pomodoro' }
            ]; localStorage.setItem(layoutKey, JSON.stringify(layout));
        }
        slots.forEach(s => s.innerHTML = '');
        layout.forEach(cfg => {
            const slotEl = panel.querySelector(`[data-slot="${cfg.slot}"]`);
            if (slotEl) slotEl.append(create[cfg.type](cfg.props));
        });
    }

    /* -------- workbench UI -------- */
    function openWB() { wb.hidden = false; }
    function closeWB() { wb.hidden = true; renderLayout(); }
    gear.addEventListener('click', openWB);
    saveBtn.addEventListener('click', () => {
        // gather current palette order – simple list based on user clicks
        const layout = [];
        let i = 0;
        wb.querySelectorAll('[data-selected]').forEach(btn => {
            if (!slots[i]) return; layout.push({ slot: slots[i].dataset.slot, type: btn.dataset.type }); i++;
        });
        if (layout.length) localStorage.setItem(layoutKey, JSON.stringify(layout));
        closeWB();
    });

    // palette select behaviour (click to mark order)
    wb.querySelectorAll('#palette button[data-type]').forEach(btn => {
        btn.addEventListener('click', () => { btn.toggleAttribute('data-selected'); btn.style.opacity = btn.hasAttribute('data-selected') ? 1 : .5; });
    });

    renderLayout();
})();
