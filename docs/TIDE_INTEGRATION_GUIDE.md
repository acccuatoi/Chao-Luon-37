# Hướng Dẫn Tích Hợp TideCloak & Cơ Chế Emergent Authority

Tài liệu này giải thích cách hoạt động của TideCloak trong khuôn khổ thử thách **UNLOCKED Hackathon 2026** của Tide Foundation & RMIT.

---

## 1. Khái Niệm Cốt Lõi: Emergent Authority là gì?

Trong các hệ thống bảo mật truyền thống (Access Control thông thường, RBAC, OAuth):
- Một **máy chủ trung tâm** hoặc **quản trị viên cấp cao (Super Admin)** luôn nắm giữ hoặc có khả năng cấp phát **Master Key**.
- Người dùng buộc phải **tin tưởng** bên vận hành hệ thống (hoặc bên cung cấp đám mây) không xâm phạm dữ liệu của họ.

Trong mô hình **Emergent Authority** của Tide:
- **Không có Master Key đơn phương nào tồn tại**: Không một cá nhân, một máy chủ hay một tổ chức nào có thể tự ý mở khóa dữ liệu hoặc sửa đổi chính sách bảo vệ.
- Quyền hạn (Authority) chỉ **xuất hiện (emerges)** khi cả 3 yếu tố hội tụ qua mạng lưới các node độc lập của Tide:
  1. **Identity**: Danh tính người dùng được xác thực mật mã.
  2. **Policy**: Chính sách và quy tắc bảo vệ đã được định nghĩa.
  3. **Approvals**: Sự chấp thuận hoặc đồng thuận (Quorum Governance) từ các bên liên quan.

---

## 2. TideCloak mang lại điều gì cho ứng dụng?

1. **End-to-End Encryption gắn liền với phiên**: Dữ liệu được mã hóa ngay tại thiết bị của người dùng trước khi gửi đi.
2. **Zero Master Key**: Server ứng dụng chỉ lưu trữ dữ liệu đã mã hóa (ciphertext). Kể cả khi cơ sở dữ liệu bị lộ, kẻ tấn công hoặc Admin không thể giải mã.
3. **Phân quyền dựa trên chính sách (Policy-bound Access)**: Quyền giải mã chỉ được cấp phát theo ngữ cảnh phiên và vai trò được xác minh qua Tide network.
4. **Thu hồi quyền tức thì (Instant Revocation)**: Khi người dùng thu hồi quyền, các yêu cầu giải mã tiếp theo bị từ chối ngay lập tức.

---

## 3. Cách Kết Nối AI Coding Agent với Tide MCP
Theo khuyến nghị từ Tide:
- Nếu bạn sử dụng Claude Code, Cursor hoặc VS Code:
  Tham khảo [https://tide.org/agent-plugins](https://tide.org/agent-plugins) để cấu hình MCP Server của Tide.
- MCP Server của Tide sẽ cung cấp cho Agent các lệnh và công cụ trực tiếp để tích hợp SDK TideCloak vào mã nguồn.
- Tài liệu chính thức: [https://docs.tide.org/](https://docs.tide.org/)
