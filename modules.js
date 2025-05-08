/**
 * Modules System - Core module management for Material Planner
 */

// Import individual modules
import { calendar } from './modules/calendar.js';
import { checklist } from './modules/checklist.js';
import { habit } from './modules/habit.js';
import { gauge } from './modules/gauge.js';

// Utility functions
const applyWoodTexture = (element) => {
    if (window.getCurrentWoodPath) {
        element.style.backgroundImage = `url(${window.getCurrentWoodPath()})`;
    }
};

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
});

// Create a global WoodenPlanner object for backward compatibility
window.WoodenPlanner = {
    calendar: modules.calendar,
    checklist: modules.checklist,
    habit: modules.habit,
    gauge: modules.gauge
};

// Make modules available globally
window.modules = modules; 