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
        const body = await request.json().catch(() => ({}));
        const coupon = body.coupon ? String(body.coupon).trim().toUpperCase() : null;

        if (!coupon) {
            return new Response(JSON.stringify({ valid: false }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const supabaseUrl = env.SUPABASE_URL || process?.env?.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process?.env?.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: "Supabase configuration missing on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("coupon_code", coupon)
            .eq("is_active", true)
            .single();

        if (error || !data) {
            return new Response(JSON.stringify({ valid: false }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            return new Response(JSON.stringify({ valid: false, message: "Coupon expired" }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        if (data.usage_limit && data.used_count >= data.usage_limit) {
            return new Response(JSON.stringify({ valid: false, message: "Coupon usage limit reached" }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            valid: true,
            discount: data.discount_percent,
            coupon_id: data.id,
            influencer_id: data.user_id
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

    } catch (err) {
        console.error("APPLY COUPON ERROR:", err);
        return new Response(JSON.stringify({ valid: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
}
