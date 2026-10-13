/**
 * CONFIG.JS - Tầng Cấu Hình Frontend
 * Dễ dàng chuyển đổi giữa Chế độ Mock dữ liệu và Gọi Backend API thật
 */
window.CONFIG = {
  /**
   * Biến cờ (Flag) kiểm soát nguồn dữ liệu:
   * - true:  Chạy chế độ GIẢ LẬP (Mock) lưu vào LocalStorage, giả lập delay mạng 200ms.
   * - false: Gọi trực tiếp REST API từ Spring Boot Backend.
   */
  USE_MOCK: true,

  /**
   * Tự động xác định URL của Backend API:
   * - Khi gộp vào thư mục static của Spring Boot (chung domain/port): dùng relative path '/api/todos' (tránh tuyệt đối lỗi CORS).
   * - Khi chạy frontend độc lập (mở file trực tiếp hoặc Live Server cổng khác): trỏ về 'http://localhost:8080/api/todos'.
   */
  API_BASE_URL: (() => {
    // Nếu chạy trực tiếp từ file:/// hoặc cổng khác 8080 khi dev tách rời
    if (window.location.protocol === 'file:' || (window.location.port !== '8080' && window.location.port !== '')) {
      return 'http://localhost:8080/api/todos';
    }
    // Khi deploy cùng Spring Boot (truy cập qua http://localhost:8080/)
    return '/api/todos';
  })(),

  /**
   * Thời gian giả lập độ trễ mạng khi dùng Mock (milliseconds)
   */
  MOCK_DELAY_MS: 200,

  /**
   * Thời gian debounce cho ô tìm kiếm (milliseconds)
   */
  SEARCH_DEBOUNCE_MS: 300
};
