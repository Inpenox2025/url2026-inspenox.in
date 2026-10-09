// ./netlify/functions/sendmail.js
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { name, email, plan, orderId, amount, paymentId } = JSON.parse(event.body);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "inspenox@gmail.com",
      pass: process.env.GMAIL_APP_PASS
    }
  });

  try {

    // ===============================
    // 🔍 FETCH PAYMENT LOG
    // ===============================
    const { data: paymentData } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("order_id", orderId)
      .single();

    let influencerEmail = null;
    let influencerName = "Partner";

    // ===============================
    // 👤 GET INFLUENCER DETAILS
    // ===============================
    if (paymentData?.influencer_id) {

      const { data: influencer } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", paymentData.influencer_id)
        .single();

      influencerEmail = influencer?.email;
      influencerName = influencer?.name || "Partner";
    }

    // ===============================
    // 📧 USER EMAIL (CORRECT)
    // ===============================
    const userMail = {
      from: '"INJARA LMS" <inspenox@gmail.com>',
      to: email,
      subject: "Payment Successful - INJARA LMS",
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1);">
      
          <!-- HEADER -->
          <div style="background:linear-gradient(90deg,#023e8a,#0077b6); padding:20px; text-align:center;">
            <img src="https://inspenox.in/assets/images/dark11.png" alt="Inspenox" style="height:70px;">
            <h2 style="color:#ffffff; margin-top:10px;">Payment Successful 🎉</h2>
          </div>
      
          <!-- BODY -->
          <div style="padding:25px; color:#333;">
            
            <p style="font-size:16px;">Hi <b>${name}</b>,</p>
      
            <p>Your payment has been successfully processed. Below are your transaction details:</p>
      
            <!-- DETAILS BOX -->
            <div style="background:#f8f9fa; border-radius:8px; padding:15px; margin:20px 0;">
              <table width="100%" style="font-size:14px;">
                <tr>
                  <td><b>Plan</b></td>
                  <td style="text-align:right;">${plan.toUpperCase()}</td>
                </tr>
                <tr>
                  <td><b>Order ID</b></td>
                  <td style="text-align:right;">${orderId}</td>
                </tr>
                <tr>
                  <td><b>Amount Paid</b></td>
                  <td style="text-align:right;">₹${Number(amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><b>Payment ID</b></td>
                  <td style="text-align:right;">${paymentId}</td>
                </tr>
              </table>
            </div>
      
            <!-- INFO -->
            <p>🎓 Your LMS access will be activated within <b>24 hours</b>.</p>
            <p>🔒 Your LMS Login Details Are </br>
             <b>Username: </b> Email that you provided while payment.
             <b>Password: </b> Mobile Number that you provided while payment.
             
             </p>
      
            <!-- CTA -->
            <div style="text-align:center; margin:25px 0;">
              <a href="https://lms.inspenox.in/" 
                 style="background:linear-gradient(90deg,#00c6ff,#0072ff);
                        color:white;
                        padding:12px 25px;
                        border-radius:25px;
                        text-decoration:none;
                        font-weight:bold;
                        display:inline-block;">
                Access LMS
              </a>
            </div>
      
            <!-- SUPPORT -->
            <p>If your account is not activated within 24 hours, please contact support:</p>
      
            <p>
              📱 WhatsApp: <b>9491330702</b><br>
              📧 Email: info@inspenox.in
            </p>
      
            <hr style="margin:25px 0;">
      
            <!-- FOOTER -->
            <p style="font-size:12px; color:#777;">
              This is an automated receipt from <b>INJARA LMS</b> by Inspenox Pvt Ltd.<br>
              Please do not reply to this email.
            </p>
      
          </div>
        </div>
      
      </div>
      `
    };

    // ===============================
    // 📧 INFLUENCER EMAIL
    // ===============================
    let influencerMail = null;

    if (influencerEmail) {

      influencerMail = {
        from: '"INJARA LMS" <inspenox@gmail.com>',
        to: influencerEmail,
        subject: "🎉 New Sale via Your Coupon",
        html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
          
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1);">
      
            <!-- HEADER -->
            <div style="background:linear-gradient(90deg,#00c6ff,#0072ff); padding:20px; text-align:center;">
              <img src="https://inspenox.in/assets/images/dark11.png" alt="Inspenox" style="height:70px;">
              <h2 style="color:#ffffff; margin-top:10px;">New Referral Sale 🎉</h2>
            </div>
      
            <!-- BODY -->
            <div style="padding:25px; color:#333;">
              
              <p style="font-size:16px;">Hi <b>${influencerName}</b>,</p>
      
              <p>🚀 Great news! A user has successfully purchased using your coupon.</p>
      
              <!-- DETAILS BOX -->
              <div style="background:#f8f9fa; border-radius:8px; padding:15px; margin:20px 0;">
                <table width="100%" style="font-size:14px;">
                  <tr>
                    <td><b>Order ID</b></td>
                    <td style="text-align:right;">${orderId}</td>
                  </tr>
                  <tr>
                    <td><b>Plan</b></td>
                    <td style="text-align:right;">${plan.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td><b>Amount Paid</b></td>
                    <td style="text-align:right;">₹${Number(amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><b>Coupon Used</b></td>
                    <td style="text-align:right;">${paymentData.coupon_code || "N/A"}</td>
                  </tr>
                </table>
              </div>
      
              <!-- COMMISSION BOX -->
              <div style="background:linear-gradient(90deg,#00c6ff,#0072ff); color:white; border-radius:10px; padding:15px; text-align:center; margin:20px 0;">
                <p style="margin:0; font-size:14px;">💰 You Earned</p>
                <h2 style="margin:5px 0;">₹${Number(paymentData.commission_amount).toFixed(2)}</h2>
              </div>
      
              <!-- MOTIVATION -->
              <p>Keep sharing your coupon and grow your earnings 🚀</p>
      
              <!-- CTA -->
              <div style="text-align:center; margin:25px 0;">
                <a href="https://inspenox.in/influencer-login" 
                   style="background:#023e8a;
                          color:white;
                          padding:12px 25px;
                          border-radius:25px;
                          text-decoration:none;
                          font-weight:bold;
                          display:inline-block;">
                  View Dashboard
                </a>
              </div>
      
              <hr style="margin:25px 0;">
      
              <!-- FOOTER -->
              <p style="font-size:12px; color:#777;">
                This is an automated notification from <b>INJARA LMS</b>.<br>
                Track your earnings and performance through your dashboard.
              </p>
      
            </div>
          </div>
      
        </div>
        `
      };

    }

    // ===============================
    // 🚀 SEND EMAILS
    // ===============================
    await transporter.sendMail(userMail);

    if (influencerMail) {
      await transporter.sendMail(influencerMail);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {

    console.error("MAIL ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};