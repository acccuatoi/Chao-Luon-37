# Demo Video Directory

Thư mục này được sử dụng để lưu trữ video demo 2 phút của dự án theo yêu cầu của Hackathon UNLOCKED.

## 📌 Yêu cầu kỹ thuật từ ban tổ chức:
1. **Định dạng file**: `.mp4`
2. **Kích thước file**: **Dưới 100 MB** (để có thể commit và push trực tiếp lên GitHub không bị lỗi file size limit).
3. **Thời lượng**: Khoảng 2 phút.
4. **Tên file đề xuất**: `demo.mp4` hoặc `Chao-Luon-37-demo.mp4`.

## 💡 Mẹo nén video:
Nếu file video sau khi quay lớn hơn 100MB, bạn có thể nén bằng:
- Công cụ miễn phí HandBrake (chọn preset Web 1080p30 hoặc 720p30).
- Hoặc dùng lệnh ffmpeg:
  ```bash
  ffmpeg -i raw_video.mp4 -vcodec libx264 -crf 24 -preset fast -acodec aac -b:a 128k demo.mp4
  ```

Kịch bản quay video chi tiết xem tại: [`video_script_template.md`](file:///C:/Users/Admin/.gemini/antigravity-ide/scratch/Chao-Luon-37/submission/demo_video/video_script_template.md)
