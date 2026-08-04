/**
 * Cloudflare Pages Function: /api/checkout
 * HitPay REST API Handler for Payment Wall
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Enable CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { amount, currency = "MYR", customer_name, email, payment_option, discount_code, reference_number } = body;

    // Validate mandatory parameters
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing payment amount." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!email || !customer_name) {
      return new Response(
        JSON.stringify({ error: "Customer name and email are required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Environmental configuration
    const apiKey = env.HITPAY_API_KEY;
    const isSandbox = env.HITPAY_MODE === "sandbox" || !env.HITPAY_MODE || env.HITPAY_MODE !== "production";
    const hitpayApiUrl = isSandbox
      ? "https://api.sandbox.hit-pay.com/v1/payment-requests"
      : "https://api.hit-pay.com/v1/payment-requests";

    // Determine redirect logic
    const origin = new URL(request.url).origin;
    const redirectUrl = `${origin}/success.html?ref=${encodeURIComponent(reference_number || "INV-" + Date.now())}`;

    // Prepare HitPay request payload
    // Reference: https://hit-pay.com/docs/api
    const hitpayPayload = new URLSearchParams();
    hitpayPayload.append("amount", parseFloat(amount).toFixed(2));
    hitpayPayload.append("currency", currency.toUpperCase());
    hitpayPayload.append("name", customer_name);
    hitpayPayload.append("email", email);
    hitpayPayload.append("redirect_url", redirectUrl);
    hitpayPayload.append("reference_number", reference_number || `INV-${Date.now()}`);

    // Standard HitPay payment method mapping for MYR rails
    if (payment_option) {
      const allowedMethods = [];
      if (payment_option === "duitnow") allowedMethods.push("duitnow_online", "paynow");
      else if (payment_option === "fpx") allowedMethods.push("fpx");
      else if (payment_option === "card") allowedMethods.push("card");

      if (allowedMethods.length > 0) {
        allowedMethods.forEach(method => hitpayPayload.append("payment_methods[]", method));
      }
    }

    // Send request to HitPay API if API key exists, otherwise provide dev mock mode
    if (!apiKey) {
      console.warn("HITPAY_API_KEY variable is missing. Operating in Mock Mode.");
      
      // Simulate successful checkout response for testing without API keys
      return new Response(
        JSON.stringify({
          success: true,
          mock: true,
          url: `${redirectUrl}&mock=true&amount=${parseFloat(amount).toFixed(2)}&channel=${payment_option || "all"}`,
          status: "pending",
          message: "Mock Checkout Generated (Set HITPAY_API_KEY environment variable in Cloudflare Pages to use live HitPay API)"
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const hitpayResponse = await fetch(hitpayApiUrl, {
      method: "POST",
      headers: {
        "X-BUSINESS-API-KEY": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: hitpayPayload.toString()
    });

    const responseData = await hitpayResponse.json();

    if (!hitpayResponse.ok) {
      return new Response(
        JSON.stringify({
          error: responseData.message || responseData.error || "Failed to create payment request with HitPay.",
          details: responseData
        }),
        { status: hitpayResponse.status, headers: corsHeaders }
      );
    }

    // Return HitPay payment URL
    return new Response(
      JSON.stringify({
        success: true,
        url: responseData.url,
        id: responseData.id,
        status: responseData.status
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error occurred." }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS pre-flight for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}
