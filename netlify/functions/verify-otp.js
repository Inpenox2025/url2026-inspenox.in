const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  try {

    const { email, otp } = JSON.parse(event.body);

    const { data, error } = await supabase
      .from("otp_store")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    if (data && data.length > 0) {

      // ✅ DELETE OTP AFTER SUCCESS
      await supabase
        .from("otp_store")
        .delete()
        .eq("email", email);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: false })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};