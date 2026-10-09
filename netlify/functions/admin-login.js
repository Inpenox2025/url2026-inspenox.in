const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { email } = JSON.parse(event.body);

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("role", "admin")
    .single();

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};