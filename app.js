/* ---------- util helpers ---------- */
const pad = n => n.toString().padStart(2, '0');
const yyyymm = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/* ---------- calendar ---------- */
const calEl = document.getElementById('calendar');
const monthLabel = document.getElementById('month-label');
let viewDate = new Date();

function buildCalendar(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const todayKey = yyyymm(date);
    const closedSet = new Set(JSON.parse(localStorage.getItem(`closed-${todayKey}`) || '[]'));

    calEl.innerHTML = '';

    /* weekday heads */
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    wd.forEach(w => calEl.insertAdjacentHTML('beforeend', `<div class="day head">${w}</div>`));

    /* blank cells before first */
    for (let i = 0; i < first.getDay(); i++) calEl.insertAdjacentHTML('beforeend', '<div></div>');

    /* days */
    for (let d = 1; d <= last.getDate(); d++) {
        const key = `${todayKey}-${pad(d)}`;
        const closed = closedSet.has(key);
        calEl.insertAdjacentHTML('beforeend', `<div class="day${closed ? ' closed' : ''}" data-key="${key}">${d}</div>`);
    }

    monthLabel.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

/* click handler to toggle closed days */
calEl.addEventListener('click', e => {
    if (!e.target.classList.contains('day') || e.target.classList.contains('head')) return;
    e.target.classList.toggle('closed');
    const key = e.target.dataset.key;
    const setKey = 'closed-' + key.slice(0, 7);
    const arr = new Set(JSON.parse(localStorage.getItem(setKey) || '[]'));
    e.target.classList.contains('closed') ? arr.add(key) : arr.delete(key);
    localStorage.setItem(setKey, JSON.stringify([...arr]));
});

/* month nav */
['prev', 'next'].forEach(dir => {
    document.getElementById(dir).addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + (dir === 'prev' ? -1 : 1));
        buildCalendar(viewDate);
    });
});

/* ---------- checklist ---------- */
const todoEl = document.getElementById('todo');
const formEl = document.getElementById('new-item-form');
const inputEl = document.getElementById('new-item');
const LIST_KEY = 'woodcheck';

function loadTodos() {
    todoEl.innerHTML = '';
    const list = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
    list.forEach(({ text, done }, idx) => {
        todoEl.insertAdjacentHTML('beforeend', `
      <li class="todo-item">
        <input id="todo-${idx}" type="checkbox" ${done ? 'checked' : ''}/>
        <label for="todo-${idx}" class="${done ? 'checked' : ''}">${text}</label>
      </li>`);
    });
}

todoEl.addEventListener('change', e => {
    const idx = Array.from(todoEl.children).indexOf(e.target.closest('li'));
    const list = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
    list[idx].done = e.target.checked;
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    loadTodos();
});

formEl.addEventListener('submit', e => {
    e.preventDefault();
    const val = inputEl.value.trim();
    if (!val) return;
    const list = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
    list.push({ text: val, done: false });
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    inputEl.value = '';
    loadTodos();
});

/* ---------- bootstrap ---------- */
buildCalendar(viewDate);
loadTodos();
