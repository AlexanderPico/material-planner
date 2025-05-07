/* === DOM refs === */
const palette = document.getElementById('palette');
const blocks = [...palette.querySelectorAll('.block')];
const slots = [...document.querySelectorAll('.slot')];

/* === helpers === */
const findBlock = type => document.querySelector(`.block[data-module="${type}"]`);
const slotIsEmpty = slot => !slot.firstElementChild;

// Create audio for wooden placement sound
const placeSound = new Audio();
placeSound.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFNgCVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWV//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAATYxh/KZAAAAAAD/+9DEAAAJdAF19BAAJbJE7j82MAF0YWdzAAEABQAGIQgUFQEYBAYTBwMJCnS4TAPiiBaNAZADAIIQVQ0FgIJAMYiCwXA4eA8eAB9A8vADg8T/5c+D4Pn5QfB85//Lg+D4HAQBA+D9/KAgCB8HwQBP/8oDwfd//KA8HwfBAED4Pggf////wQBAEDq7vmiAIGQeHQYJACAwiGQOAQEDwHBBJGBYDgAJjwFkABT7aPr9fu9Jx3Wf4zqdcbHDkAYQ2IGQCgIYKgmYKAKYnh8YiCEYRgYYQhkYIAQHQ+PBdRtb/Lj3qkjwakxoZJZJC1gKAt8hG5EjjTOV3fW5Y6KclLIL1UpKTgXzIc2mxUaVUklNSorHQ4UEpUuKQFQqYrJi8uNCpkaGiSuQ7FaXKjwolNTQWLi8qlRQYJjQWXIUpZBWmh4oNEpqaJJcuOigmNDQVaZHRQdT42XF5MbCVqm5okqa4+KJs0XFQVlM0dFEWTS4oiZskXJTNLCiTOJi5IiipqKyOKn/+7DE+IMKgGl5+PMAWfUM7v8zYAGplxcFZfNHEWcTQtFI1JBcvHJUuIkqrURRdkxUvS5MbmJ0TFJzNnE6IlEZPY5JikZnDiTFRXLlM8TEyIySZLDSuYSYuUzaVFxFHJEsSTcXGJ9Kik5IT6SDEomzxNLiI+OTSaHkx4ojI5NJdKJcuORgfLFk8lioEjhA0Ilo4LFiJRNoGHiRInA0eHRoXHR4aKC0kzw6JfDCJQplHBs8JhZMWkioKPKE8JBYFILokSSJ4dEGlEWdLTpiHiCaSIlScEhJQuRKk4JCJOCZEmTY4MIEicHhAsLly5ImTQsElFT4cREycFhIuDkyqNlBMkUJk6XGzBUkUJoNHi4wYKibOiwcTJk2cLlCpODJkodLDRYqQJsYHDJeYJlSRUmxwiSJk4XKFiRQnxgYPGCpInBYSKlSJNDRcTJkzVUdAwMMiSDEDQgjB4BUwCCdMIglzBAJIMAKcMAIfTGcJsxHBaMaQpjBsAEwPCaETQSjCYFEw0yMNNFmDAkDkwJAkMAwKxABAAAmkFu0GwF0OAK0GwN0G4rrNQQGwbHw8MAEYMAQOMAUAMARM6AkZMDAMM8haMPQ1MHARMFQHCIEGBADDIwERkCARxgtUQVBwwJAMxJAkwGA0aQkYAAAFAMYDAOYJgAYCAKYCgEAgCYGAQCAGYKgFgGYaAMAgBGBIAigAGCwBnDoOAoAjAEAigAGA4BGCQBGCIBGEoBGA4BGAQAmB4BGBoAGAIBmAYAh6GwZAEAGAoAmAQALAFQBMAxAQEYGAEYCgAYAgEUApgGABgMAJgGAYYAUBTAQADAgARQATAEATAMAgMFjAkADAwAUgCHgwCIAzAoAk0FgBGgHAMYCCKMCAAMAQAMvQDMBQAMAACGAFgQYAgAYDAGYCAGeAECTAUADA0Aw0CRLMAR/MRwqMDgbMKQJMBw2MLwgMEgmAQKABTnY7AYiILMBwAMGQiMQwtBITGLCHmQoZmLIImGIRGHAdmEAFGDgDiIJmBoDA==";
placeSound.volume = 0.3;

// Create audio for wooden removal sound
const removeSound = new Audio();
removeSound.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFNgCVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWV//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAATYxLcQpAAAAAAD/+9DEAAAJIAVt9BAAJhRE6n82YBDmYWdzAAASABg2QpYgCAEA4ZigEDI1hQzgCYyCYZwgQ1hCZwiY0hiDwDk8eIJBA4OEgH///+XB8HyfueD5+UHwfB8/6AQBAEAQPg+CB//8oCB8H/8oDwQBL/8ED4Pg+eD5//8EAQBAEAQP//+CAPggCAIHwQPgCAIHwQBA+A8EA9+UHwfB8HwQBc+CB8EAQPhhI6u75ggCBgEhSHA4DwaGgmAQEDwFhLMGQKAILioNCoXPn+1et12ZKTv9zfJD5/j/1wRAJDg7MaQwMOBZMMAHP/z5MLgdMNRGMixCMRAmLAQDghv5//95fv8RLRciSECgVYaBwdwvADBgFRqxS5vucbylmRTUo8HaQNUhQ1ESKUZWNVZWvpqUyGpMrKyiJJVKYuUwNSCJkSScz0sWlLNk6GasMlKmZUEJQRNEhUVkTWGpUtKwNChSpcuVpZKqJSogVlS1SZTWIlEDEyTFamS6VFSipJAmRKlpSSozIlacszqhDCpgaJE0yUlYI1Jhk6mqxAXE5MrRGpSVklSUr/+8BE/4ML0Gl1+bwBCW+M7n84YCCFZiZDFSWtRGSzEpRLIlotcjdBKaUrQmpJUxU0JE1WVNVdCTKjUyJFKh2glJGRUWuRVJdSoLmA5AqQzYcWKIGoVNFyM0HJlU6GoGQIp9TBcklQyQpUZnQx64TlqmiVEpYpLIUSnVMlU+pMqNzIZPhqBkG1ShMjmzYsKWM1U0HpCpgoUppGRkRJDQKUIdVKFAuJHIGgqXJpkpKwRrSBkOkKmiYeEi4dMiqS0oVCJkLUVKYoALiwwGxEAjAYJkwZA7MGATzAkDYLAFYUAxgcBsYDghGA4GhYAKYQAqmEwKZgmFKDwjTJ8g4yiCLMgRUDJMGYBGuYoALDgGt3a9KwDTW49jVuVAyFCpMNADy4BAwBBIMKAOjAIBQlA/MAADx8BpggAweFCYBgADAKEAxQAZMDwCTCQA4eAgBgDDAPTAESAFmAwABCBWmAIAZGAOHgEGK4CheAgsFWZEgkmDICZeAoHAGlIvjAQJsmAUHzQDQMA+HgKmKwEjhQmA4AxgqA8YBAoGAgCIBmBwEwdA4YTAGGAYAZgWBqNAUF4EzAIAYwJAGMHQADBMAMwLA7MAQDDAoAIwSARMAAAMhIDjAMB4SAOYEAMmAIDJgCACYDgEmBgDBgExiYCgcHAGjAKDBcA0YGgFGAoLZg2CAYGAGmAQCZgEEuAgXMFQADAgA83FUxDCZBAJGAAAZgWAgYGAHDBIKQXF05XAXOgIG0oJQNiQ5EQcmAQAU5DwzAxAZLiqcPgGmBgChgIAEYCACEAFzgcA0YAgMAAAjAQA0YAQAiiGKsIpIBSXGf/wMAqGw4nAsKxi1CuYIAGGBQApSBsVCoYFgAmBIAZV3YwOAnOi8OMFEOzBQBEPQcMA==";
removeSound.volume = 0.3;

/* give any node drag‑source behaviour */
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

/* === palette blocks → drag sources === */
blocks.forEach(b => {
    makeDraggable(b, b.dataset.module);
});

/* === slots → drop targets === */
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
        
        // Play wooden placement sound
        placeSound.currentTime = 0;
        placeSound.play();
        
        slot.appendChild(w);
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

    // Add placement animation effect
    slot.classList.add('receiving');
    setTimeout(() => slot.classList.remove('receiving'), 300);

    // Play wooden placement sound
    placeSound.currentTime = 0;
    placeSound.play();

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

    // Play wooden removal sound
    removeSound.currentTime = 0;
    removeSound.play();

    w.parentElement && (w.parentElement.innerHTML = '');  // clear slot
    w.remove();

    const blk = findBlock(type);
    blk && (blk.style.display = ''); // Make the block visible again

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
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        widget.dataset.module = item.type;
        makeDraggable(widget, item.type);

        slot.appendChild(widget);
        block.style.display = 'none'; // Hide the block completely
    });
})();
