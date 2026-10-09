--  USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,

  role TEXT DEFAULT 'user',
  is_influencer BOOLEAN DEFAULT FALSE,

  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,

  total_earnings NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW()
);

-- COUPONS TABLE
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,

  coupon_code TEXT UNIQUE NOT NULL,

  user_id INT REFERENCES users(id) ON DELETE CASCADE,

  discount_percent NUMERIC DEFAULT 0,
  commission_percent NUMERIC DEFAULT 0,

  usage_limit INT,
  used_count INT DEFAULT 0,

  expiry_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW()
);

--  PAYMENT LOGS
CREATE TABLE payment_logs (
  id SERIAL PRIMARY KEY,

  order_id TEXT,
  payment_id TEXT,

  user_email TEXT,
  user_phone TEXT,

  plan_name TEXT,

  original_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,

  coupon_code TEXT,
  coupon_id INT REFERENCES coupons(id),
  influencer_id INT REFERENCES users(id),

  commission_amount NUMERIC,

  status TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (
  name,
  email,
  phone,
  role,
  is_influencer,
  account_holder_name,
  bank_name,
  account_number,
  ifsc_code,
  upi_id
)
VALUES (
  'Rajeev Kumar',
  'sairajeev38@gmail.com', 
  '8374640702', 
  'influencer',
  TRUE,
  'Rajeev Kumar',
  'HDFC Bank',
  '123456789012',
  'HDFC0001234',
  'rajeev@upi'
)
RETURNING id;

INSERT INTO coupons (
  coupon_code,
  user_id,
  discount_percent,
  commission_percent,
  usage_limit,
  expiry_date,
  is_active
)
VALUES (
  'RAJEEV50',
  1, -- influencer_id from above
  99.98, -- user gets 99.98% discount 
  25, -- influencer gets 25% commission 
  100,
  NOW() + INTERVAL '30 days',
  TRUE
);

CREATE OR REPLACE FUNCTION increment_earnings(
  user_id_input INT,
  amount_input NUMERIC
)
RETURNS TEXT AS $$

DECLARE
  user_exists INT;

BEGIN

  -- 🚫 Prevent negative earnings
  IF amount_input <= 0 THEN
    RETURN 'Invalid amount';
  END IF;

  -- 🔍 Check user exists
  SELECT COUNT(*) INTO user_exists
  FROM users
  WHERE id = user_id_input;

  IF user_exists = 0 THEN
    RETURN 'User not found';
  END IF;

  -- 💰 Safe update
  UPDATE users
  SET 
    total_earnings = COALESCE(total_earnings, 0) + amount_input,
    pending_balance = COALESCE(pending_balance, 0) + amount_input
  WHERE id = user_id_input;

  RETURN 'Earnings updated successfully';

END;

$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_input INT)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id_input;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE otp_store (
  id SERIAL PRIMARY KEY,
  email TEXT,
  otp TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);



CREATE OR REPLACE FUNCTION mark_payout(
  user_id_input INT,
  amount_input NUMERIC
)
RETURNS TEXT AS $$

BEGIN

  UPDATE users
  SET 
    paid_amount = COALESCE(paid_amount, 0) + amount_input,
    pending_balance = pending_balance - amount_input
  WHERE id = user_id_input;

  RETURN 'Payout updated';

END;

$$ LANGUAGE plpgsql;

ALTER TABLE payment_logs ADD COLUMN payout_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN paid_amount NUMERIC DEFAULT 0;


INSERT INTO users (
  name,
  email,
  phone,
  role,
  is_influencer,
  account_holder_name,
  bank_name,
  account_number,
  ifsc_code,
  upi_id
)
VALUES (
  'Admin User',
  'inspenox@gmail.com',
  '9553262002',
  'admin',
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
);