/* === DOM refs === */
const palette = document.getElementById('palette');
const blocks = [...palette.querySelectorAll('.block')];
const slots = [...document.querySelectorAll('.slot')];

/* === helpers === */
const findBlock = type => document.querySelector(`.block[data-module="${type}"]`);
const slotIsEmpty = slot => !slot.firstElementChild;

/* give any node drag‑source behaviour */
function makeDraggable(node, type) {
    node.draggable = true;
    node.addEventListener('dragstart', e => {
        e.dataTransfer.setData('widgetId', node.id);   // present for existing widgets
        e.dataTransfer.setData('module', type);      // always present
    });
}

/* === palette blocks → drag sources === */
blocks.forEach(b => {
    makeDraggable(b, b.dataset.module);
});

/* === slots → drop targets === */
slots.forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => handleSlotDrop(e, slot));
});

function handleSlotDrop(e, slot) {
    e.preventDefault();
    const type = e.dataTransfer.getData('module');
    const widId = e.dataTransfer.getData('widgetId');

    /* --- move an existing widget -------------------------------- */
    if (widId) {
        const w = document.getElementById(widId);
        if (!w || slot === w.parentElement || !slotIsEmpty(slot)) return;

        /* update palette */
        const oldBlock = findBlock(w.dataset.module);
        oldBlock && oldBlock.classList.remove('in-use');

        slot.appendChild(w);
        const newBlock = findBlock(type);
        newBlock && newBlock.classList.add('in-use');
        saveLayout();
        return;
    }

    /* --- place a fresh block ----------------------------------- */
    if (!type || !slotIsEmpty(slot)) return;
    const srcBlock = findBlock(type);
    if (!srcBlock || srcBlock.classList.contains('in-use')) return;

    /* build widget */
    const widget = window.modules[type]();
    widget.id = `w-${crypto.randomUUID()}`;
    widget.dataset.module = type;
    makeDraggable(widget, type);

    slot.appendChild(widget);
    srcBlock.classList.add('in-use');
    saveLayout();
}

/* === palette → drop target (remove widget) === */
palette.addEventListener('dragover', e => e.preventDefault());
palette.addEventListener('drop', e => {
    e.preventDefault();
    const widId = e.dataTransfer.getData('widgetId');
    if (!widId) return;

    const w = document.getElementById(widId);
    const type = w?.dataset.module;
    if (!w || !type) return;

    w.parentElement && (w.parentElement.innerHTML = '');  // clear slot
    w.remove();

    const blk = findBlock(type);
    blk && blk.classList.remove('in-use');

    saveLayout();
});

/* === persist === */
function saveLayout() {
    const layout = slots.map(sl =>
        slotIsEmpty(sl) ? null : { slot: sl.dataset.slot, type: sl.firstElementChild.dataset.module }
    );
    localStorage.setItem('layout-v1', JSON.stringify(layout));
}

/* === bootstrap previous layout === */
(function () {
    const layout = JSON.parse(localStorage.getItem('layout-v1') || '[]');
    layout.forEach(item => {
        if (!item) return;
        const slot = document.querySelector(`.slot[data-slot="${item.slot}"]`);
        const block = findBlock(item.type);
        if (!slot || !block || !slotIsEmpty(slot)) return;

        const widget = window.modules[item.type]();
        widget.id = `w-${crypto.randomUUID()}`;
        widget.dataset.module = item.type;
        makeDraggable(widget, item.type);

        slot.appendChild(widget);
        block.classList.add('in-use');
    });
})();
