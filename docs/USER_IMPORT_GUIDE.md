# Hướng dẫn Import User vào hệ thống

## Vấn đề đã được khắc phục

✅ **Đã sửa lỗi "username violates not-null constraint"**
✅ **Đã sửa lỗi "Role cannot be empty"** 
✅ **Đã cập nhật cấu trúc Excel template**

## File Excel mẫu

**Tên file:** `user-import-template-v2.xlsx`

## Cấu trúc các cột (theo thứ tự)

| STT | Tên cột | Mô tả | Bắt buộc | Ví dụ |
|-----|---------|-------|-----------|-------|
| 1 | **Name** | Tên đầy đủ của user | ✅ | Nguyễn Văn A |
| 2 | **Username** | Tên đăng nhập | ❌ | nguyenvana |
| 3 | **Email** | Email (phải unique) | ✅ | nguyenvana@example.com |
| 4 | **Phone** | Số điện thoại (định dạng VN) | ✅ | 0123456789 |
| 5 | **Role** | Vai trò trong hệ thống | ✅ | GV, CNBM, TM |
| 6 | **DateOfBirth** | Ngày sinh (YYYY-MM-DD) | ❌ | 1990-01-01 |
| 7 | **Major** | Chuyên ngành/lĩnh vực | ❌ | Computer Science |
| 8 | **Avatar** | URL ảnh đại diện | ❌ | https://example.com/avatar.jpg |

## Các giá trị Role được hỗ trợ

| Mã | Tên tiếng Việt | Mô tả |
|----|----------------|-------|
| **TM** | Trưởng môn | Trưởng môn |
| **CNBM** | Chủ nhiệm bộ môn | Chủ nhiệm bộ môn |
| **GV** | Giảng viên | Giảng viên |

**Lưu ý:** Hệ thống cũng hỗ trợ cả tên tiếng Việt và mã viết tắt.

## Quy tắc quan trọng

### ✅ **Các cột bắt buộc:**
- **Name**: Không được để trống
- **Email**: Phải unique trong hệ thống, không được trùng
- **Phone**: Phải đúng định dạng số điện thoại VN
- **Role**: Phải là một trong các giá trị được hỗ trợ

### ❌ **Các cột tùy chọn:**
- **Username**: Nếu không có, hệ thống sẽ tự động tạo theo format `{ROLE}{SỐ_NGẪU_NHIÊN}`
- **DateOfBirth**: Định dạng YYYY-MM-DD
- **Major**: Có thể để trống
- **Avatar**: URL ảnh, có thể để trống

## Cách sử dụng

1. **Tải file mẫu:** `user-import-template-v2.xlsx`
2. **Mở bằng Excel/Google Sheets**
3. **Điền dữ liệu** theo cấu trúc đã định sẵn
4. **Lưu file** (định dạng .xlsx)
5. **Upload lên API** import user

## Ví dụ dữ liệu mẫu

File mẫu đã có sẵn 5 user với đầy đủ thông tin để tham khảo:

- **Nguyễn Văn A** - Giảng viên Computer Science
- **Trần Thị B** - Chủ nhiệm bộ môn Information Technology  
- **Lê Văn C** - Trưởng môn Software Engineering
- **Phạm Thị D** - Giảng viên Data Science
- **Hoàng Văn E** - Giảng viên Artificial Intelligence

## Xử lý lỗi

Nếu import thất bại, hệ thống sẽ trả về:
- `successCount`: Số user import thành công
- `failureCount`: Số user import thất bại  
- `errors`: Chi tiết lỗi từng dòng (số dòng, email, mô tả lỗi)

## Lưu ý kỹ thuật

- **File format**: Chỉ hỗ trợ .xlsx và .xls
- **Encoding**: UTF-8 để hiển thị đúng tiếng Việt
- **Header**: Dòng đầu tiên phải là tên cột
- **Dữ liệu**: Bắt đầu từ dòng thứ 2
- **Validation**: Hệ thống sẽ kiểm tra dữ liệu trước khi import
