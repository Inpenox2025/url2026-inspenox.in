const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");

const PLANS = {
    core: 2999,
    plus: 4499,
    elite: 6999
};

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

        const plan = body.plan;
        const coupon = body.coupon ? String(body.coupon).trim().toUpperCase() : null;

        const name = body.name;
        const email = body.email;
        const mobile = body.mobile;

        const basePrice = PLANS[plan];

        if (!basePrice) {
            return new Response(JSON.stringify({ error: "Invalid plan" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const supabaseUrl = env.SUPABASE_URL || process?.env?.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process?.env?.SUPABASE_SERVICE_ROLE_KEY;
        const razorpayKeyId = env.RAZORPAY_KEY_ID || process?.env?.RAZORPAY_KEY_ID;
        const razorpayKeySecret = env.RAZORPAY_KEY_SECRET || process?.env?.RAZORPAY_KEY_SECRET;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase credentials in Cloudflare environment bindings");
            return new Response(JSON.stringify({ error: "Supabase configuration missing on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.error("Missing Razorpay credentials in Cloudflare environment bindings");
            return new Response(JSON.stringify({ error: "Razorpay configuration missing on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
        });

        // 💰 Calculations
        const gst = basePrice * 0;
        const platformFee = basePrice * 0.020;
        const subtotal = basePrice + gst + platformFee;

        // 🎟️ Fetch coupon from DB if provided
        let couponData = null;
        if (coupon) {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("coupon_code", coupon)
                .eq("is_active", true)
                .single();

            if (!error && data) {
                couponData = data;
            }
        }

        const discountPercent = couponData?.discount_percent || 0;
        const commissionPercent = couponData?.commission_percent || 0;

        const discount = (subtotal * discountPercent) / 100;
        const finalAmountRupees = subtotal - discount;
        const commissionAmount = (finalAmountRupees * commissionPercent) / 100;

        // Razorpay expects amount in paise
        const finalAmount = Math.round(finalAmountRupees * 100);

        // 🔥 Create Razorpay order
        const order = await razorpay.orders.create({
            amount: finalAmount,
            currency: "INR",
            receipt: "order_" + Date.now()
        });

        // 💾 Insert into Supabase
        const { error: insertError } = await supabase
            .from("payment_logs")
            .insert([
                {
                    order_id: order.id,
                    user_email: email,
                    user_phone: mobile,
                    plan_name: plan,
                    original_amount: basePrice,
                    discount_amount: discount,
                    final_amount: finalAmountRupees,
                    coupon_code: coupon || null,
                    coupon_id: couponData?.id || null,
                    influencer_id: couponData?.user_id || null,
                    commission_amount: commissionAmount,
                    status: "created"
                }
            ]);

        if (insertError) {
            console.error("SUPABASE INSERT ERROR:", insertError);
        }

        return new Response(JSON.stringify({
            order_id: order.id,
            amount: finalAmount
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

    } catch (err) {
        console.error("CREATE ORDER ERROR:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
}
