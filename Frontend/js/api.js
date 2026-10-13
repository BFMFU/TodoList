/**
 * API.JS - Tầng Dịch Vụ API Trừu Tượng Hóa (apiService)
 * Hỗ trợ chuyển đổi liền mạch giữa Mock Data (LocalStorage) và Spring Boot REST API
 *
 * Backend contract (demoss11 - TodoController, base: /api/v1/todos):
 *   GET    /                  ?completed=&priority=&keyword=   -> List<TodoResponse>
 *   GET    /{id}                                               -> TodoResponse
 *   POST   /                  { title, description, priority, dueDate }
 *   PUT    /{id}              { title*, description, completed, priority, dueDate }
 *   PATCH  /{id}/toggle                                        -> TodoResponse
 *   DELETE /{id}
 * Mọi response được bọc trong ApiDataResponse { success, message, data, errors, httpStatus }
 */
window.apiService = (() => {
  const MOCK_STORAGE_KEY = 'SPRING_BOOT_TODOS_MOCK_DATA_V1';

  /**
   * Dữ liệu khởi tạo mẫu theo đúng Data Contract của Spring Boot
   */
  const DEFAULT_MOCK_ITEMS = [
    {
      id: 101,
      title: 'Tích hợp Spring Security & JWT cho hệ thống',
      description: 'Cấu hình filter chain và sinh token',
      completed: false,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Ngày mai
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 102,
      title: 'Viết Unit Test JUnit 5 cho TodoService và Repository',
      description: '',
      completed: true,
      priority: 'MEDIUM',
      dueDate: new Date().toISOString().split('T')[0], // Hôm nay
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 103,
      title: 'Cấu hình Dockerfile & GitHub Actions Dependency Caching',
      description: '',
      completed: false,
      priority: 'LOW',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Ngày kia
      createdAt: new Date(Date.now() - 10800000).toISOString()
    }
  ];

  /* --------------------------------------------------------------------------
     MOCK DATA HELPERS (Chạy trong LocalStorage)
     -------------------------------------------------------------------------- */
  function getMockStorage() {
    try {
      const data = localStorage.getItem(MOCK_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', e);
    }
    setMockStorage(DEFAULT_MOCK_ITEMS);
    return [...DEFAULT_MOCK_ITEMS];
  }

  function setMockStorage(items) {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Lỗi ghi LocalStorage:', e);
    }
  }

  async function simulateNetworkDelay() {
    const delay = (window.CONFIG && window.CONFIG.MOCK_DELAY_MS) || 200;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  function findMockIndex(items, id) {
    const index = items.findIndex(t => String(t.id) === String(id));
    if (index === -1) throw new Error('Không tìm thấy công việc');
    return index;
  }

  /* --------------------------------------------------------------------------
     REAL API FETCH HELPER
     -------------------------------------------------------------------------- */

  /**
   * Gửi request tới backend và tự động bóc tách ApiDataResponse.
   * @returns {Promise<any>} Trường `data` của ApiDataResponse
   * @throws {Error} Error có thêm `fieldErrors` (Map field -> message) khi validate thất bại
   */
  async function request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    let response;
    try {
      response = await fetch(endpoint, config);
    } catch (networkErr) {
      console.error(`[API Error] Không kết nối được tới ${endpoint}:`, networkErr);
      throw new Error('Không kết nối được tới Backend. Hãy kiểm tra server Spring Boot đã chạy ở cổng 8080 chưa.');
    }

    if (response.status === 204) return null;

    let body = null;
    try {
      body = await response.json();
    } catch (_) {
      // Response không có body JSON
    }

    if (!response.ok || (body && body.success === false)) {
      let message = (body && body.message) || `Lỗi HTTP: ${response.status} ${response.statusText}`;
      const fieldErrors = body && body.errors && typeof body.errors === 'object' ? body.errors : null;
      if (fieldErrors) {
        const details = Object.values(fieldErrors).join('; ');
        if (details) message = `${message}: ${details}`;
      }
      const error = new Error(message);
      error.status = response.status;
      error.fieldErrors = fieldErrors;
      console.error(`[API Error] ${config.method || 'GET'} ${endpoint}:`, body || response.statusText);
      throw error;
    }

    // Bóc ApiDataResponse -> data
    return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
  }

  /** Chuẩn hóa payload cho PUT (backend ghi đè toàn bộ, title bắt buộc) */
  function buildUpdatePayload(todo) {
    return {
      title: (todo.title || '').trim(),
      description: todo.description || null,
      completed: !!todo.completed,
      priority: todo.priority || 'MEDIUM',
      dueDate: todo.dueDate || null
    };
  }

  /* --------------------------------------------------------------------------
     PUBLIC API SERVICE METHODS
     -------------------------------------------------------------------------- */
  return {
    /**
     * Lấy danh sách công việc
     * @param {Object} filters - { keyword, priority, completed } (đều tùy chọn)
     * @returns {Promise<Array>} Danh sách Todos
     */
    async getTodos(filters = {}) {
      const { keyword = '', priority = '', completed = null } = filters;

      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        let items = getMockStorage();
        if (keyword && keyword.trim()) {
          const q = keyword.trim().toLowerCase();
          items = items.filter(t => t.title.toLowerCase().includes(q));
        }
        if (priority) items = items.filter(t => t.priority === priority);
        if (completed !== null && completed !== undefined) items = items.filter(t => !!t.completed === completed);
        return items;
      }

      const params = new URLSearchParams();
      if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
      if (priority) params.append('priority', priority);
      if (completed !== null && completed !== undefined) params.append('completed', String(completed));
      const qs = params.toString();

      const data = await request(`${window.CONFIG.API_BASE_URL}${qs ? `?${qs}` : ''}`, { method: 'GET' });
      return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy chi tiết một công việc
     * @param {number|string} id
     */
    async getTodoById(id) {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        return items[findMockIndex(items, id)];
      }
      return await request(`${window.CONFIG.API_BASE_URL}/${id}`, { method: 'GET' });
    },

    /**
     * Tạo mới một công việc
     * @param {Object} data - { title, description, priority, dueDate }
     * @returns {Promise<Object>} Todo vừa tạo
     */
    async createTodo(data) {
      const payload = {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate || null
      };

      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const newTodo = {
          ...payload,
          completed: false,
          id: Date.now(), // Giả lập ID kiểu Long/Number
          createdAt: new Date().toISOString()
        };
        items.unshift(newTodo);
        setMockStorage(items);
        return newTodo;
      }

      return await request(window.CONFIG.API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    /**
     * Cập nhật công việc (PUT ghi đè toàn bộ).
     * Truyền vào todo hiện tại + các thay đổi để không làm mất dữ liệu (description, dueDate...).
     * @param {number|string} id - Mã định danh Todo
     * @param {Object} todo - Đối tượng todo đầy đủ sau khi đã áp thay đổi
     * @returns {Promise<Object>} Todo sau cập nhật
     */
    async updateTodo(id, todo) {
      const payload = buildUpdatePayload(todo);

      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const index = findMockIndex(items, id);
        items[index] = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
        setMockStorage(items);
        return items[index];
      }

      return await request(`${window.CONFIG.API_BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    /**
     * Đảo trạng thái hoàn thành (PATCH /{id}/toggle)
     * @param {number|string} id
     * @returns {Promise<Object>} Todo sau khi toggle
     */
    async toggleTodo(id) {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const index = findMockIndex(items, id);
        items[index] = { ...items[index], completed: !items[index].completed };
        setMockStorage(items);
        return items[index];
      }

      return await request(`${window.CONFIG.API_BASE_URL}/${id}/toggle`, { method: 'PATCH' });
    },

    /**
     * Xóa một công việc theo ID
     * @param {number|string} id - Mã định danh Todo
     * @returns {Promise<boolean>}
     */
    async deleteTodo(id) {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage().filter(t => String(t.id) !== String(id));
        setMockStorage(items);
        return true;
      }

      await request(`${window.CONFIG.API_BASE_URL}/${id}`, { method: 'DELETE' });
      return true;
    },

    /**
     * Xóa tất cả các công việc đã hoàn thành.
     * Backend không có endpoint batch nên lấy danh sách completed=true rồi xóa từng mục.
     * @returns {Promise<number>} Số công việc đã xóa
     */
    async clearCompleted() {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const remaining = items.filter(t => !t.completed);
        setMockStorage(remaining);
        return items.length - remaining.length;
      }

      const completedItems = await this.getTodos({ completed: true });
      await Promise.all(completedItems.map(item => this.deleteTodo(item.id)));
      return completedItems.length;
    }
  };
})();
