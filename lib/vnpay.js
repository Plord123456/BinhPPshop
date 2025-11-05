import crypto from "crypto";
import querystring from "querystring";

/**
 * VNPAY Configuration
 * These values should be stored in .env file for security
 */
export const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || "GDC9APG1",
  vnp_HashSecret: process.env.VNP_HASH_SECRET || "33J1TXJT0YZA3IHAJKGKSAHJMEXJNXHP",
  vnp_Url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || "http://localhost:8000/vnpay/return",
  vnp_IpnUrl: process.env.VNP_IPN_URL || "http://localhost:8000/vnpay/ipn",
};

/**
 * Sort object by key alphabetically
 * @param {Object} obj
 * @returns {Object}
 */
export function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(key);
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = obj[str[key]];
  }
  return sorted;
}

/**
 * Create VNPAY payment URL
 * @param {Object} params - Payment parameters
 * @returns {string} - Payment URL
 */
export function createPaymentUrl(params) {
  const {
    orderId,
    amount,
    orderDescription,
    orderType = "other",
    locale = "vn",
    ipAddr,
    bankCode = "",
  } = params;

  console.log("🔧 Creating payment URL with params:", {
    orderId,
    amount: `${amount} VND`,
    amountX100: amount * 100,
    orderDescription,
    orderType,
    locale,
    ipAddr,
    bankCode,
  });

  // Create date in format: yyyyMMddHHmmss
  const date = new Date();
  const createDate =
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  // Prepare VNPAY parameters
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderDescription,
    vnp_OrderType: orderType,
    vnp_Amount: amount * 100, // VNPAY requires amount in VND * 100
    vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  console.log("📦 VNPAY params before sorting:", vnp_Params);

  // Sort params and create query string
  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  console.log("🔐 Sign data:", signData);

  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  console.log("✍️ Signature:", signed);

  const paymentUrl =
    vnpayConfig.vnp_Url + "?" + querystring.stringify(vnp_Params, { encode: false });

  return paymentUrl;
}

/**
 * Verify return URL from VNPAY
 * @param {Object} vnpParams - Parameters from VNPAY
 * @returns {boolean} - true if signature is valid
 */
export function verifyReturnUrl(vnpParams) {
  const secureHash = vnpParams["vnp_SecureHash"];

  delete vnpParams["vnp_SecureHash"];
  delete vnpParams["vnp_SecureHashType"];

  const sortedParams = sortObject(vnpParams);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

/**
 * Verify IPN (Instant Payment Notification) from VNPAY
 * @param {Object} vnpParams - Parameters from VNPAY IPN
 * @returns {Object} - Verification result
 */
export function verifyIpnCall(vnpParams) {
  const secureHash = vnpParams["vnp_SecureHash"];
  const orderId = vnpParams["vnp_TxnRef"];
  const rspCode = vnpParams["vnp_ResponseCode"];

  delete vnpParams["vnp_SecureHash"];
  delete vnpParams["vnp_SecureHashType"];

  const sortedParams = sortObject(vnpParams);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const isValidSignature = secureHash === signed;

  return {
    isValidSignature,
    orderId,
    rspCode,
    amount: vnpParams["vnp_Amount"] / 100, // Convert back to VND
    bankCode: vnpParams["vnp_BankCode"],
    cardType: vnpParams["vnp_CardType"],
    orderInfo: vnpParams["vnp_OrderInfo"],
    payDate: vnpParams["vnp_PayDate"],
    transactionNo: vnpParams["vnp_TransactionNo"],
    txnRef: vnpParams["vnp_TxnRef"],
  };
}

/**
 * Query transaction status from VNPAY
 * @param {Object} params - Query parameters
 * @returns {Object} - Query data for VNPAY API
 */
export function createQueryData(params) {
  const { orderId, transDate, ipAddr } = params;

  const date = new Date();
  const requestDate =
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "querydr",
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Query transaction ${orderId}`,
    vnp_TransactionDate: transDate,
    vnp_CreateDate: requestDate,
    vnp_IpAddr: ipAddr,
  };

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  return vnp_Params;
}

/**
 * Get VNPAY response code description
 * @param {string} code - Response code from VNPAY
 * @returns {string} - Description
 */
export function getResponseDescription(code) {
  const responseCodes = {
    "00": "Giao dịch thành công",
    "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
    "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
    "10": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
    "11": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
    "12": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
    "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
    "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
    "51": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
    "65": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
    "75": "Ngân hàng thanh toán đang bảo trì.",
    "79": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
    "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
  };

  return responseCodes[code] || "Lỗi không xác định";
}

