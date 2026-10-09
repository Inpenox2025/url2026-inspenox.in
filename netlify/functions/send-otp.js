const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {

  const { email } = JSON.parse(event.body);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ SAVE OTP IN DB
  await supabase.from("otp_store").insert([
    { email, otp }
  ]);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "inspenox@gmail.com",
      pass: process.env.GMAIL_APP_PASS
    }
  });

  await transporter.sendMail({
    to: email,
    subject: "Your OTP",
    html: `<h2>Your OTP: ${otp}</h2>`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};