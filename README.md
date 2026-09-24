# Kế hoạch giảng dạy Tiếng Anh (React)

Ứng dụng lập kế hoạch giảng dạy theo tuần cho môn Tiếng Anh lớp 1, 2, 3
(Global Success 1, Global Success 2, Wonderful World 3), xuất ra Word (.docx) và Excel (.xlsx).

## Yêu cầu
- Node.js 18 trở lên

## Chạy thử
```bash
npm install
npm run dev
```
Mở địa chỉ hiện ra trong terminal (thường là http://localhost:5173).

## Đóng gói để đưa lên mạng
```bash
npm run build
```
Thư mục `dist/` là trang web hoàn chỉnh, có thể đưa lên Netlify, Vercel, GitHub Pages hoặc bất kỳ máy chủ web nào.

## Cấu trúc
- `src/data/ppct.js` — phân phối chương trình 3 khối (sửa tên bài, mã NLS tại đây)
- `src/data/defaultState.js` — thông tin trường, danh sách lớp, thời khóa biểu mặc định
- `src/utils/plan.js` — cách tính tiết PPCT cho từng lớp trong tuần
- `src/utils/exportWord.js`, `src/utils/exportExcel.js` — xuất file
- `src/components/` — các màn hình

Dữ liệu cô nhập được lưu trong trình duyệt (localStorage) nên chỉ có trên máy và trình duyệt đang dùng.
