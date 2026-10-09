// delete-coupon.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { id } = JSON.parse(event.body);

  await supabase
    .from("coupons")
    .delete()
    .eq("id", id);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};