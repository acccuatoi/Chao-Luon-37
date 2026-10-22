# Kịch Bản Video Demo 2 Phút (Video Script Template)
**Dự án:** Chao-Luon-37 | SentinelAgent  
**Thời lượng:** 2 phút (120 giây)  
**File xuất ra:** `submission/demo_video/demo.mp4` (< 100MB)

---

### Phân Cảnh Chi Tiết

#### 1. The Possibility (00:00 - 00:30) - Khả năng mới
- **Hình ảnh:** Mở đầu với giao diện Autonomous Agent Console trên `http://localhost:3000`.
- **Lời thoại (Voiceover):**
  > "Autonomous AI agents have the potential to run corporate audits, manage cloud infrastructure, and process financial settlements 24/7. But today, organizations are terrified of letting AI run freely."

#### 2. The Constraint (00:30 - 00:55) - Rào cản niềm tin & bảo mật
- **Hình ảnh:** Minh họa sơ đồ tấn công Prompt Injection hoặc lộ API keys trong RAM / .env.
- **Lời thoại (Voiceover):**
  > "Why? Because delegating actions to an AI agent requires giving it master API keys or database credentials. If an agent is fooled by an indirect prompt injection or suffers a hallucination, an attacker can exfiltrate customer databases or drain financial accounts. Traditional access control is all-or-nothing."

#### 3. The Prototype & TideCloak (00:55 - 01:40) - Trình diễn nguyên mẫu
- **Hình ảnh:**
  1. Click chạy **Scenario 1 (Legitimate Task)**: Hiển thị 4 node Tide đồng thuận 4/4 và cấp khóa phiên tạm thời (Ephemeral key) để giải mã báo cáo Q3.
  2. Click chạy **Scenario 2 (Adversarial Prompt Injection)**: AI bị lừa đòi xuất Customer PII. Cả 4 node Tide ngay lập tức từ chối ký (Quorum Refused) và cách ly hành vi.
  3. Click nút đỏ **"Simulate Host Root Key Override"**: Thể hiện rằng kể cả admin đám mây cũng không thể giải mã vì không có Master Key tĩnh.
- **Lời thoại (Voiceover):**
  > "With TideCloak Emergent Authority, our agent SentinelAgent holds ZERO master keys. Watch this: when the agent executes a legitimate financial task, 4 independent Tide nodes reach quorum and synthesize an ephemeral single-use key. 
  > But when an attacker attempts a prompt-injection jailbreak to dump customer PII, the Tide quorum unanimously refuses key synthesis! The agent is sandboxed cryptographically. Even the cloud host operator has zero master keys to bypass this."

#### 4. What Changes (01:40 - 02:00) - Giá trị mang lại
- **Hình ảnh:** Hiển thị trang tổng quan, audit log hoàn chỉnh và huy hiệu "Zero Master-Key Invariant".
- **Lời thoại (Voiceover):**
  > "By removing the master-key vulnerability, SentinelAgent allows organizations to safely delegate high-stakes autonomy to AI. With TideCloak, trust is no longer the bottleneck."
