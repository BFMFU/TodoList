/**
 * API.JS - Tầng Dịch Vụ API Trừu Tượng Hóa (apiService)
 * Hỗ trợ chuyển đổi liền mạch giữa Mock Data (LocalStorage) và Spring Boot REST API
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
      completed: false,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Ngày mai
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 102,
      title: 'Viết Unit Test JUnit 5 cho TodoService và Repository',
      completed: true,
      priority: 'MEDIUM',
      dueDate: new Date().toISOString().split('T')[0], // Hôm nay
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 103,
      title: 'Cấu hình Dockerfile & GitHub Actions Dependency Caching',
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

  /* --------------------------------------------------------------------------
     REAL API FETCH HELPER
     -------------------------------------------------------------------------- */
  async function request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(endpoint, config);

      // Nếu xóa thành công trả về 204 No Content
      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        let errorDetail = `Lỗi HTTP: ${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson.message) errorDetail = errJson.message;
        } catch (_) {}
        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Error] Yêu cầu tới ${endpoint} thất bại:`, error);
      throw error;
    }
  }

  /* --------------------------------------------------------------------------
     PUBLIC API SERVICE METHODS
     -------------------------------------------------------------------------- */
  return {
    /**
     * Lấy danh sách công việc (có hỗ trợ tìm kiếm từ khóa)
     * @param {string} search - Từ khóa tìm kiếm (tùy chọn)
     * @returns {Promise<Array>} Danh sách Todos
     */
    async getTodos(search = '') {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        let items = getMockStorage();
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          items = items.filter(t => t.title.toLowerCase().includes(q));
        }
        return items;
      }

      const queryParam = search ? `?search=${encodeURIComponent(search.trim())}` : '';
      return await request(`${window.CONFIG.API_BASE_URL}${queryParam}`, {
        method: 'GET'
      });
    },

    /**
     * Tạo mới một công việc
     * @param {Object} data - { title, priority, dueDate }
     * @returns {Promise<Object>} Todo vừa tạo
     */
    async createTodo(data) {
      const payload = {
        title: data.title.trim(),
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate || null,
        completed: false
      };

      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const newTodo = {
          ...payload,
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
     * Cập nhật thông tin công việc (tiêu đề, trạng thái completed, priority, dueDate)
     * @param {number|string} id - Mã định danh Todo
     * @param {Object} data - Các trường cần cập nhật
     * @returns {Promise<Object>} Todo sau cập nhật
     */
    async updateTodo(id, data) {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        const items = getMockStorage();
        const index = items.findIndex(t => t.id === Number(id) || t.id === id);
        if (index === -1) throw new Error('Không tìm thấy công việc cần sửa');

        items[index] = { ...items[index], ...data };
        setMockStorage(items);
        return items[index];
      }

      return await request(`${window.CONFIG.API_BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Xóa một công việc theo ID
     * @param {number|string} id - Mã định danh Todo
     * @returns {Promise<boolean>}
     */
    async deleteTodo(id) {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        let items = getMockStorage();
        items = items.filter(t => t.id !== Number(id) && t.id !== id);
        setMockStorage(items);
        return true;
      }

      await request(`${window.CONFIG.API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      return true;
    },

    /**
     * Xóa tất cả các công việc đã hoàn thành
     * @returns {Promise<boolean>}
     */
    async clearCompleted() {
      if (window.CONFIG.USE_MOCK) {
        await simulateNetworkDelay();
        let items = getMockStorage();
        items = items.filter(t => !t.completed);
        setMockStorage(items);
        return true;
      }

      // Đối với Backend, gọi endpoint batch delete nếu có,
      // hoặc xóa từng mục nếu backend thiết kế chuẩn CRUD đơn lẻ
      try {
        await request(`${window.CONFIG.API_BASE_URL}/completed`, {
          method: 'DELETE'
        });
      } catch (err) {
        // Fallback: nếu backend chưa viết endpoint /completed, tự lấy danh sách và xóa từng cái
        console.warn('Backend chưa có endpoint DELETE /api/todos/completed, thực hiện xóa fallback...');
        const currentTodos = await this.getTodos();
        const completedItems = currentTodos.filter(t => t.completed);
        await Promise.all(completedItems.map(item => this.deleteTodo(item.id)));
      }
      return true;
    }
  };
})();
