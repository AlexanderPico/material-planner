/**
 * Habit Tracker Widget Module
 */
import { load, save, utils } from '../modules.js';

export function habit(props = {}) {
    const month = new Date(); 
    const key = utils.yyyymm(month);
    const habits = load(`habit-labels`, ['Habit 1', 'Habit 2', 'Habit 3']).slice(0, 3);
    const gridState = load(`habit-${key}`, {}); // { 'YYYY-MM-DD': [0,2] }
    
    const cont = Object.assign(document.createElement('div'), { className: 'widget' });
    utils.applyWoodTexture(cont);
    cont.innerHTML = '<header>Habit Tracker</header>';

    // bins
    const bins = document.createElement('div'); 
    bins.style.display = 'flex'; 
    bins.style.gap = '.6rem'; 
    bins.style.marginBottom = '.4rem';
    
    let currentColor = null;
    habits.forEach((label, idx) => {
        const btn = document.createElement('button'); 
        btn.textContent = label; 
        btn.style.background = `hsl(${idx * 120},60%,45%)`; 
        btn.style.padding = '.3rem .5rem'; 
        btn.style.borderRadius = '6px';
        
        btn.addEventListener('click', () => {
            currentColor = currentColor === idx ? null : idx; // second click deselect
            [...bins.children].forEach((b, i) => b.style.outline = currentColor === i ? '2px solid #fff' : 'none');
        });
        
        bins.append(btn);
    });
    
    cont.append(bins);

    // calendar grid with holes under each day
    const grid = document.createElement('div'); 
    grid.className = 'calendar-grid'; 
    cont.append(grid);
    
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(ch => { 
        const el = document.createElement('div'); 
        el.textContent = ch; 
        el.style.opacity = .6; 
        grid.append(el); 
    });
    
    for (let i = 0; i < first.getDay(); i++) {
        grid.append(document.createElement('div'));
    }
    
    for (let d = 1; d <= last.getDate(); d++) {
        const id = `${key}-${utils.pad(d)}`;
        const cell = document.createElement('div'); 
        cell.style.display = 'flex'; 
        cell.style.flexDirection = 'column'; 
        cell.style.alignItems = 'center'; 
        cell.style.gap = '.2rem';
        
        const num = document.createElement('div'); 
        num.textContent = d; 
        num.style.fontSize = '.75rem'; 
        cell.append(num);
        
        const hole = document.createElement('div'); 
        hole.className = 'habit-hole'; 
        hole.style.color = 'transparent'; 
        cell.append(hole);
        
        // init fill
        const fills = gridState[id] || []; 
        if (fills.length) { 
            hole.classList.add('filled'); 
            hole.style.color = `hsl(${fills[0] * 120},60%,45%)`; 
        }
        
        hole.addEventListener('click', () => {
            if (currentColor === null) return;
            if (fills.includes(currentColor)) return; // each habit once/day
            fills.push(currentColor);
            gridState[id] = fills; 
            save(`habit-${key}`, gridState);
            hole.classList.add('filled'); 
            hole.style.color = `hsl(${currentColor * 120},60%,45%)`;
        });
        
        grid.append(cell);
    }
    
    return cont;
} 