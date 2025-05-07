import { Noise } from 'https://cdn.jsdelivr.net/npm/@chriscourses/simplex-noise/+esm';

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
