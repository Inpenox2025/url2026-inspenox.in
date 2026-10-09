// register-user.js
exports.handler = async (event) => {

  const data = JSON.parse(event.body);

  try {

    const res = await fetch("https://lms.inspenox.in/api/auth/register.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer INSPENOX_SECURE_123"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to register user" })
    };
  }
};
