// ./netlify/functions/verify-payment.js

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;

    // ===============================
    // 🔐 VERIFY SIGNATURE
    // ===============================
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Invalid payment signature"
        })
      };
    }

    // ===============================
    // 📥 GET PAYMENT RECORD
    // ===============================
    const { data: paymentData, error: fetchError } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("order_id", razorpay_order_id)
      .single();

    if (fetchError || !paymentData) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Order not found"
        })
      };
    }

    // ===============================
    // ✅ UPDATE PAYMENT STATUS
    // ===============================
    await supabase
      .from("payment_logs")
      .update({
        payment_id: razorpay_payment_id,
        status: "paid"
      })
      .eq("order_id", razorpay_order_id);

    // ===============================
    // 💰 UPDATE INFLUENCER EARNINGS
    // ===============================
    if (paymentData.influencer_id) {

      await supabase.rpc("increment_earnings", {
        user_id_input: paymentData.influencer_id,
        amount_input: paymentData.commission_amount
      });

    }

    // ===============================
    // 🎟️ INCREMENT COUPON USAGE
    // ===============================
    if (paymentData.coupon_id) {

      await supabase.rpc("increment_coupon_usage", {
        coupon_id_input: paymentData.coupon_id
      });

    }

    // ===============================
    // ✅ SUCCESS RESPONSE
    // ===============================
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (err) {

    console.error("VERIFY ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};