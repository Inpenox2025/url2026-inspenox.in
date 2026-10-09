const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {

    const body = JSON.parse(event.body);

    // VALIDATION
    if (!body.coupon_code || !body.user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const payload = {
      coupon_code: body.coupon_code.toUpperCase(),
      discount_percent: Number(body.discount_percent) || 0,
      commission_percent: Number(body.commission_percent) || 0,
      user_id: Number(body.user_id),
      is_active: true
    };

    const { data, error } = await supabase
      .from("coupons")
      .insert([payload]);

    if (error) {
      console.error("COUPON ERROR:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: error.message,
          details: error.details
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};