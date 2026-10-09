// get-influencer-details.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { id } = JSON.parse(event.body);

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};