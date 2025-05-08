/**
 * Progress Gauge Widget Module
 */
import { load, save, utils } from '../modules.js';

export function gauge() {
    const key = 'prog'; 
    let val = load(key, 50);
    
    const cont = Object.assign(document.createElement('div'), { className: 'widget' });
    utils.applyWoodTexture(cont);
    cont.innerHTML = '<header>Progress</header>';
    
    const dial = document.createElement('div'); 
    dial.style.position = 'relative'; 
    dial.style.width = '80px'; 
    dial.style.height = '40px'; 
    dial.style.borderBottom = '4px solid #faf9f7'; 
    dial.style.borderRadius = '0 0 80px 80px'; 
    dial.style.display = 'flex'; 
    dial.style.justifyContent = 'center'; 
    dial.style.alignItems = 'flex-end'; 
    cont.append(dial);
    
    const needle = document.createElement('div'); 
    needle.className = 'gauge-needle'; 
    dial.append(needle);
    
    function render() { 
        needle.style.transform = `rotate(${val * 1.8 - 90}deg)`; 
    }
    
    render();
    
    // knob control
    const slider = document.createElement('input'); 
    slider.type = 'range'; 
    slider.min = 0; 
    slider.max = 100; 
    slider.value = val; 
    slider.style.width = '80%'; 
    cont.append(slider);
    
    slider.addEventListener('input', e => { 
        val = +e.target.value; 
        render(); 
        save(key, val); 
    });
    
    return cont;
} 