/**
 * Module Drag and Drop - Handles the drag-and-drop functionality and widget placement
 */

import { modules } from './modules.js';

/* === DOM refs === */
const palette = document.getElementById('palette');
const tiles = [...palette.querySelectorAll('.tile')];
const slots = [...document.querySelectorAll('.slot')];

/* === helpers === */
const findTile = type => document.querySelector(`.tile[data-module="${type}"]`);
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
document.addEventListener('mousedown', initAudio, {once: true});

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

// Make palette tiles draggable
tiles.forEach(t => {
    makeDraggable(t, t.dataset.module);
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
    // Update all tiles with the new wood texture
    const woodPath = `./assets/wood/${e.detail.woodType}.jpg`;
    document.querySelectorAll('.tile').forEach(tile => {
        tile.style.backgroundImage = `url(${woodPath})`;
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
        const oldTile = findTile(w.dataset.module);
        oldTile && (oldTile.style.display = ''); // Make the tile visible again

        // Only add background highlight to slot, not animation to widget
        slot.classList.add('receiving');
        setTimeout(() => slot.classList.remove('receiving'), 300);
        
        // Play "thunk" sound with Web Audio API
        playPlaceSound();
        
        // Move the widget to the new slot
        slot.appendChild(w);
        
        // Apply current wood texture
        applyCurrentWoodTexture([w]);
        
        const newTile = findTile(type);
        newTile && (newTile.style.display = 'none'); // Hide the tile
        saveLayout();
        return;
    }

    /* --- place a fresh tile ----------------------------------- */
    if (!type || !slotIsEmpty(slot)) return;
    const srcTile = findTile(type);
    if (!srcTile || !slotIsEmpty(slot)) return;

    /* build widget */
    const widget = modules[type]();
    widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    widget.dataset.module = type;
    makeDraggable(widget, type);
    
    // Apply current wood texture 
    applyCurrentWoodTexture([widget]);

    // Only add background highlight to slot, not animation to widget
    slot.classList.add('receiving');
    setTimeout(() => slot.classList.remove('receiving'), 300);
    
    // Play "thunk" sound with Web Audio API
    playPlaceSound();

    // Append the widget
    slot.appendChild(widget);
    
    srcTile.style.display = 'none'; // Hide the tile completely
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

    // Get the parent slot before removing the widget
    const parentSlot = w.parentElement;
    
    // Apply lifting animation before removing
    applyLiftingAnimation(w, () => {
        // Clear the slot after animation completes
        if (parentSlot) {
            parentSlot.innerHTML = '';
        }
        
        // Make the tile visible again
        const tile = findTile(type);
        if (tile) {
            tile.style.display = '';
        }
        
        // Save the layout
        saveLayout();
    });
});

/* === persist layout === */
function saveLayout() {
    const layout = slots.map(sl =>
        slotIsEmpty(sl) ? null : { slot: sl.dataset.slot, type: sl.firstElementChild.dataset.module }
    );
    localStorage.setItem('layout-v1', JSON.stringify(layout));
}

/* === bootstrap previous layout === */
document.addEventListener('DOMContentLoaded', () => {
    const layout = JSON.parse(localStorage.getItem('layout-v1') || '[]');
    layout.forEach(item => {
        if (!item) return;
        const slot = document.querySelector(`.slot[data-slot="${item.slot}"]`);
        const tile = findTile(item.type);
        if (!slot || !tile || !slotIsEmpty(slot)) return;

        const widget = modules[item.type]();
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        widget.dataset.module = item.type;
        makeDraggable(widget, item.type);

        slot.appendChild(widget);
        tile.style.display = 'none'; // Hide the tile completely
    });
});

// Initialize tiles with current wood texture when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Apply texture to tiles once wood selector is ready
    document.addEventListener('woodSelectorReady', () => {
        applyCurrentWoodTexture(tiles);
    });
});

// Apply lifting animation to a widget before removing it
function applyLiftingAnimation(widget, callback) {
    // Add the lifting class to trigger the animation
    widget.classList.add('lifting');
    
    // Remove the widget after animation completes
    widget.addEventListener('animationend', () => {
        widget.classList.remove('lifting');
        if (callback) callback();
    }, { once: true });
}

// Expose audio functions globally
window.initAudio = initAudio;
window.playWoodSound = playWoodSound; 