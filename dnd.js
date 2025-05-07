/* === DOM refs === */
const palette = document.getElementById('palette');
const blocks = [...palette.querySelectorAll('.block')];
const slots = [...document.querySelectorAll('.slot')];

/* === helpers === */
const findBlock = type => document.querySelector(`.block[data-module="${type}"]`);
const slotIsEmpty = slot => !slot.firstElementChild;

// Apply current wood texture to elements
function applyCurrentWoodTexture(elements) {
    if (window.getCurrentWoodPath) {
        const woodPath = window.getCurrentWoodPath();
        elements.forEach(el => {
            if (el) el.style.backgroundImage = `url(${woodPath})`;
        });
    }
}

/* === Sound System === */
let audioContext = null;
let audioInitialized = false;

// Initialize audio when user first interacts with the page
function initAudio() {
    if (audioInitialized) return;
    
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        console.log("Audio initialized successfully");
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}

// Play a wooden sound with the given parameters
function playWoodSound(frequency, duration) {
    if (!audioContext) return;
    
    try {
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency; // Hz
        
        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        
        // Set initial gain
        gainNode.gain.value = 0.3;
        
        // Exponential ramp down to create the wooden sound decay
        gainNode.gain.exponentialRampToValueAtTime(
            0.001, audioContext.currentTime + duration
        );
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn('Error playing audio:', e);
    }
}

// Specific sound functions
function playPlaceSound() {
    // Lower frequency "thunk" sound for placement
    playWoodSound(180, 0.15);
}

function playRemoveSound() {
    // Higher frequency "knock" sound for removal
    playWoodSound(240, 0.1);
}

// Initialize audio on first user interaction to satisfy browser autoplay policies
document.addEventListener('click', initAudio, {once: true});
document.addEventListener('keydown', initAudio, {once: true});

/* === Drag & Drop === */

// Give any node drag-source behavior
function makeDraggable(node, type) {
    node.draggable = true;
    node.addEventListener('dragstart', e => {
        e.dataTransfer.setData('widgetId', node.id);   // present for existing widgets
        e.dataTransfer.setData('module', type);      // always present
        
        // Add visual feedback during drag
        setTimeout(() => {
            node.classList.add('dragging');
        }, 0);
    });
    
    node.addEventListener('dragend', () => {
        node.classList.remove('dragging');
    });
}

// Make palette blocks draggable
blocks.forEach(b => {
    makeDraggable(b, b.dataset.module);
});

// Setup slots as drop targets
slots.forEach(slot => {
    slot.addEventListener('dragover', e => {
        e.preventDefault();
        if (slotIsEmpty(slot)) {
            slot.classList.add('drag-over');
        }
    });
    
    slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
    });
    
    slot.addEventListener('drop', e => {
        slot.classList.remove('drag-over');
        handleSlotDrop(e, slot);
    });
});

// Listen for wood texture changes
document.addEventListener('woodTypeChanged', (e) => {
    // Update all blocks with the new wood texture
    const woodPath = `./assets/wood/${e.detail.woodType}.jpg`;
    document.querySelectorAll('.block').forEach(block => {
        block.style.backgroundImage = `url(${woodPath})`;
    });
});

// Handle dropping onto a slot
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
        oldBlock && (oldBlock.style.display = ''); // Make the block visible again

        // Add placement animation effect
        slot.classList.add('receiving');
        setTimeout(() => slot.classList.remove('receiving'), 300);
        
        // Play "thunk" sound with Web Audio API
        playPlaceSound();
        
        slot.appendChild(w);
        // Apply current wood texture
        applyCurrentWoodTexture([w]);
        
        const newBlock = findBlock(type);
        newBlock && (newBlock.style.display = 'none'); // Hide the block
        saveLayout();
        return;
    }

    /* --- place a fresh block ----------------------------------- */
    if (!type || !slotIsEmpty(slot)) return;
    const srcBlock = findBlock(type);
    if (!srcBlock || !slotIsEmpty(slot)) return;

    /* build widget */
    const widget = window.modules[type]();
    widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    widget.dataset.module = type;
    makeDraggable(widget, type);
    
    // Apply current wood texture 
    applyCurrentWoodTexture([widget]);

    // Add placement animation effect
    slot.classList.add('receiving');
    setTimeout(() => slot.classList.remove('receiving'), 300);

    // Play "thunk" sound with Web Audio API
    playPlaceSound();

    slot.appendChild(widget);
    srcBlock.style.display = 'none'; // Hide the block completely
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

    // Add return animation
    palette.classList.add('receiving');
    setTimeout(() => palette.classList.remove('receiving'), 300);

    // Play "knock" sound with Web Audio API
    playRemoveSound();

    w.parentElement && (w.parentElement.innerHTML = '');  // clear slot
    w.remove();

    const blk = findBlock(type);
    blk && (blk.style.display = ''); // Make the block visible again

    saveLayout();
});

/* === persist layout === */
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
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        widget.dataset.module = item.type;
        makeDraggable(widget, item.type);

        slot.appendChild(widget);
        block.style.display = 'none'; // Hide the block completely
    });
})();

// Initialize blocks with current wood texture when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Apply texture to blocks once wood selector is ready
    document.addEventListener('woodSelectorReady', () => {
        applyCurrentWoodTexture(blocks);
    });
});
