// update-coupon.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const payload = JSON.parse(event.body);

  await supabase
    .from("coupons")
    .update(payload)
    .eq("id", payload.id);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};