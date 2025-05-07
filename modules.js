(function () {
    const root = window.WoodenPlanner = {};
    /* util helpers */
    const pad = n => n.toString().padStart(2, '0');
    const yyyymm = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const randId = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

    /* storage helpers */
    function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def } catch { return def; } }
    function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    /* ---------- Modules ---------- */
    window.modules = {
        calendar: (props) => root.calendar(props),
        checklist: (props) => root.checklist(props),
        habit: (props) => root.habit(props),
        gauge: () => root.gauge()
    };

    /* ---------- Calendar ---------- */
    root.calendar = (props = {}) => {
        const month = new Date();
        if (props.offset) month.setMonth(month.getMonth() + props.offset);
        const key = yyyymm(month);
        const closed = new Set(load(`closed-${key}`, []));
        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        cont.innerHTML = `<header>${month.toLocaleString('default', { month: 'long', year: 'numeric' })}</header>`;
        const grid = document.createElement('div'); grid.className = 'calendar-grid'; cont.append(grid);
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        // weekday heads
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(ch => {
            const el = document.createElement('div'); el.textContent = ch; el.style.opacity = .6; grid.append(el);
        });
        for (let i = 0; i < first.getDay(); i++)grid.append(document.createElement('div'));
        for (let d = 1; d <= last.getDate(); d++) {
            const id = `${key}-${pad(d)}`;
            const cell = Object.assign(document.createElement('div'), { className: `day${closed.has(id) ? ' closed' : ''}`, textContent: d });
            cell.addEventListener('click', () => {
                cell.classList.toggle('closed');
                closed.has(id) ? closed.delete(id) : closed.add(id);
                save(`closed-${key}`, [...closed]);
            });
            grid.append(cell);
        }
        return cont;
    };

    /* ---------- Checklist ---------- */
    root.checklist = (props = { id: 'default' }) => {
        const key = `checklist-${props.id}`;
        const list = load(key, []);
        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        cont.innerHTML = '<header>Checklist</header>';
        const ul = document.createElement('ul'); ul.style.listStyle = 'none'; ul.style.display = 'flex'; ul.style.flexDirection = 'column'; ul.style.gap = '.3rem'; cont.append(ul);
        function render() {
            ul.innerHTML = '';
            list.forEach((it, i) => {
                const li = document.createElement('li'); li.style.display = 'flex'; li.style.gap = '.5rem'; li.style.alignItems = 'center';
                li.innerHTML = `<input type="checkbox" ${it.done ? 'checked' : ''}/> <span>${it.text}</span>`;
                li.querySelector('input').addEventListener('change', e => {
                    it.done = e.target.checked; save(key, list); render();
                });
                if (it.done) li.querySelector('span').style.opacity = .55;
                ul.append(li);
            });
        }
        render();
        const form = document.createElement('form'); form.innerHTML = '<input placeholder="Add task…" />'; cont.append(form);
        form.addEventListener('submit', e => {
            e.preventDefault(); const v = form.firstElementChild.value.trim(); if (!v) return;
            list.push({ text: v, done: false }); save(key, list); form.reset(); render();
        });
        return cont;
    };

    /* ---------- Habit Tracker ---------- */
    root.habit = (props = {}) => {
        const month = new Date(); const key = yyyymm(month);
        const habits = load(`habit-labels`, ['Habit 1', 'Habit 2', 'Habit 3']).slice(0, 3);
        const gridState = load(`habit-${key}`, {}); // { 'YYYY-MM-DD': [0,2] }
        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        cont.innerHTML = '<header>Habit Tracker</header>';

        // bins
        const bins = document.createElement('div'); bins.style.display = 'flex'; bins.style.gap = '.6rem'; bins.style.marginBottom = '.4rem';
        let currentColor = null;
        habits.forEach((label, idx) => {
            const btn = document.createElement('button'); btn.textContent = label; btn.style.background = `hsl(${idx * 120},60%,45%)`; btn.style.padding = '.3rem .5rem'; btn.style.borderRadius = '6px';
            btn.addEventListener('click', () => {
                currentColor = currentColor === idx ? null : idx; // second click deselect
                [...bins.children].forEach((b, i) => b.style.outline = currentColor === i ? '2px solid #fff' : 'none');
            });
            bins.append(btn);
        });
        cont.append(bins);

        // calendar grid with holes under each day
        const grid = document.createElement('div'); grid.className = 'calendar-grid'; cont.append(grid);
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(ch => { const el = document.createElement('div'); el.textContent = ch; el.style.opacity = .6; grid.append(el); });
        for (let i = 0; i < first.getDay(); i++)grid.append(document.createElement('div'));
        for (let d = 1; d <= last.getDate(); d++) {
            const id = `${key}-${pad(d)}`;
            const cell = document.createElement('div'); cell.style.display = 'flex'; cell.style.flexDirection = 'column'; cell.style.alignItems = 'center'; cell.style.gap = '.2rem';
            const num = document.createElement('div'); num.textContent = d; num.style.fontSize = '.75rem'; cell.append(num);
            const hole = document.createElement('div'); hole.className = 'habit-hole'; hole.style.color = 'transparent'; cell.append(hole);
            // init fill
            const fills = gridState[id] || []; if (fills.length) { hole.classList.add('filled'); hole.style.color = `hsl(${fills[0] * 120},60%,45%)`; }
            hole.addEventListener('click', () => {
                if (currentColor === null) return;
                if (fills.includes(currentColor)) return; // each habit once/day
                fills.push(currentColor);
                gridState[id] = fills; save(`habit-${key}`, gridState);
                hole.classList.add('filled'); hole.style.color = `hsl(${currentColor * 120},60%,45%)`;
            });
            grid.append(cell);
        }
        return cont;
    };

    /* ---------- Progress Gauge ---------- */
    root.gauge = () => {
        const key = 'prog'; let val = load(key, 50);
        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        cont.innerHTML = '<header>Progress</header>';
        const dial = document.createElement('div'); dial.style.position = 'relative'; dial.style.width = '80px'; dial.style.height = '40px'; dial.style.borderBottom = '4px solid #faf9f7'; dial.style.borderRadius = '0 0 80px 80px'; dial.style.display = 'flex'; dial.style.justifyContent = 'center'; dial.style.alignItems = 'flex-end'; cont.append(dial);
        const needle = document.createElement('div'); needle.className = 'gauge-needle'; dial.append(needle);
        function render() { needle.style.transform = `rotate(${val * 1.8 - 90}deg)`; }
        render();
        // knob control
        const slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = 100; slider.value = val; slider.style.width = '80%'; cont.append(slider);
        slider.addEventListener('input', e => { val = +e.target.value; render(); save(key, val); });
        return cont;
    };

})();
