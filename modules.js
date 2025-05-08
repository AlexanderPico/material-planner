/**
 * Modules System - Core module management for Material Planner
 * Includes wood texture handling and drag-and-drop functionality
 */

// Import individual modules
import { calendar } from './modules/calendar.js';
import { checklist } from './modules/checklist.js';
import { habit } from './modules/habit.js';
import { gauge } from './modules/gauge.js';

// ===== WOOD TEXTURE HANDLING (from module-look.js) =====

// Simple noise implementation for procedural wood textures
class SimpleNoise {
    constructor() {
        this.seed = Math.random() * 10000;
    }
    
    // Simple 2D noise function - works for basic wood texture
    noise2D(x, y) {
        // Use a simple algorithm that gives decent random noise
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const value = Math.sin(X * 12.9898 + Y * 78.233 + this.seed) * 43758.5453;
        return (value - Math.floor(value)) * 2 - 1;
    }
}

const TEXTURE_PATH = 'assets/wood/';

// Set wood texture and save preference
export function setWood(species = 'oak') {
    document.documentElement.style.setProperty(
        '--wood-url',
        `url(${TEXTURE_PATH}${species}.jpg)`
    );
    localStorage.setItem('woodSpecies', species);
}

// Generate procedural wood texture as fallback
export function genWood(seedHue = 32) {
    const noise = new SimpleNoise();
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(512, 512);

    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const v = noise.noise2D(x / 64, y / 8);          // grain stretch
            const tone = 140 + v * 50;                       // 140‑190
            const idx = (y * 512 + x) * 4;
            img.data.set([tone, tone * 0.8, tone * 0.6, 255], idx);
        }
    }
    ctx.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--wood-url', `url(${c.toDataURL()})`);
}

// Initialize wood texture from localStorage or generate procedural one
const savedWoodSpecies = localStorage.getItem('woodSpecies');
if (savedWoodSpecies) {
    setWood(savedWoodSpecies);
} else {
    genWood();
}

// Expose wood functions globally
window.getCurrentWoodType = () => savedWoodSpecies || 'procedural';
window.getCurrentWoodPath = () => savedWoodSpecies ? `${TEXTURE_PATH}${savedWoodSpecies}.jpg` : '';

// ===== AUDIO SYSTEM =====

let audioContext = null;
let audioInitialized = false;

// Initialize audio when user first interacts with the page
export function initAudio() {
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
export function playWoodSound(frequency, duration) {
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
export function playPlaceSound() {
    // Lower frequency "thunk" sound for placement
    playWoodSound(180, 0.15);
}

export function playRemoveSound() {
    // Higher frequency "knock" sound for removal
    playWoodSound(240, 0.1);
}

// Initialize audio on first user interaction
document.addEventListener('click', initAudio, {once: true});
document.addEventListener('keydown', initAudio, {once: true});
document.addEventListener('mousedown', initAudio, {once: true});

// ===== UTILITY FUNCTIONS =====

// Apply wood texture to an element
export const applyWoodTexture = (element) => {
    if (window.getCurrentWoodPath) {
        element.style.backgroundImage = `url(${window.getCurrentWoodPath()})`;
    }
};

// Apply wood texture to multiple elements
export function applyCurrentWoodTexture(elements) {
    if (window.getCurrentWoodPath) {
        const woodPath = window.getCurrentWoodPath();
        elements.forEach(el => {
            if (el) el.style.backgroundImage = `url(${woodPath})`;
        });
    }
}

// Storage helpers
export const load = (key, def) => { 
    try { 
        return JSON.parse(localStorage.getItem(key)) || def;
    } catch { 
        return def; 
    } 
};

export const save = (key, val) => { 
    localStorage.setItem(key, JSON.stringify(val)); 
};

// Export common utilities for use by modules
export const utils = {
    pad: n => n.toString().padStart(2, '0'),
    yyyymm: d => `${d.getFullYear()}-${utils.pad(d.getMonth() + 1)}`,
    randId: () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    applyWoodTexture
};

// ===== DRAG & DROP INITIALIZATION =====

// Initialize drag and drop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM refs
    const palette = document.getElementById('palette');
    const tiles = [...palette.querySelectorAll('.tile')];
    const slots = [...document.querySelectorAll('.slot')];

    // Helper functions
    const findTile = type => document.querySelector(`.tile[data-module="${type}"]`);
    const slotIsEmpty = slot => !slot.firstElementChild;

    // Make an element draggable
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

    // Handle dropping a widget onto a slot
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
            
            // Play "thunk" sound
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
        
        // Play "thunk" sound
        playPlaceSound();

        // Append the widget
        slot.appendChild(widget);
        
        srcTile.style.display = 'none'; // Hide the tile completely
        saveLayout();
    }

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

    // Save the current layout to localStorage
    function saveLayout() {
        const layout = slots.map(sl =>
            slotIsEmpty(sl) ? null : { slot: sl.dataset.slot, type: sl.firstElementChild.dataset.module }
        );
        localStorage.setItem('layout-v1', JSON.stringify(layout));
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

    // Handle dropping widgets back to palette (removing)
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

        // Play "knock" sound
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

    // Load previous layout
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

    // Apply wood texture to tiles once wood selector is ready
    document.addEventListener('woodSelectorReady', () => {
        applyCurrentWoodTexture(tiles);
    });
});

// Create and export module registry
export const modules = {
    calendar,
    checklist,
    habit,
    gauge
};

// Listen for wood type changes
document.addEventListener('woodTypeChanged', (e) => {
    // Update all existing widgets with the new wood texture
    const woodPath = `./assets/wood/${e.detail.woodType}.jpg`;
    document.querySelectorAll('.widget').forEach(widget => {
        widget.style.backgroundImage = `url(${woodPath})`;
    });
    
    // Also update all tiles with the new wood texture
    document.querySelectorAll('.tile').forEach(tile => {
        tile.style.backgroundImage = `url(${woodPath})`;
    });
});

// Create a global WoodenPlanner object for backward compatibility
window.WoodenPlanner = {
    calendar: modules.calendar,
    checklist: modules.checklist,
    habit: modules.habit,
    gauge: modules.gauge
};

// Make modules and audio functions available globally
window.modules = modules;
window.initAudio = initAudio;
window.playWoodSound = playWoodSound; 