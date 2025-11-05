# 🚀 VNPAY Production Configuration Guide

## 📋 Checklist trước khi lên Production

### 1. Đăng ký VNPAY Production Account

1. Truy cập: https://vnpay.vn/dang-ky/
2. Điền form đăng ký doanh nghiệp
3. Chuẩn bị giấy tờ:
   - Giấy phép kinh doanh
   - CMND/CCCD người đại diện
   - Mẫu chữ ký
   - Thông tin tài khoản ngân hàng

4. Chờ VNPAY duyệt (2-5 ngày làm việc)
5. Nhận credentials production:
   - `vnp_TmnCode` (mã merchant)
   - `vnp_HashSecret` (secret key)

### 2. Update Environment Variables

#### Production .env
```env
# VNPAY Production Configuration
VNP_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNP_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNP_URL=https://vnpayment.vn/paymentv2/vpcpay.html

# Production URLs (replace with your domain)
VNP_RETURN_URL=https://yourdomain.com/vnpay/return
VNP_IPN_URL=https://yourdomain.com/vnpay/ipn

# Server
PORT=8000
NODE_ENV=production
```

### 3. Deploy Backend Server

#### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set VNP_TMN_CODE=xxx
railway variables set VNP_HASH_SECRET=xxx
railway variables set VNP_URL=https://vnpayment.vn/paymentv2/vpcpay.html
railway variables set VNP_RETURN_URL=https://your-app.railway.app/vnpay/return
railway variables set VNP_IPN_URL=https://your-app.railway.app/vnpay/ipn

# Deploy
railway up
```

#### Option 2: Render
```bash
# 1. Push code to GitHub
git add .
git commit -m "Add VNPAY integration"
git push

# 2. Go to https://render.com
# 3. New → Web Service
# 4. Connect GitHub repo
# 5. Add environment variables
# 6. Deploy
```

#### Option 3: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set VNP_TMN_CODE=xxx
heroku config:set VNP_HASH_SECRET=xxx
heroku config:set VNP_URL=https://vnpayment.vn/paymentv2/vpcpay.html
heroku config:set VNP_RETURN_URL=https://your-app.herokuapp.com/vnpay/return
heroku config:set VNP_IPN_URL=https://your-app.herokuapp.com/vnpay/ipn

# Deploy
git push heroku main
```

### 4. Cấu hình IPN URL trong VNPAY Portal

1. Login vào VNPAY Merchant Portal: https://merchant.vnpay.vn/
2. Vào **Cấu hình** → **Cấu hình IPN**
3. Nhập IPN URL: `https://yourdomain.com/vnpay/ipn`
4. Chọn **HTTP Method**: GET
5. Lưu cấu hình

### 5. Update Frontend Config

#### Production .env (client-app)
```env
EXPO_PUBLIC_BACKEND_URL=https://yourdomain.com
```

#### Build Production App

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Both
eas build --platform all
```

### 6. Test Production Environment

#### Test Checklist
- [ ] Create payment URL works
- [ ] Banks list loads
- [ ] WebView opens VNPAY page
- [ ] Can complete payment with real card
- [ ] Return URL receives callback
- [ ] IPN URL receives notification
- [ ] Database transaction created
- [ ] Order status updated
- [ ] User redirected correctly

#### Test với thẻ thật (nhỏ lẻ)
```
Số tiền test: 10,000 VND
Sử dụng thẻ ATM thật
Kiểm tra end-to-end flow
```

### 7. Monitoring & Logging

#### Setup Logging
```javascript
// server/index.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log VNPAY transactions
app.use('/vnpay', (req, res, next) => {
  logger.info('VNPAY Request', {
    path: req.path,
    query: req.query,
    body: req.body,
  });
  next();
});
```

#### Setup Monitoring
- **Sentry**: https://sentry.io (error tracking)
- **LogRocket**: https://logrocket.com (session replay)
- **Datadog**: https://datadoghq.com (APM)

### 8. Security Enhancements

#### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/vnpay', limiter);
```

#### CORS Configuration
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

#### HTTPS Only
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 9. Database Production

#### Supabase Production
1. Chuyển từ Free tier sang Pro (nếu cần)
2. Backup database:
```bash
# Daily automated backups
# Point-in-time recovery
```

3. Run migration:
```sql
-- Chạy file create_vnpay_transactions.sql trên production DB
```

4. Setup monitoring:
```sql
-- Query slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

### 10. Update VNPAY Webhook

#### Backend IPN Handler Enhancement
```javascript
router.get("/vnpay/ipn", async (req, res) => {
  try {
    const verification = verifyIpnCall(req.query);
    
    if (!verification.isValidSignature) {
      logger.error('Invalid VNPAY signature', req.query);
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    // Save to database
    const { data, error } = await supabase
      .from('vnpay_transactions')
      .insert({
        order_id: verification.orderId,
        user_id: req.query.user_id, // Pass from payment creation
        vnp_txn_ref: verification.txnRef,
        vnp_transaction_no: verification.transactionNo,
        vnp_response_code: verification.rspCode,
        amount: verification.amount,
        currency: 'VND',
        bank_code: verification.bankCode,
        card_type: verification.cardType,
        status: verification.rspCode === '00' ? 'success' : 'failed',
        order_info: verification.orderInfo,
        pay_date: verification.payDate,
        raw_response: req.query,
      });

    if (error) {
      logger.error('Database insert error', error);
      return res.status(200).json({ RspCode: "99", Message: "Database error" });
    }

    // Update order status in orders table
    // await updateOrderStatus(verification.orderId, 'paid');

    logger.info('VNPAY payment successful', { orderId: verification.orderId });
    return res.status(200).json({ RspCode: "00", Message: "Success" });
    
  } catch (error) {
    logger.error('IPN Handler Error', error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
});
```

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use different secrets for dev/prod
- ✅ Rotate secrets regularly
- ✅ Use secret management (AWS Secrets Manager, etc.)

### 2. HTTPS
- ✅ Use SSL certificate (Let's Encrypt)
- ✅ Redirect HTTP to HTTPS
- ✅ HSTS headers
- ✅ Secure cookies

### 3. Input Validation
- ✅ Validate all input parameters
- ✅ Sanitize user input
- ✅ Check amount ranges
- ✅ Verify order exists

### 4. Database
- ✅ Use parameterized queries
- ✅ Enable RLS
- ✅ Regular backups
- ✅ Audit logs

## 📊 Monitoring Metrics

### Key Metrics to Track
1. **Transaction Success Rate**
   - Target: >95%
   - Alert if <90%

2. **Average Response Time**
   - Create payment: <500ms
   - IPN processing: <200ms

3. **Error Rate**
   - Target: <1%
   - Alert if >5%

4. **Payment Methods**
   - VNPAY vs Stripe ratio
   - Popular banks
   - Device types

## 🚨 Incident Response

### If Payment Fails
1. Check server logs
2. Verify VNPAY portal status
3. Check database connection
4. Review recent code changes
5. Contact VNPAY support if needed

### VNPAY Support
- **Hotline:** 1900 55 55 77
- **Email:** support@vnpay.vn
- **Portal:** https://merchant.vnpay.vn/support

## 📈 Performance Optimization

### Caching
```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 });

router.get('/vnpay/banks', (req, res) => {
  const cached = cache.get('banks');
  if (cached) return res.json({ success: true, banks: cached });
  
  // ... fetch banks
  cache.set('banks', banks);
  res.json({ success: true, banks });
});
```

### Database Indexes
```sql
-- Already created in migration
CREATE INDEX idx_vnpay_order_id ON vnpay_transactions(order_id);
CREATE INDEX idx_vnpay_created_at ON vnpay_transactions(created_at DESC);
```

### CDN for Static Assets
- Use Cloudflare or AWS CloudFront
- Cache bank logos/images
- Reduce server load

## 🎯 Production Checklist

- [ ] VNPAY production account approved
- [ ] Production credentials received
- [ ] Backend deployed to server
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] IPN URL configured in VNPAY portal
- [ ] Return URL configured
- [ ] Frontend app built & deployed
- [ ] Database migration run
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Error tracking enabled
- [ ] Test with real payment (small amount)
- [ ] Verify IPN callback works
- [ ] Check database transaction logged
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Documentation updated
- [ ] Team trained

## 🎉 Go Live!

Once all checklist items are complete, you're ready to accept real payments!

**Good luck! 🚀**

