/* ---------- DOM refs ---------- */
const palette = document.getElementById('palette');
const blocks = [...palette.querySelectorAll('.block')];
const slots = [...document.querySelectorAll('.slot')];

/* ---------- helper ---------- */
function blockFromType(type) {
    return document.querySelector(`.block[data-module="${type}"]`);
}

/* ---------- drag sources ---------- */
// palette blocks
blocks.forEach(b => {
    b.draggable = true;
    b.addEventListener('dragstart', e => {
        e.dataTransfer.setData('module', b.dataset.module);
    });
});

// widgets that are already on the board (created later, see observeSlot)
function makeWidgetDraggable(widget) {
    widget.draggable = true;
    widget.addEventListener('dragstart', e => {
        e.dataTransfer.setData('widgetId', widget.id);
        e.dataTransfer.setData('module', widget.dataset.module);
    });
}

/* ---------- slot targets ---------- */
slots.forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('module');
        const widId = e.dataTransfer.getData('widgetId');

        // CASE 1: we’re moving an existing widget -> just re‑parent it
        if (widId) {
            const w = document.getElementById(widId);
            if (w && slot !== w.parentElement) {
                w.parentElement.classList.add('empty');
                slot.classList.remove('empty');
                slot.appendChild(w);
                saveLayout();
            }
            return;
        }

        // CASE 2: we’re dropping a fresh palette block
        if (!type || !slot.classList.contains('empty')) return;
        const block = blockFromType(type);
        if (block.classList.contains('in-use')) return;   // already placed elsewhere

        const widget = window.modules[type](/* returns DOM node */);
        widget.id = `w-${crypto.randomUUID()}`;
        widget.dataset.module = type;
        makeWidgetDraggable(widget);

        slot.classList.remove('empty');
        slot.appendChild(widget);
        block.classList.add('in-use');
        saveLayout();
    });
});

/* ---------- palette target ---------- */
palette.addEventListener('dragover', e => e.preventDefault());
palette.addEventListener('drop', e => {
    e.preventDefault();
    const widId = e.dataTransfer.getData('widgetId');
    if (!widId) return;

    const widget = document.getElementById(widId);
    if (!widget) return;

    const type = widget.dataset.module;
    const block = blockFromType(type);

    // remove widget from its slot
    widget.parentElement.classList.add('empty');
    widget.remove();
    block.classList.remove('in-use');
    saveLayout();
});

/* ---------- layout persistence ---------- */
function saveLayout() {
    const layout = slots.map(s => {
        if (s.classList.contains('empty')) return null;
        return { slot: s.dataset.slot, type: s.firstElementChild.dataset.module };
    });
    localStorage.setItem('layout-v1', JSON.stringify(layout));
}

/* ---------- recreate layout on load ---------- */
(function bootstrap() {
    const parts = JSON.parse(localStorage.getItem('layout-v1') || '[]');
    parts.forEach(p => {
        const slot = document.querySelector(`.slot[data-slot="${p.slot}"]`);
        const block = blockFromType(p.type);
        if (!slot || !block) return;

        const widget = window.modules[p.type]();
        widget.id = `w-${crypto.randomUUID()}`;
        widget.dataset.module = p.type;
        makeWidgetDraggable(widget);

        slot.classList.remove('empty');
        slot.appendChild(widget);
        block.classList.add('in-use');
    });
})();
