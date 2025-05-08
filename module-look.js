/**
 * Module Look - Handles wood textures and appearance
 */

// Simple noise implementation to avoid CDN dependencies
class SimpleNoise {
    constructor() {
        this.seed = Math.random() * 10000;
    }
    
    // Simple 2D noise function - not as good as simplex but works for our wood texture
    noise2D(x, y) {
        // Use a simple algorithm that gives decent random noise
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const value = Math.sin(X * 12.9898 + Y * 78.233 + this.seed) * 43758.5453;
        return (value - Math.floor(value)) * 2 - 1;
    }
}

// Use our SimpleNoise as a fallback
const Noise = SimpleNoise;

const TEXTURE_PATH = 'assets/wood/';        // GH Pages folder

export function setWood(species = 'oak') {
    document.documentElement.style.setProperty(
        '--wood-url',
        `url(${TEXTURE_PATH}${species}.jpg)`
    );
    localStorage.setItem('woodSpecies', species);
}

/* Tier‑1 procedural fallback */
export function genWood(seedHue = 32) {
    const noise = new Noise();
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

/* at module load: pick stored species or procedural */
const saved = localStorage.getItem('woodSpecies');
if (saved) {
    setWood(saved);
} else {
    genWood();             // Tier‑0/Tier‑1 until user picks real species
}

// Expose current wood type globally for compatibility with other modules
window.getCurrentWoodType = () => saved || 'procedural';
window.getCurrentWoodPath = () => saved ? `${TEXTURE_PATH}${saved}.jpg` : ''; 