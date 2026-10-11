const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = body;

        const razorpaySecret = env.RAZORPAY_KEY_SECRET || process?.env?.RAZORPAY_KEY_SECRET;
        const supabaseUrl = env.SUPABASE_URL || process?.env?.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process?.env?.SUPABASE_SERVICE_ROLE_KEY;

        if (!razorpaySecret) {
            return new Response(JSON.stringify({ success: false, error: "Razorpay secret missing on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // 🔐 Verify signature
        const generated_signature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return new Response(JSON.stringify({
                success: false,
                message: "Invalid payment signature"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 📥 Get payment record
        const { data: paymentData, error: fetchError } = await supabase
            .from("payment_logs")
            .select("*")
            .eq("order_id", razorpay_order_id)
            .single();

        if (fetchError || !paymentData) {
            return new Response(JSON.stringify({
                success: false,
                message: "Order not found"
            }), {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // ✅ Update payment status
        await supabase
            .from("payment_logs")
            .update({
                payment_id: razorpay_payment_id,
                status: "paid"
            })
            .eq("order_id", razorpay_order_id);

        // 💰 Update influencer earnings
        if (paymentData.influencer_id) {
            await supabase.rpc("increment_earnings", {
                user_id_input: paymentData.influencer_id,
                amount_input: paymentData.commission_amount
            });
        }

        // 🎟️ Increment coupon usage
        if (paymentData.coupon_id) {
            await supabase.rpc("increment_coupon_usage", {
                coupon_id_input: paymentData.coupon_id
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

    } catch (err) {
        console.error("VERIFY PAYMENT ERROR:", err);
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
}
