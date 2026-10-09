// ./netlify/functions/apply-coupon.js

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  try {

    const body = event.body ? JSON.parse(event.body) : {};
    const coupon = body.coupon?.toUpperCase();

    if (!coupon) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false })
      };
    }

    // ===============================
    // 🎟️ FETCH FROM DB
    // ===============================
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("coupon_code", coupon)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false })
      };
    }

    // ===============================
    // ⏳ CHECK EXPIRY
    // ===============================
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          message: "Coupon expired"
        })
      };
    }

    // ===============================
    // 🔢 CHECK USAGE LIMIT
    // ===============================
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          message: "Coupon usage limit reached"
        })
      };
    }

    // ===============================
    // ✅ VALID COUPON
    // ===============================
    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        discount: data.discount_percent,
        coupon_id: data.id,
        influencer_id: data.user_id
      })
    };

  } catch (err) {

    console.error("COUPON ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        message: err.message
      })
    };
  }
};