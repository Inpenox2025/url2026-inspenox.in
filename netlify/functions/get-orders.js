// get-orders.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {

  const { data, error } = await supabase
    .from("payment_logs")
    .select(`
      *,
      users!payment_logs_influencer_id_fkey(name, email, upi_id)
    `)
    .order("created_at", { ascending: false });

  return {
    statusCode: 200,
    body: JSON.stringify(data || [])
  };
};