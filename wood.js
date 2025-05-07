/*
  Runtime wood‑grain texture generator
  -----------------------------------
  Draws a 256×256 canvas of pseudo‑random stripes + noise, then assigns the
  resulting data‑URL to CSS variable `--panel-tex` at the document root.
  The panel background in style.css picks it up and blends it with the
  existing gradient to create richer grain with almost zero bundle weight.
*/
(function () {
    const SIZE = 256;
    const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
    const ctx = canvas.getContext('2d');

    // helper – hsl shortcut (h fixed around 30° for warm wood)
    const hsl = l => `hsl(30, 45%, ${l}%)`;

    // draw vertical stripes with subtle sine‑based variation
    for (let x = 0; x < SIZE; x++) {
        const lum = 34 + 6 * Math.sin(x * 0.15) + 4 * (Math.random() - 0.5);
        ctx.fillStyle = hsl(lum);
        ctx.fillRect(x, 0, 1, SIZE);
    }

    // light coat of noise for pores
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
        const tweak = (Math.random() - 0.5) * 15;
        img.data[i] += tweak; // R
        img.data[i + 1] += tweak; // G
        img.data[i + 2] += tweak; // B
    }
    ctx.putImageData(img, 0, 0);

    // expose as CSS variable
    const url = `url(${canvas.toDataURL()})`;
    document.documentElement.style.setProperty('--panel-tex', url);
})();