const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_influencer", true);

  if (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};