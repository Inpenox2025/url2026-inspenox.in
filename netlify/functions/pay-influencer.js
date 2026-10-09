const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { userId, amount } = JSON.parse(event.body);

  await supabase.rpc("mark_payout", {
    user_id_input: userId,
    amount_input: amount
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};