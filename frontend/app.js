// ============================================
// APLIKACJA TODO - GŁÓWNA LOGIKA (ZINTEGROWANA Z API)
// ============================================

const API_URL = 'http://localhost:3000';

// ============================================
// ZMIENNE GLOBALNE
// ============================================
let tasks = [];
let currentFilter = 'all';
let currentSort = 'date-desc';
let searchQuery = '';
let editingTaskId = null;

const priorities = {
    low: { name: 'Niski', color: 'green', icon: 'arrow_downward' },
    medium: { name: 'Średni', color: 'yellow darken-1', icon: 'remove' },
    high: { name: 'Wysoki', color: 'red', icon: 'arrow_upward' }
};

// ============================================
// INICJALIZACJA APLIKACJI
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    initializeMaterialize();
    setupEventListeners();
    await loadTasks(); // Wczytaj zadania z API
    updateCounters();
});

// ============================================
// KONFIGURACJA I INICJALIZACJA MATERIALIZE
// ============================================
const datePickerOptions = {
    format: 'yyyy-mm-dd',
    autoClose: true,
    showClearBtn: true,
    i18n: {
        cancel: 'Anuluj', clear: 'Wyczyść', done: 'OK',
        months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
        monthsShort: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
        weekdays: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
        weekdaysShort: ['Nie', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob']
    }
};

function initializeMaterialize() {
    M.Datepicker.init(document.querySelectorAll('.datepicker'), datePickerOptions);
}

function reinitializeDatePicker(element, defaultDate = null) {
    const instance = M.Datepicker.getInstance(element);
    if (instance) {
        instance.destroy();
    }
    const options = { ...datePickerOptions };
    if (defaultDate) {
        options.defaultDate = new Date(defaultDate);
        options.setDefaultDate = true;
    }
    M.Datepicker.init(element, options);
}

// ============================================
// ZARZĄDZANIE ZADANIAMI - OPERACJE CRUD (API)
// ============================================

/**
 * Wczytuje zadania z API
 */
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        if (!response.ok) {
            throw new Error('Nie udało się pobrać zadań z serwera.');
        }
        const serverTasks = await response.json();
        // Konwertuj daty na obiekty Date
        tasks = serverTasks.map(task => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            deadline: task.deadline ? new Date(task.deadline) : null
        }));
        renderTasks();
    } catch (error) {
        console.error('Błąd wczytywania zadań:', error);
        showToast(error.message, 'error');
        tasks = [];
        renderTasks();
    }
}

/**
 * Tworzy nowe zadanie przez API
 */
async function createTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) {
            throw new Error('Nie udało się dodać zadania.');
        }
        const newTask = await response.json();
        // Dodaj nowe zadanie do lokalnej tablicy i przerenderuj
        tasks.push({
            ...newTask,
            createdAt: new Date(newTask.createdAt),
            updatedAt: new Date(newTask.updatedAt),
            deadline: newTask.deadline ? new Date(newTask.deadline) : null
        });
        renderTasks();
        updateCounters();
        showToast('Zadanie zostało dodane', 'success');
    } catch (error) {
        console.error('Błąd tworzenia zadania:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Aktualizuje istniejące zadanie przez API
 */
async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) {
            throw new Error('Nie udało się zaktualizować zadania.');
        }
        const updatedTask = await response.json();
        // Zaktualizuj zadanie w lokalnej tablicy
        const taskIndex = tasks.findIndex(t => t.id === updatedTask.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...updatedTask,
                createdAt: new Date(updatedTask.createdAt),
                updatedAt: new Date(updatedTask.updatedAt),
                deadline: updatedTask.deadline ? new Date(updatedTask.deadline) : null
            };
        }
        renderTasks();
        updateCounters();
        showToast('Zadanie zostało zaktualizowane', 'success');
    } catch (error) {
        console.error('Błąd aktualizacji zadania:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Usuwa zadanie przez API
 */
async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Nie udało się usunąć zadania.');
        }
        // Usuń zadanie z lokalnej tablicy
        tasks = tasks.filter(t => t.id !== parseInt(taskId));
        renderTasks();
        updateCounters();
        showToast('Zadanie zostało usunięte', 'success');
    } catch (error) {
        console.error('Błąd usuwania zadania:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Przełącza status zadania przez API
 */
async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;

    const updatedStatus = { completed: !task.completed };
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedStatus)
        });
        if (!response.ok) {
            throw new Error('Nie udało się zmienić statusu zadania.');
        }
        const updatedTask = await response.json();
        // Zaktualizuj status w lokalnej tablicy
        task.completed = updatedTask.completed;
        task.updatedAt = new Date(updatedTask.updatedAt);
        
        renderTasks();
        updateCounters();
        const status = task.completed ? 'zakończone' : 'przywrócone';
        showToast(`Zadanie oznaczono jako ${status}`, 'success');
    } catch (error) {
        console.error('Błąd zmiany statusu:', error);
        showToast(error.message, 'error');
    }
}


// ============================================
// FILTROWANIE I SORTOWANIE (bez zmian, działa na lokalnych danych)
// ============================================
function filterTasks(tasksList) {
    let filtered = [...tasksList];
    if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(t => {
            if (t.completed || !t.deadline) return false;
            const deadline = new Date(t.deadline);
            deadline.setHours(0, 0, 0, 0);
            return deadline < today;
        });
    }

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            (t.title && t.title.toLowerCase().includes(query)) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.assignee && t.assignee.toLowerCase().includes(query)) ||
            (t.category && t.category.toLowerCase().includes(query))
        );
    }
    return filtered;
}

function sortTasks(tasksList) {
    const sorted = [...tasksList];
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    switch (currentSort) {
        case 'date-asc': sorted.sort((a, b) => a.createdAt - b.createdAt); break;
        case 'date-desc': sorted.sort((a, b) => b.createdAt - a.createdAt); break;
        case 'priority-desc': sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)); break;
        case 'priority-asc': sorted.sort((a, b) => (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)); break;
        case 'deadline-asc':
            sorted.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
        case 'deadline-desc':
            sorted.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(b.deadline) - new Date(a.deadline);
            });
            break;
        case 'assignee': sorted.sort((a, b) => (a.assignee || '').localeCompare(b.assignee || '')); break;
    }
    return sorted;
}

// ============================================
// RENDEROWANIE INTERFEJSU (bez większych zmian)
// ============================================
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    let filtered = filterTasks(tasks);
    let sorted = sortTasks(filtered);

    document.getElementById('tasksListCounter').textContent = sorted.length;

    if (sorted.length === 0) {
        container.innerHTML = `<p class="center-align" id="noTasksMessage">${searchQuery || currentFilter !== 'all' ? 'Brak zadań spełniających kryteria.' : 'Brak zadań. Dodaj nowe.'}</p>`;
        return;
    }
    container.innerHTML = sorted.map(task => createTaskCard(task)).join('');
    attachTaskEventListeners();
}

function createTaskCard(task) {
    let isOverdue = false;
    if (task.deadline && !task.completed) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const deadline = new Date(task.deadline); deadline.setHours(0, 0, 0, 0);
        isOverdue = deadline < today;
    }
    const deadlineDate = task.deadline ? new Date(task.deadline).toLocaleDateString('pl-PL') : null;
    const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('pl-PL') : null;
    const priority = priorities[task.priority] || priorities.medium;

    return `
        <div class="task-card card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="card-content">
                <div class="row" style="margin-bottom: 0;">
                    <div class="col s12 m1">
                        <p><label><input type="checkbox" class="filled-in task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}"><span></span></label></p>
                    </div>
                    <div class="col s12 m11">
                        <h5 class="${task.completed ? 'strikethrough' : ''}" style="margin-top: 0; ${task.completed ? 'color: var(--text-secondary) !important;' : ''}">
                            ${escapeHtml(task.title)}
                            ${isOverdue && !task.completed ? '<span class="badge red white-text">Przeterminowane</span>' : ''}
                        </h5>
                        ${task.description ? `<p class="${task.completed ? 'strikethrough' : ''}" style="${task.completed ? 'color: var(--text-secondary) !important;' : ''}">${escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta" style="margin-top: 15px;">
                            ${task.assignee ? `<span class="chip"><i class="material-icons tiny">person</i> ${escapeHtml(task.assignee)}</span>` : ''}
                            <span class="chip ${priority.color} white-text"><i class="material-icons tiny">${priority.icon}</i> ${priority.name}</span>
                            ${deadlineDate ? `<span class="chip ${isOverdue && !task.completed ? 'red white-text' : 'custom-primary white-text'}"><i class="material-icons tiny">event</i> ${deadlineDate}</span>` : ''}
                            ${task.category ? `<span class="chip grey darken-1 white-text"><i class="material-icons tiny">label</i> ${escapeHtml(task.category)}</span>` : ''}
                        </div>
                        <div class="task-actions" style="margin-top: 15px;">
                            <button class="btn-small waves-effect waves-light custom-primary edit-task" data-task-id="${task.id}"><i class="material-icons left">edit</i>Edytuj</button>
                            <button class="btn-small waves-effect waves-light red delete-task" data-task-id="${task.id}"><i class="material-icons left">delete</i>Usuń</button>
                        </div>
                        <div class="task-dates" style="margin-top: 10px; font-size: 0.85rem;">
                            <i class="material-icons tiny">access_time</i> Utworzone: ${createdDate}
                            ${task.updatedAt && new Date(task.updatedAt).getTime() !== new Date(task.createdAt).getTime() ? ` | Zaktualizowane: ${new Date(task.updatedAt).toLocaleDateString('pl-PL')}` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERY (drobne zmiany)
// ============================================
function attachTaskEventListeners() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleTaskStatus(this.getAttribute('data-task-id'));
        });
    });
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', function() {
            editTask(this.getAttribute('data-task-id'));
        });
    });
    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
                deleteTask(this.getAttribute('data-task-id'));
            }
        });
    });
}

function setupEventListeners() {
    document.getElementById('taskForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) {
            showToast('Tytuł zadania jest wymagany', 'error');
            return;
        }
        const taskData = {
            title: title,
            description: document.getElementById('taskDescription').value,
            assignee: document.getElementById('taskAssignee').value,
            priority: document.getElementById('taskPriority').value,
            deadline: document.getElementById('taskDeadline').value || null,
            category: document.getElementById('taskCategory').value
        };

        if (editingTaskId) {
            await updateTask(editingTaskId, taskData);
        } else {
            await createTask(taskData);
        }
        cancelEdit();
    });

    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function(e) {
            e.preventDefault();
            currentFilter = this.getAttribute('data-filter');
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });

    document.getElementById('sortSelect').addEventListener('change', function() {
        currentSort = this.value;
        renderTasks();
    });

    document.getElementById('searchInput').addEventListener('input', function() {
        searchQuery = this.value;
        renderTasks();
    });

    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        renderTasks();
    });
    
    // Usunięto logikę importu/exportu z pliku, bo dane są na serwerze
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
}

// ============================================
// EDYCJA ZADANIA (drobne zmiany)
// ============================================
function editTask(taskId) {
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
        showToast('Zadanie nie zostało znalezione', 'error');
        return;
    }
    editingTaskId = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskAssignee').value = task.assignee || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category || '';
    document.getElementById('taskDeadline').value = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
    
    document.getElementById('formTitle').textContent = 'Edytuj zadanie';
    document.getElementById('submitButtonText').textContent = 'Zaktualizuj zadanie';
    document.getElementById('cancelEdit').style.display = 'inline-block';
    
    document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    M.updateTextFields();
    reinitializeDatePicker(document.getElementById('taskDeadline'), task.deadline);
}

function cancelEdit() {
    editingTaskId = null;
    document.getElementById('taskForm').reset();
    document.getElementById('formTitle').textContent = 'Dodaj nowe zadanie';
    document.getElementById('submitButtonText').textContent = 'Dodaj zadanie';
    document.getElementById('cancelEdit').style.display = 'none';
    M.updateTextFields();
    reinitializeDatePicker(document.getElementById('taskDeadline'));
}

// ============================================
// AKTUALIZACJA LICZNIKÓW I POWIADOMIENIA (bez zmian)
// ============================================
function updateCounters() {
    const activeTasks = tasks.filter(t => !t.completed).length;
    const totalTasks = tasks.length;
    document.getElementById('activeTasksCount').textContent = activeTasks;
    document.getElementById('footerTasksCount').textContent = totalTasks;
}

function showToast(message, type = 'info') {
    const bgColor = type === 'success' ? 'green' : type === 'error' ? 'red' : 'custom-toast-info';
    M.toast({
        html: message,
        classes: bgColor,
        displayLength: 3000
    });
}
