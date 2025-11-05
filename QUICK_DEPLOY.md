# ⚡ Deploy Backend lên Render - Hướng dẫn nhanh

## 🚀 3 Bước đơn giản

### Bước 1: Push code lên GitHub

```bash
# Nếu chưa có git repo, khởi tạo:
cd server
git init
git add .
git commit -m "Ready for Render deployment"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy trên Render

1. Truy cập **https://render.com** và đăng nhập bằng GitHub
2. Click **New +** > **Web Service**
3. Chọn repository vừa push
4. Điền thông tin:
   - **Name:** `payment-gateway` (hoặc tên bạn thích)
   - **Root Directory:** `server` (nếu server nằm trong subfolder, để trống nếu server là root)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Thêm **Environment Variables** (click "Add Environment Variable"):
   ```
   STRIPE_SECRET_KEY = sk_test_YOUR_STRIPE_SECRET_KEY_HERE
   STRIPE_PUBLISHABLE_KEY = pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
   ```
   
   _(Lấy keys từ file `.env` local của bạn hoặc từ Stripe Dashboard)_

6. Click **Create Web Service**

### Bước 3: Cấu hình VNPAY URLs

Sau khi deploy xong, Render sẽ cho bạn URL dạng: `https://payment-gateway-xxxx.onrender.com`

Quay lại **Environment** tab và thêm/update:

```
VNP_RETURN_URL = https://payment-gateway-xxxx.onrender.com/vnpay/return
VNP_IPN_URL = https://payment-gateway-xxxx.onrender.com/vnpay/ipn
```

_(Thay `payment-gateway-xxxx` bằng URL thực tế của bạn)_

Click **Save Changes** - server sẽ tự động redeploy.

## ✅ Kiểm tra

Mở browser, truy cập: `https://payment-gateway-xxxx.onrender.com`

Bạn sẽ thấy: `Payment Gateway Server - Stripe & VNPAY`

## 🔄 Cập nhật Client App

Mở file `client-app/.env` và thay đổi:

```env
EXPO_PUBLIC_BACKEND_URL=https://payment-gateway-xxxx.onrender.com
```

Restart Expo:
```bash
cd client-app
npx expo start --clear
```

## 🎉 Xong!

Giờ bạn có thể test payment trên điện thoại thật mà không cần localhost!

---

### ⚠️ Lưu ý Free Tier:
- Server sẽ "ngủ" sau 15 phút không dùng
- Request đầu tiên sẽ chậm 30-60s (đang đánh thức server)
- Các request sau sẽ nhanh bình thường

### 🆙 Nâng cấp (Optional):
Nếu không muốn server ngủ, nâng lên **Starter Plan** ($7/tháng)

