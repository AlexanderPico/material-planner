/**
 * Checklist Widget Module
 */
import { load, save, utils } from '../modules.js';

export function checklist(props = { id: 'default' }) {
    const key = `checklist-${props.id}`;
    const list = load(key, []);
    const cont = Object.assign(document.createElement('div'), { className: 'widget' });
    utils.applyWoodTexture(cont);
    cont.innerHTML = '<header>Checklist</header>';
    
    const ul = document.createElement('ul'); 
    ul.style.listStyle = 'none'; 
    ul.style.display = 'flex'; 
    ul.style.flexDirection = 'column'; 
    ul.style.gap = '.3rem'; 
    cont.append(ul);
    
    function render() {
        ul.innerHTML = '';
        list.forEach((it, i) => {
            const li = document.createElement('li'); 
            li.style.display = 'flex'; 
            li.style.gap = '.5rem'; 
            li.style.alignItems = 'center';
            li.innerHTML = `<input type="checkbox" ${it.done ? 'checked' : ''}/> <span>${it.text}</span>`;
            li.querySelector('input').addEventListener('change', e => {
                it.done = e.target.checked; 
                save(key, list); 
                render();
            });
            if (it.done) li.querySelector('span').style.opacity = .55;
            ul.append(li);
        });
    }
    
    render();
    
    const form = document.createElement('form'); 
    form.innerHTML = '<input placeholder="Add task…" />'; 
    cont.append(form);
    
    form.addEventListener('submit', e => {
        e.preventDefault(); 
        const v = form.firstElementChild.value.trim(); 
        if (!v) return;
        list.push({ text: v, done: false }); 
        save(key, list); 
        form.reset(); 
        render();
    });
    
    return cont;
} 