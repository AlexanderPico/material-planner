(function () {
    const root = window.WoodenPlanner = {};
    /* util helpers */
    const pad = n => n.toString().padStart(2, '0');
    const yyyymm = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const randId = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

    /* storage helpers */
    function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def } catch { return def; } }
    function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    /* Apply current wood texture to widget */
    function applyWoodTexture(element) {
        if (window.getCurrentWoodPath) {
            element.style.backgroundImage = `url(${window.getCurrentWoodPath()})`;
        }
    }

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
        const events = load(`events-${key}`, {});

        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        applyWoodTexture(cont);
        cont.innerHTML = `<header>${month.toLocaleString('default', { month: 'long', year: 'numeric' })}</header>`;

        const controls = document.createElement('div');
        controls.className = 'calendar-controls';

        const trashBtn = document.createElement('button');
        trashBtn.className = 'trash';
        trashBtn.innerHTML = '↺';
        trashBtn.title = 'Clear all events and reset closed days';
        trashBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all events and reset closed days?')) {
                localStorage.removeItem(`closed-${key}`);
                localStorage.removeItem(`events-${key}`);

                // Clear the in-memory data structures
                closed.clear();
                Object.keys(events).forEach(k => delete events[k]);
                
                // Update all calendar days in the current widget
                cont.querySelectorAll('.day').forEach(day => {
                    // Remove the closed class
                    day.classList.remove('closed');
                    day.classList.remove('has-events');
                    
                    // Find and update the tooltip
                    const tooltipEl = day.querySelector('.day-tooltip');
                    if (tooltipEl) {
                        // Reset tooltip content
                        tooltipEl.innerHTML = '<div class="no-events">No events</div>';
                        tooltipEl.classList.remove('visible', 'editable', 'centered');
                    }
                });
            }
        });

        // Prevent tilt effect on trash button click
        trashBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        const helpBtn = document.createElement('button');
        helpBtn.className = 'help';
        helpBtn.innerHTML = '?';
        helpBtn.title = 'How to use this calendar';

        // Prevent tilt effect on help button click
        helpBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        const helpTooltip = document.createElement('div');
        helpTooltip.className = 'help-tooltip';
        helpTooltip.innerHTML = `
            <p><strong>Calendar Widget Help:</strong></p>
            <ul>
                <li>Click a date to mark it as completed</li>
                <li>Hover over a date to see events</li>
                <li>Right-click a date to add/edit events</li>
                <li>Click the trash icon to clear all data</li>
            </ul>
        `;

        helpBtn.addEventListener('mouseenter', () => {
            helpTooltip.classList.add('visible');
        });

        helpBtn.addEventListener('mouseleave', () => {
            helpTooltip.classList.remove('visible');
        });

        controls.appendChild(trashBtn);
        controls.appendChild(helpBtn);
        controls.appendChild(helpTooltip);
        cont.appendChild(controls);

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        cont.append(grid);

        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(ch => {
            const el = document.createElement('div');
            el.textContent = ch;
            el.style.opacity = .6;
            grid.append(el);
        });

        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        for (let i = 0; i < first.getDay(); i++) {
            grid.append(document.createElement('div'));
        }

        for (let d = 1; d <= last.getDate(); d++) {
            const id = `${key}-${pad(d)}`;

            // Check if this day has events
            const hasEvents = Boolean(events[id]);

            const cell = Object.assign(document.createElement('div'), {
                className: `day${closed.has(id) ? ' closed' : ''}${hasEvents ? ' has-events' : ''}`,
                textContent: d
            });

            // Stop mousedown propagation to prevent the tilt effect on the parent widget
            cell.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // Prevent default to stop the tilt effect
            });

            cell.addEventListener('click', (e) => {
                // Stop event propagation to prevent the tilt effect on the parent widget
                e.stopPropagation();

                // Don't toggle if we clicked on the tooltip or if tooltip is in edit mode
                if (e.target.closest('.day-tooltip') || tooltip.classList.contains('editable')) return;

                cell.classList.toggle('closed');
                closed.has(id) ? closed.delete(id) : closed.add(id);
                save(`closed-${key}`, [...closed]);
            });

            const tooltip = document.createElement('div');
            tooltip.className = 'day-tooltip';

            // Only show tooltip on mouseenter if this day has events
            cell.addEventListener('mouseenter', (e) => {
                // Stop event propagation to prevent the tilt effect on the parent widget
                e.stopPropagation();

                // Don't change tooltip if it's in edit mode
                if (tooltip.classList.contains('editable')) return;

                // Only show tooltip if there are events
                if (events[id]) {
                    updateTooltipContent();
                    tooltip.classList.add('visible');
                }
            });

            cell.addEventListener('mouseleave', (e) => {
                // Stop event propagation to prevent the tilt effect on the parent widget
                e.stopPropagation();

                // Don't hide tooltip if moving to the tooltip itself
                if (e.relatedTarget && (e.relatedTarget === tooltip || tooltip.contains(e.relatedTarget))) {
                    return;
                }

                // Don't hide if in edit mode
                if (!tooltip.classList.contains('editable')) {
                    tooltip.classList.remove('visible');
                }
            });

            cell.addEventListener('contextmenu', (e) => {
                // Stop event propagation to prevent the tilt effect on the parent widget
                e.stopPropagation();
                e.preventDefault();
                tooltip.classList.add('visible', 'editable');
                showEditMode();
            });

            function updateTooltipContent() {
                // Don't update content if in edit mode
                if (tooltip.classList.contains('editable')) return;

                const eventText = events[id] || '';
                tooltip.innerHTML = `<div>${eventText.replace(/\n/g, '<br>')}</div>`;

            }

            function showEditMode() {
                const eventText = events[id] || '';
                tooltip.innerHTML = `
                    <textarea>${eventText}</textarea>
                    <div class="tooltip-buttons">
                        <button class="cancel">Cancel</button>
                        <button class="save">Save</button>
                    </div>
                `;

                const textarea = tooltip.querySelector('textarea');

                // Focus the textarea initially
                setTimeout(() => {
                    textarea.focus();
                    // Move cursor to end of text
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                }, 0);

                // Prevent any event from bubbling through the tooltip and prevent default to stop shifting
                tooltip.addEventListener('mousedown', (e) => {
                    // Let the textarea handle its own mousedown event
                    if (e.target === textarea) {
                        return;
                    }
                    // For any other element, prevent default to avoid shifting
                    e.preventDefault();
                    e.stopPropagation();
                });

                // Special handling for textarea mousedown
                textarea.addEventListener('mousedown', (e) => {
                    // Stop propagation to prevent widget tilt
                    e.stopPropagation();
                    
                    // Prevent default to stop the tooltip from shifting
                    e.preventDefault();
                    
                    // Store the original click position
                    const clickX = e.clientX;
                    const clickY = e.clientY;
                    
                    // Create a cursor positioning system using mouseup
                    const handleMouseUp = () => {
                        // Focus the textarea
                        textarea.focus();
                        
                        // Get text position from click coordinates
                        try {
                            // Calculate position based on character height and width
                            const rect = textarea.getBoundingClientRect();
                            const style = window.getComputedStyle(textarea);
                            const fontSize = parseFloat(style.fontSize);
                            const paddingTop = parseFloat(style.paddingTop);
                            const paddingLeft = parseFloat(style.paddingLeft);
                            
                            // Calculate character position based on click coordinates
                            const clickRelativeX = clickX - rect.left - paddingLeft;
                            const clickRelativeY = clickY - rect.top - paddingTop;
                            
                            // Approximate character width (use 0.6 * fontSize as a rough estimate)
                            const charWidth = fontSize * 0.6;
                            const lineHeight = fontSize * 1.2;
                            
                            // Calculate approximate line and column
                            const line = Math.floor(clickRelativeY / lineHeight);
                            const column = Math.floor(clickRelativeX / charWidth);
                            
                            // Get text content and calculate lines
                            const lines = textarea.value.split('\n');
                            
                            // Find position within the text
                            let position = 0;
                            for (let i = 0; i < line && i < lines.length; i++) {
                                position += lines[i].length + 1; // +1 for newline
                            }
                            
                            // Add column position within current line
                            if (line < lines.length) {
                                position += Math.min(column, lines[line].length);
                            }
                            
                            // Set cursor position
                            textarea.setSelectionRange(position, position);
                        } catch (error) {
                            console.log("Error positioning cursor:", error);
                            
                            // Fallback to a simpler approach if the above fails
                            try {
                                const rect = textarea.getBoundingClientRect();
                                const aproximatePosition = Math.round((clickX - rect.left) / 8) + 
                                                         Math.round((clickY - rect.top) / 16) * 
                                                         Math.round(rect.width / 8);
                                
                                // Ensure the position is valid
                                const maxPosition = textarea.value.length;
                                const position = Math.min(aproximatePosition, maxPosition);
                                
                                // Set the cursor position
                                textarea.setSelectionRange(position, position);
                            } catch (e) {
                                console.log("Fallback cursor positioning failed:", e);
                            }
                        }
                    };
                    
                    // Listen for mouseup to position cursor
                    document.addEventListener('mouseup', handleMouseUp, { once: true });
                });
                
                // For better keyboard interaction
                textarea.addEventListener('keydown', (e) => {
                    // Stop propagation to prevent wood selector from capturing arrow keys
                    e.stopPropagation();
                });

                // Add centered class and move tooltip to be a direct child of the widget container
                tooltip.classList.add('centered');

                // Store original parent to restore tooltip when done
                const originalParent = tooltip.parentNode;

                // Move tooltip to the widget container for proper centering
                cont.appendChild(tooltip);

                // Save button handler
                const saveButton = tooltip.querySelector('.save');
                saveButton.addEventListener('mousedown', (e) => {
                    // Prevent any default behavior and stop propagation
                    e.preventDefault();
                    e.stopPropagation();
                });

                saveButton.addEventListener('click', (e) => {
                    // Stop event propagation to prevent toggling the closed state
                    e.preventDefault();
                    e.stopPropagation();

                    // First, remove classes to hide tooltip immediately
                    tooltip.classList.remove('visible', 'editable', 'centered');
                    // Hide it completely while we manipulate it
                    tooltip.style.display = 'none';
                    
                    // Now process the event data
                    const newText = textarea.value.trim();
                    if (newText) {
                        events[id] = newText;
                        // Add the 'has-events' class when saving an event
                        cell.classList.add('has-events');
                    } else {
                        delete events[id];
                        // Remove the 'has-events' class when removing an event
                        cell.classList.remove('has-events');
                    }
                    save(`events-${key}`, events);

                    // Move tooltip back to original parent
                    originalParent.appendChild(tooltip);

                    // Reset tooltip position for view mode - only set the essential styles
                    // that aren't covered by CSS class removal
                    tooltip.style.position = '';
                    tooltip.style.maxHeight = '';
                    tooltip.style.overflow = '';
                    
                    // After a small delay to ensure all styles are applied, restore display
                    setTimeout(() => {
                        tooltip.style.display = '';
                    }, 10);
                });

                // Cancel button handler
                const cancelButton = tooltip.querySelector('.cancel');
                cancelButton.addEventListener('mousedown', (e) => {
                    // Prevent any default behavior and stop propagation
                    e.preventDefault();
                    e.stopPropagation();
                });

                cancelButton.addEventListener('click', (e) => {
                    // Stop event propagation to prevent toggling the closed state
                    e.preventDefault();
                    e.stopPropagation();

                    // First, remove classes to hide tooltip immediately
                    tooltip.classList.remove('visible', 'editable', 'centered');
                    // Hide it completely while we manipulate it
                    tooltip.style.display = 'none';

                    // Move tooltip back to original parent
                    originalParent.appendChild(tooltip);

                    // Reset only the essential styles that aren't covered by CSS class removal
                    tooltip.style.position = '';
                    tooltip.style.maxHeight = '';
                    tooltip.style.overflow = '';
                    
                    // After a small delay to ensure all styles are applied, restore display
                    setTimeout(() => {
                        tooltip.style.display = '';
                    }, 10);
                });
            }

            cell.appendChild(tooltip);
            grid.append(cell);
        }

        return cont;
    };

    /* ---------- Checklist ---------- */
    root.checklist = (props = { id: 'default' }) => {
        const key = `checklist-${props.id}`;
        const list = load(key, []);
        const cont = Object.assign(document.createElement('div'), { className: 'widget' });
        applyWoodTexture(cont);
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
        applyWoodTexture(cont);
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
        applyWoodTexture(cont);
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

    /* Listen for wood type changes */
    document.addEventListener('woodTypeChanged', (e) => {
        // Update all existing widgets with the new wood texture
        const woodPath = `./assets/wood/${e.detail.woodType}.jpg`;
        document.querySelectorAll('.widget').forEach(widget => {
            widget.style.backgroundImage = `url(${woodPath})`;
        });
    });

})();
