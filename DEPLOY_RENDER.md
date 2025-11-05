# 🚀 Deploy Backend lên Render

## 📋 Các bước chuẩn bị

### 1️⃣ Push code lên GitHub (nếu chưa có)

```bash
cd server
git init
git add .
git commit -m "Initial commit for Render deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2️⃣ Tạo tài khoản Render

- Truy cập: https://render.com/
- Đăng ký bằng GitHub account

## 🔧 Deploy trên Render

### Cách 1: Sử dụng Dashboard

1. **Tạo Web Service mới:**
   - Vào Dashboard > **New** > **Web Service**
   - Kết nối GitHub repository của bạn
   - Chọn branch `main`
   - Root Directory: `server` (nếu server nằm trong subfolder)

2. **Cấu hình:**
   - **Name:** `payment-gateway` (hoặc tên bạn thích)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

3. **Environment Variables:**
   Thêm các biến môi trường sau:
   
   ```
   PORT=8000
   
   # Stripe (lấy từ https://dashboard.stripe.com/test/apikeys)
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
   
   # VNPAY
   VNP_TMN_CODE=GDC9APG1
   VNP_HASH_SECRET=33J1TXJT0YZA3IHAJKGKSAHJMEXJNXHP
   VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   VNP_RETURN_URL=https://YOUR_APP_URL.onrender.com/vnpay/return
   VNP_IPN_URL=https://YOUR_APP_URL.onrender.com/vnpay/ipn
   ```
   
   **Lưu ý:** Thay `YOUR_APP_URL` bằng URL Render cung cấp (ví dụ: `payment-gateway-abc123.onrender.com`)

4. **Deploy:**
   - Click **Create Web Service**
   - Đợi 3-5 phút để Render build và deploy

### Cách 2: Sử dụng render.yaml (Infrastructure as Code)

1. File `render.yaml` đã được tạo sẵn
2. Chỉ cần push code lên GitHub
3. Trên Render Dashboard > **New** > **Blueprint**
4. Chọn repo và Render sẽ tự động config theo `render.yaml`

## ✅ Kiểm tra Deploy

Sau khi deploy thành công:

1. **Test endpoint:**
   ```bash
   curl https://YOUR_APP_URL.onrender.com/
   ```
   
   Kết quả mong đợi: `Payment Gateway Server - Stripe & VNPAY`

2. **Test Stripe:**
   ```bash
   curl https://YOUR_APP_URL.onrender.com/create-payment-intent \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"amount": 100}'
   ```

3. **Test VNPAY:**
   ```bash
   curl https://YOUR_APP_URL.onrender.com/vnpay/create_payment_url \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"amount": 100000, "orderDescription": "Test", "orderType": "billpayment"}'
   ```

## 🔄 Cập nhật Client App

Sau khi có URL từ Render, cập nhật file `client-app/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=https://YOUR_APP_URL.onrender.com
```

Sau đó restart Expo:
```bash
cd client-app
npx expo start --clear
```

## ⚠️ Lưu ý quan trọng

### Free Tier của Render:
- ✅ Miễn phí hoàn toàn
- ⚠️ Server sẽ "ngủ" sau 15 phút không hoạt động
- ⚠️ Request đầu tiên sau khi server ngủ sẽ mất 30-60 giây để "đánh thức"
- 💡 Giải pháp: Nâng lên paid tier ($7/tháng) hoặc dùng cron job để ping server định kỳ

### VNPAY Return URL:
- Đảm bảo `VNP_RETURN_URL` và `VNP_IPN_URL` trỏ đúng đến URL Render của bạn
- VNPAY sandbox không yêu cầu whitelist IP
- Nếu dùng VNPAY production, cần đăng ký IP của Render với VNPAY

### CORS:
- Server đã config `cors()` nên sẽ accept request từ mọi origin
- Nếu muốn giới hạn, update `server/index.js`:
  ```javascript
  app.use(cors({
    origin: ['exp://192.168.1.100:8081', 'https://yourdomain.com']
  }));
  ```

## 🐛 Troubleshooting

### Build failed:
- Kiểm tra Node version trong `.node-version`
- Xem logs trên Render Dashboard

### Server crashed:
- Kiểm tra Environment Variables đã đầy đủ chưa
- Xem Application Logs trên Render

### VNPAY không hoạt động:
- Kiểm tra `VNP_RETURN_URL` và `VNP_IPN_URL` đã đúng chưa
- Test bằng Postman trước

## 📚 Tài liệu tham khảo

- Render Docs: https://render.com/docs/web-services
- Node.js on Render: https://render.com/docs/deploy-node-express-app
- Free Tier Limits: https://render.com/docs/free

