/* ---------- DOM refs ---------- */
const palette = document.getElementById('palette');
const blocks = [...palette.querySelectorAll('.block')];
const slots = [...document.querySelectorAll('.slot')];

/* ---------- helpers ---------- */
const blockFromType = type =>
    document.querySelector(`.block[data-module="${type}"]`);

const slotIsEmpty = slot => !slot.firstElementChild;

/* ---------- make any DOM node draggable ---------- */
function makeDraggable(node, moduleType) {
    node.draggable = true;
    node.addEventListener('dragstart', e => {
        e.dataTransfer.setData('widgetId', node.id);
        e.dataTransfer.setData('module', moduleType);
    });
}

/* ---------- palette blocks as drag sources ---------- */
blocks.forEach(b => {
    b.draggable = true;
    b.addEventListener('dragstart', e => {
        e.dataTransfer.setData('module', b.dataset.module);
    });
});

/* ---------- slots as drop targets ---------- */
slots.forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', handleSlotDrop);
});

function handleSlotDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    const widId = e.dataTransfer.getData('widgetId');
    const type = e.dataTransfer.getData('module');

    /* --- Move an existing widget ------------------------------------- */
    if (widId) {
        const w = document.getElementById(widId);
        if (w && slot !== w.parentElement && slotIsEmpty(slot)) {
            w.parentElement && blockFromType(w.dataset.module)
                .classList.remove('in-use');
            slot.appendChild(w);
            blockFromType(w.dataset.module).classList.add('in-use');
            saveLayout();
        }
        return;
    }

    /* --- Drop a fresh block ------------------------------------------ */
    if (!type || !slotIsEmpty(slot)) return;
    const block = blockFromType(type);
    if (block.classList.contains('in-use')) return;     // already placed

    const widget = window.modules[type]();              // create widget DOM
    widget.id = `w-${crypto.randomUUID()}`;
    widget.dataset.module = type;
    makeDraggable(widget, type);

    slot.appendChild(widget);
    block.classList.add('in-use');
    saveLayout();
}

/* ---------- palette as drop target (remove widget) ----------------- */
palette.addEventListener('dragover', e => e.preventDefault());
palette.addEventListener('drop', e => {
    e.preventDefault();
    const widId = e.dataTransfer.getData('widgetId');
    if (!widId) return;
    const w = document.getElementById(widId);
    if (!w) return;

    const type = w.dataset.module;
    blockFromType(type).classList.remove('in-use');
    w.remove();
    saveLayout();
});

/* ---------- persistence -------------------------------------------- */
function saveLayout() {
    const layout = slots.map(slot =>
        slotIsEmpty(slot)
            ? null
            : { slot: slot.dataset.slot, type: slot.firstElementChild.dataset.module }
    );
    localStorage.setItem('layout-v1', JSON.stringify(layout));
}

/* ---------- bootstrap previous layout ------------------------------ */
(function bootstrap() {
    const layout = JSON.parse(localStorage.getItem('layout-v1') || '[]');
    layout.forEach(entry => {
        if (!entry) return;
        const slot = document.querySelector(`.slot[data-slot="${entry.slot}"]`);
        const block = blockFromType(entry.type);
        if (!slot || !block || !slotIsEmpty(slot)) return;

        const widget = window.modules[entry.type]();
        widget.id = `w-${crypto.randomUUID()}`;
        widget.dataset.module = entry.type;
        makeDraggable(widget, entry.type);

        slot.appendChild(widget);
        block.classList.add('in-use');
    });
})();
