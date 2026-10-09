// ./netlify/functions/create-order.js

const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const PLANS = {
    core: 2999,
    plus: 4499,
    elite: 6999
  };

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  try {

    const body = JSON.parse(event.body);

    const plan = body.plan;
    const coupon = body.coupon?.toUpperCase();

    const name = body.name;
    const email = body.email;
    const mobile = body.mobile;

    const basePrice = PLANS[plan];

    if (!basePrice) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid plan" })
      };
    }

    // ===============================
    // 💰 CALCULATIONS
    // ===============================
    const gst = basePrice * 0;
    const platformFee = basePrice * 0.020;

    let subtotal = basePrice + gst + platformFee;

    // ===============================
    // 🎟️ FETCH COUPON FROM DB
    // ===============================
    let couponData = null;

    if (coupon) {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("coupon_code", coupon)
        .eq("is_active", true)
        .single();

      if (!error && data) {
        couponData = data;
      }
    }

    const discountPercent = couponData?.discount_percent || 0;
    const commissionPercent = couponData?.commission_percent || 0;

    const discount = (subtotal * discountPercent) / 100;
    const finalAmountRupees = subtotal - discount;

    const commissionAmount = (finalAmountRupees * commissionPercent) / 100;

    // Razorpay needs paise
    const finalAmount = Math.round(finalAmountRupees * 100);

    // ===============================
    // 🔥 CREATE RAZORPAY ORDER
    // ===============================
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: "INR",
      receipt: "order_" + Date.now()
    });

    // ===============================
    // 💾 INSERT INTO SUPABASE
    // ===============================
    const { error: insertError } = await supabase
      .from("payment_logs")
      .insert([
        {
          order_id: order.id,
          user_email: email,
          user_phone: mobile,
          plan_name: plan,

          original_amount: basePrice,
          discount_amount: discount,
          final_amount: finalAmountRupees,

          coupon_code: coupon || null,
          coupon_id: couponData?.id || null,
          influencer_id: couponData?.user_id || null,

          commission_amount: commissionAmount,

          status: "created"
        }
      ]);

    if (insertError) {
      console.error("SUPABASE INSERT ERROR:", insertError);
    }

    // ===============================
    // ✅ RESPONSE
    // ===============================
    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: finalAmount
      })
    };

  } catch (err) {

    console.error("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};