const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  try {

    const { email } = JSON.parse(event.body);

    // ===============================
    // 👤 GET USER FULL DATA
    // ===============================
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          totalSales: 0,
          totalCommission: 0,
          paidAmount: 0,
          pendingBalance: 0,
          orders: []
        })
      };
    }

    // ===============================
    // 📦 GET ORDERS
    // ===============================
    const { data: orders = [], error: orderError } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("influencer_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (orderError) {
      console.error("ORDER FETCH ERROR:", orderError);
    }

    // ===============================
    // 📊 CALCULATIONS
    // ===============================
    const totalSales = orders.length;

    // (Optional fallback if user.total_earnings not updated)
    const calculatedCommission = orders.reduce(
      (sum, o) => sum + Number(o.commission_amount || 0),
      0
    );

    // Prefer DB values, fallback to calculated
    const totalCommission = Number(user.total_earnings || calculatedCommission);
    const paidAmount = Number(user.paid_amount || 0);
    const pendingBalance = Number(user.pending_balance || 0);

    // ===============================
    // ✅ RESPONSE
    // ===============================
    return {
      statusCode: 200,
      body: JSON.stringify({
        totalSales,
        totalCommission,
        paidAmount,
        pendingBalance,
        orders
      })
    };

  } catch (err) {

    console.error("DASHBOARD ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};