/**
 * APP.JS - UI Controller & State Management
 * Quản lý giao diện, sự kiện tương tác, debounce tìm kiếm và kết nối tới apiService
 */
document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    todos: [],
    filter: 'ALL', // 'ALL' | 'ACTIVE' | 'COMPLETED'
    priorityFilter: '', // '' | 'HIGH' | 'MEDIUM' | 'LOW' (gửi lên backend)
    searchQuery: '',
    isLoading: false,
    editingId: null,
    isSaving: false,
    searchTimeout: null
  };

  // DOM Elements
  const el = {
    currentDate: document.getElementById('currentDate'),
    modeBadge: document.getElementById('modeBadge'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    
    // Form Inputs
    newTodoTitle: document.getElementById('newTodoTitle'),
    newTodoDescription: document.getElementById('newTodoDescription'),
    newTodoPriority: document.getElementById('newTodoPriority'),
    newTodoDueDate: document.getElementById('newTodoDueDate'),
    addTodoBtn: document.getElementById('addTodoBtn'),

    // Search & Filter
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    priorityFilter: document.getElementById('priorityFilter'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    
    // Counts & Progress
    countAll: document.getElementById('countAll'),
    countActive: document.getElementById('countActive'),
    countCompleted: document.getElementById('countCompleted'),
    activeCountText: document.getElementById('activeCountText'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    progressFraction: document.getElementById('progressFraction'),

    // Task List & Containers
    todoListContainer: document.getElementById('todoListContainer'),
    loadingSkeleton: document.getElementById('loadingSkeleton'),
    emptyState: document.getElementById('emptyState'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     INIT & THEME SETUP
     ========================================================================== */
  function init() {
    renderDate();
    renderModeBadge();
    initTheme();
    bindEvents();
    fetchTodos();
  }

  function renderDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('vi-VN', options);
    if (el.currentDate) {
      el.currentDate.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
  }

  function renderModeBadge() {
    if (!el.modeBadge) return;
    if (window.CONFIG.USE_MOCK) {
      el.modeBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1.5 cursor-pointer';
      el.modeBadge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Mock Mode (LocalStorage)</span>
      `;
      el.modeBadge.title = 'Đang chạy chế độ Giả lập. Đổi CONFIG.USE_MOCK = false trong js/config.js để gọi Spring Boot API.';
    } else {
      el.modeBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1.5';
      el.modeBadge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Live API: ${window.CONFIG.API_BASE_URL}</span>
      `;
      el.modeBadge.title = 'Đang kết nối API Backend Spring Boot thực tế.';
    }
  }

  function initTheme() {
    const isDark = localStorage.getItem('THEME_MODE') === 'dark' || 
      (!('THEME_MODE' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (el.themeToggleBtn) {
      el.themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const currentDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('THEME_MODE', currentDark ? 'dark' : 'light');
      });
    }
  }

  /* ==========================================================================
     TOAST NOTIFICATION
     ========================================================================== */
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    const isSuccess = type === 'success';

    let bgClass = 'bg-slate-900 text-white dark:bg-slate-800 border-slate-700';
    if (isError) bgClass = 'bg-rose-600 text-white border-rose-700';
    if (isSuccess) bgClass = 'bg-emerald-600 text-white border-emerald-700';

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
    
    let iconSvg = `
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
    if (isSuccess) {
      iconSvg = `
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      `;
    }
    if (isError) {
      iconSvg = `
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ==========================================================================
     DATA FETCHING & OPERATIONS
     ========================================================================== */
  async function fetchTodos() {
    setLoading(true);
    try {
      // Lọc keyword + priority ở backend; lọc trạng thái (Đang làm/Đã xong) ở client để đếm số lượng chính xác
      state.todos = await window.apiService.getTodos({
        keyword: state.searchQuery,
        priority: state.priorityFilter
      });
      renderUI();
    } catch (err) {
      state.todos = [];
      renderUI();
      showToast(`Không thể tải dữ liệu: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function findTodo(id) {
    return state.todos.find(t => String(t.id) === String(id));
  }

  function replaceTodo(updated) {
    const index = state.todos.findIndex(t => String(t.id) === String(updated.id));
    if (index !== -1) state.todos[index] = updated;
  }

  /** Kiểm tra todo có khớp bộ lọc đang gửi lên server hay không */
  function matchesServerFilters(todo) {
    if (state.priorityFilter && todo.priority !== state.priorityFilter) return false;
    if (state.searchQuery && !todo.title.toLowerCase().includes(state.searchQuery.toLowerCase())) return false;
    return true;
  }

  async function handleAddTodo() {
    const title = el.newTodoTitle.value.trim();
    if (!title) {
      el.newTodoTitle.focus();
      return;
    }

    const description = el.newTodoDescription ? el.newTodoDescription.value.trim() : '';
    const priority = el.newTodoPriority.value;
    const dueDate = el.newTodoDueDate.value || null;

    el.addTodoBtn.disabled = true;
    try {
      const created = await window.apiService.createTodo({ title, description, priority, dueDate });
      if (created && matchesServerFilters(created)) {
        state.todos.unshift(created);
      }

      // Reset form
      el.newTodoTitle.value = '';
      if (el.newTodoDescription) el.newTodoDescription.value = '';
      el.newTodoDueDate.value = '';
      el.newTodoPriority.value = 'MEDIUM';
      el.newTodoTitle.focus();

      renderUI();
      showToast('Đã thêm công việc thành công', 'success');
    } catch (err) {
      showToast(`Lỗi khi tạo công việc: ${err.message}`, 'error');
    } finally {
      el.addTodoBtn.disabled = false;
    }
  }

  async function handleToggleComplete(id) {
    const todo = findTodo(id);
    if (!todo) return;

    try {
      // PATCH /api/v1/todos/{id}/toggle
      const updated = await window.apiService.toggleTodo(id);
      replaceTodo(updated || { ...todo, completed: !todo.completed });
      renderUI();
    } catch (err) {
      renderUI(); // Hoàn tác trạng thái checkbox trên UI
      showToast(`Lỗi khi cập nhật trạng thái: ${err.message}`, 'error');
    }
  }

  async function handleDeleteTodo(id) {
    const todo = findTodo(id);
    if (todo && !confirm(`Xóa công việc "${todo.title}"?`)) return;

    try {
      await window.apiService.deleteTodo(id);
      state.todos = state.todos.filter(t => String(t.id) !== String(id));
      renderUI();
      showToast('Đã xóa công việc', 'info');
    } catch (err) {
      showToast(`Lỗi khi xóa công việc: ${err.message}`, 'error');
    }
  }

  function startEdit(id) {
    if (String(state.editingId) === String(id)) return;
    state.editingId = id;
    renderUI();
  }

  function cancelEdit() {
    state.editingId = null;
    renderUI();
  }

  async function handleSaveEdit(id) {
    if (state.isSaving) return;
    const todo = findTodo(id);
    if (!todo) return cancelEdit();

    const titleEl = document.getElementById(`edit-title-${id}`);
    const descEl = document.getElementById(`edit-desc-${id}`);
    const priorityEl = document.getElementById(`edit-priority-${id}`);
    const dueEl = document.getElementById(`edit-due-${id}`);

    const title = titleEl ? titleEl.value.trim() : todo.title;
    if (!title) {
      showToast('Tiêu đề công việc không được để trống', 'error');
      if (titleEl) titleEl.focus();
      return;
    }

    // PUT ghi đè toàn bộ -> gửi đầy đủ các trường để không mất dữ liệu
    const merged = {
      ...todo,
      title,
      description: descEl ? descEl.value.trim() : todo.description,
      priority: priorityEl ? priorityEl.value : todo.priority,
      dueDate: dueEl ? (dueEl.value || null) : todo.dueDate
    };

    state.isSaving = true;
    try {
      const updated = await window.apiService.updateTodo(id, merged);
      replaceTodo(updated || merged);
      state.editingId = null;
      renderUI();
      showToast('Đã cập nhật công việc', 'success');
    } catch (err) {
      showToast(`Lỗi cập nhật: ${err.message}`, 'error');
    } finally {
      state.isSaving = false;
    }
  }

  async function handleClearCompleted() {
    const completedCount = state.todos.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('Không có việc hoàn thành nào để xóa', 'info');
      return;
    }
    if (!confirm('Xóa tất cả công việc đã hoàn thành?')) return;

    try {
      const deleted = await window.apiService.clearCompleted();
      showToast(`Đã xóa ${deleted} việc đã hoàn thành`, 'success');
    } catch (err) {
      showToast(`Lỗi dọn dẹp: ${err.message}`, 'error');
    } finally {
      await fetchTodos(); // Đồng bộ lại với backend
    }
  }

  /* ==========================================================================
     RENDERING HELPERS
     ========================================================================== */
  function setLoading(loading) {
    state.isLoading = loading;
    if (el.loadingSkeleton) {
      el.loadingSkeleton.style.display = loading ? 'block' : 'none';
    }
    if (el.todoListContainer) {
      el.todoListContainer.style.display = loading ? 'none' : 'flex';
    }
  }

  function getFilteredTodos() {
    return state.todos.filter(todo => {
      // Filter status
      if (state.filter === 'ACTIVE' && todo.completed) return false;
      if (state.filter === 'COMPLETED' && !todo.completed) return false;

      // Backend ưu tiên keyword hơn priority, nên lọc lại ở client để kết hợp cả hai
      return matchesServerFilters(todo);
    });
  }

  function renderUI() {
    updateCountsAndProgress();
    renderTodoList();
  }

  function updateCountsAndProgress() {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.completed).length;
    const active = total - completed;

    // Badges count
    if (el.countAll) el.countAll.textContent = total;
    if (el.countActive) el.countActive.textContent = active;
    if (el.countCompleted) el.countCompleted.textContent = completed;

    // Footer active count
    if (el.activeCountText) {
      el.activeCountText.textContent = `${active} công việc còn lại`;
    }

    // Progress bar
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (el.progressFill) el.progressFill.style.width = `${percent}%`;
    if (el.progressPercent) el.progressPercent.textContent = `${percent}%`;
    if (el.progressFraction) el.progressFraction.textContent = `${completed}/${total} hoàn thành`;
  }

  function renderTodoList() {
    const filtered = getFilteredTodos();

    if (filtered.length === 0) {
      el.todoListContainer.innerHTML = '';
      el.emptyState.style.display = 'flex';

      const emptyTitleEl = el.emptyState.querySelector('.empty-title');
      const emptyDescEl = el.emptyState.querySelector('.empty-desc');
      if (state.searchQuery) {
        emptyTitleEl.textContent = 'Không tìm thấy kết quả';
        emptyDescEl.textContent = `Không có công việc nào khớp với "${escapeHtml(state.searchQuery)}"`;
      } else if (state.filter === 'ACTIVE') {
        emptyTitleEl.textContent = 'Tuyệt vời, bạn đã hoàn thành hết!';
        emptyDescEl.textContent = 'Hiện không còn công việc nào đang chờ xử lý.';
      } else if (state.filter === 'COMPLETED') {
        emptyTitleEl.textContent = 'Chưa có việc hoàn thành';
        emptyDescEl.textContent = 'Tích chọn các công việc đã làm xong để theo dõi tiến độ.';
      } else {
        emptyTitleEl.textContent = 'Danh sách đang trống';
        emptyDescEl.textContent = 'Hãy thêm công việc mới ở trên để bắt đầu ngày làm việc hiệu quả!';
      }
      return;
    }

    el.emptyState.style.display = 'none';

    el.todoListContainer.innerHTML = filtered.map(todo => {
      const isEditing = String(state.editingId) === String(todo.id);
      
      // Priority badge styles
      let priorityBadge = '';
      if (todo.priority === 'HIGH') {
        priorityBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Cao
          </span>
        `;
      } else if (todo.priority === 'MEDIUM') {
        priorityBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Vừa
          </span>
        `;
      } else {
        priorityBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Thấp
          </span>
        `;
      }

      // Due date badge
      let dueDateBadge = '';
      if (todo.dueDate) {
        const isOverdue = !todo.completed && isDatePast(todo.dueDate);
        const dateFormatted = formatDisplayDate(todo.dueDate);
        const overdueClass = isOverdue 
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold' 
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

        dueDateBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${overdueClass}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6" stroke-width="2"></line>
              <line x1="8" y1="2" x2="8" y2="6" stroke-width="2"></line>
              <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"></line>
            </svg>
            ${dateFormatted} ${isOverdue ? '(Quá hạn)' : ''}
          </span>
        `;
      }

      if (isEditing) {
        const p = todo.priority || 'MEDIUM';
        return `
          <div class="task-item-enter p-3.5 bg-white dark:bg-slate-800/90 border-2 border-indigo-500 rounded-xl shadow-md flex flex-col gap-2" data-editing="true">
            <input 
              type="text" 
              id="edit-title-${todo.id}" 
              maxlength="150"
              class="w-full px-2 py-1 text-sm font-medium bg-transparent text-slate-900 dark:text-white outline-none border-b border-slate-200 dark:border-slate-700"
              value="${escapeHtml(todo.title)}"
              placeholder="Tiêu đề công việc"
            />
            <textarea
              id="edit-desc-${todo.id}"
              rows="2"
              maxlength="1000"
              class="w-full px-2 py-1 text-xs bg-transparent text-slate-600 dark:text-slate-300 outline-none resize-none"
              placeholder="Mô tả (tùy chọn)"
            >${escapeHtml(todo.description || '')}</textarea>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <select id="edit-priority-${todo.id}" class="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none">
                  <option value="HIGH" ${p === 'HIGH' ? 'selected' : ''}>Ưu tiên: Cao</option>
                  <option value="MEDIUM" ${p === 'MEDIUM' ? 'selected' : ''}>Ưu tiên: Vừa</option>
                  <option value="LOW" ${p === 'LOW' ? 'selected' : ''}>Ưu tiên: Thấp</option>
                </select>
                <input type="date" id="edit-due-${todo.id}" value="${todo.dueDate || ''}" class="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 outline-none" />
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" data-action="cancel-edit" data-id="${todo.id}" class="px-3 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Hủy</button>
                <button type="button" data-action="save-edit" data-id="${todo.id}" class="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Lưu</button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="task-item-enter group flex items-center gap-3.5 p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all ${todo.completed ? 'opacity-70 bg-slate-50/60 dark:bg-slate-800/40' : ''}" data-id="${todo.id}">
          <!-- Checkbox -->
          <label class="relative flex items-center justify-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              class="custom-checkbox sr-only" 
              ${todo.completed ? 'checked' : ''} 
              data-action="toggle" 
              data-id="${todo.id}"
            />
            <div class="w-5 h-5 rounded-md border-2 ${todo.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'} flex items-center justify-center transition-colors">
              <svg class="w-3.5 h-3.5 text-white ${todo.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all transform pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
            </div>
          </label>

          <!-- Title & Meta -->
          <div class="flex-1 min-w-0 cursor-pointer" data-action="edit" data-id="${todo.id}" title="Nhấp đúp chuột để chỉnh sửa">
            <p class="text-sm font-medium ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} truncate select-none">
              ${escapeHtml(todo.title)}
            </p>
            ${todo.description ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 select-none">${escapeHtml(todo.description)}</p>` : ''}
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${priorityBadge}
              ${dueDateBadge}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button 
              type="button" 
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              data-action="edit" 
              data-id="${todo.id}"
              title="Sửa công việc"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              type="button" 
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              data-action="delete" 
              data-id="${todo.id}"
              title="Xóa công việc"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Focus input if editing
    if (state.editingId !== null) {
      const editTitle = document.getElementById(`edit-title-${state.editingId}`);
      if (editTitle) {
        editTitle.focus();
        editTitle.select();
      }
    }
  }

  /* ==========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================== */
  function bindEvents() {
    // Add Todo button & Enter key
    el.addTodoBtn.addEventListener('click', handleAddTodo);
    el.newTodoTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTodo();
      }
    });

    // Delegated actions for Todo List (toggle, edit, delete, save/cancel edit)
    el.todoListContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const id = Number(target.dataset.id) || target.dataset.id;

      if (action === 'toggle') {
        handleToggleComplete(id);
      } else if (action === 'delete') {
        handleDeleteTodo(id);
      } else if (action === 'edit') {
        startEdit(id);
      } else if (action === 'save-edit') {
        handleSaveEdit(id);
      } else if (action === 'cancel-edit') {
        cancelEdit();
      }
    });

    // Phím tắt trong form sửa: Enter (ở ô tiêu đề) = Lưu, Escape = Hủy
    el.todoListContainer.addEventListener('keydown', (e) => {
      if (state.editingId === null) return;
      if (e.key === 'Escape') {
        cancelEdit();
      } else if (e.key === 'Enter' && e.target.id === `edit-title-${state.editingId}`) {
        e.preventDefault();
        handleSaveEdit(state.editingId);
      }
    });

    // Double-click to edit
    el.todoListContainer.addEventListener('dblclick', (e) => {
      if (e.target.closest('[data-editing]')) return;
      const taskRow = e.target.closest('[data-id]');
      if (taskRow) {
        const id = Number(taskRow.dataset.id) || taskRow.dataset.id;
        startEdit(id);
      }
    });

    // Filter Buttons
    el.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.filterBtns.forEach(b => {
          b.classList.remove('bg-indigo-50', 'text-indigo-600', 'dark:bg-indigo-950/60', 'dark:text-indigo-400');
          b.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        btn.classList.add('bg-indigo-50', 'text-indigo-600', 'dark:bg-indigo-950/60', 'dark:text-indigo-400');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');

        state.filter = btn.dataset.filter;
        renderUI();
      });
    });

    // Priority Filter -> gọi backend ?priority=
    if (el.priorityFilter) {
      el.priorityFilter.addEventListener('change', () => {
        state.priorityFilter = el.priorityFilter.value;
        fetchTodos();
      });
    }

    // Debounced Search Input -> gọi backend ?keyword=
    el.searchInput.addEventListener('input', (e) => {
      clearTimeout(state.searchTimeout);
      const query = e.target.value.trim();
      el.clearSearchBtn.style.display = query ? 'flex' : 'none';

      state.searchTimeout = setTimeout(() => {
        state.searchQuery = query;
        fetchTodos();
      }, window.CONFIG.SEARCH_DEBOUNCE_MS || 300);
    });

    // Clear Search button
    el.clearSearchBtn.addEventListener('click', () => {
      clearTimeout(state.searchTimeout);
      el.searchInput.value = '';
      state.searchQuery = '';
      el.clearSearchBtn.style.display = 'none';
      fetchTodos();
    });

    // Clear Completed Tasks
    el.clearCompletedBtn.addEventListener('click', handleClearCompleted);
  }

  /* ==========================================================================
     UTILITIES
     ========================================================================== */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
    } catch (_) {}
    return dateStr;
  }

  function isDatePast(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  }

  // Khởi động ứng dụng
  init();
});
