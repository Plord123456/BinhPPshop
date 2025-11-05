# Backend Setup Instructions

## Quick Setup

Your backend is already configured! You just need to create a `.env` file.

### Step 1: Create `.env` file

In the `BinhPPshop` folder, create a file named `.env` with the following content:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# VNPAY Configuration (Sandbox)
VNP_TMN_CODE=GDC9APG1
VNP_HASH_SECRET=33J1TXJT0YZA3IHAJKGKSAHJMEXJNXHP
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8000/vnpay/return
VNP_IPN_URL=http://localhost:8000/vnpay/ipn

# Server Configuration
PORT=8000
```

### Step 2: Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Replace the values in your `.env` file

### Step 3: Install Dependencies

```bash
cd BinhPPshop
npm install
```

### Step 4: Run the Server

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on http://localhost:8000

## API Endpoints

### Stripe Payment
- `POST /create-payment-intent` - Create Stripe payment intent
- `POST /update-payment-status` - Update order payment status

### VNPAY Payment
- `POST /vnpay/create-payment-url` - Create VNPAY payment URL
- `GET /vnpay/return` - Handle payment return from VNPAY
- `GET /vnpay/ipn` - Handle instant payment notification from VNPAY
- `GET /vnpay/banks` - Get list of supported banks
- `POST /vnpay/query-transaction` - Query transaction status

## Testing VNPAY (Sandbox)

### Test Credit Card
- Card Number: `9704198526191432198`
- Card Holder: `NGUYEN VAN A`
- Expiry Date: `07/15`
- OTP: `123456`

### Test Bank Accounts
You can use any of these test accounts provided by VNPAY sandbox:
- Bank: NCB (Ngân hàng NCB)
- Account: `9704198526191432198`
- Password: `123456`
- OTP: `123456`

## Production Deployment

### Update `.env` for Production

When deploying to Render or any production environment:

```env
# Use production Stripe keys
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key

# Update VNPAY URLs to your production domain
VNP_RETURN_URL=https://binhppshop.onrender.com/vnpay/return
VNP_IPN_URL=https://binhppshop.onrender.com/vnpay/ipn

# For production VNPAY, you need to register at:
# https://vnpay.vn/dang-ky-merchant
# And use your actual credentials
VNP_TMN_CODE=your_production_tmn_code
VNP_HASH_SECRET=your_production_hash_secret
VNP_URL=https://www.vnpay.vn/paymentv2/vpcpay.html
```

### Render Deployment

Your backend is already configured for Render with the `render.yaml` file. 

1. Push your code to GitHub
2. Go to https://render.com
3. Create a new Web Service
4. Connect your GitHub repository
5. Add environment variables in Render dashboard (same as .env file)
6. Deploy!

## Troubleshooting

### Server won't start
- Make sure you have Node.js installed (v18 or higher recommended)
- Check if port 8000 is already in use
- Verify all environment variables are set in `.env`

### VNPAY payment fails
- Check if the sandbox credentials are correct
- Verify the return URL and IPN URL are accessible
- Check server logs for detailed error messages

### Stripe payment fails
- Verify your Stripe keys are correct
- Make sure you're using test keys for development
- Check Stripe dashboard for payment logs

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to Git
- Keep your Stripe secret key confidential
- Use test/sandbox keys for development
- Use production keys only in production environment
- The `.gitignore` file should include `.env`

## Support

For issues related to:
- **VNPAY**: https://sandbox.vnpayment.vn/apis/docs
- **Stripe**: https://stripe.com/docs
- **Express.js**: https://expressjs.com/

---

Your backend is ready! Just create the `.env` file with your Stripe keys and you're good to go! 🚀

