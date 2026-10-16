
const express = require("express");

const router = express.Router();

console.log("JANOLUXBAG MPESA ROUTE LOADED - VERSION 3");

const SANDBOX_URL = "https://sandbox.safaricom.co.ke";

function getTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return (
    values.year +
    values.month +
    values.day +
    values.hour +
    values.minute +
    values.second
  );
}

function normalizePhone(phone) {
  let value = String(phone || "").replace(/[\s-]/g, "");

  if (value.startsWith("+254")) {
    value = value.slice(1);
  } else if (value.startsWith("0")) {
    value = "254" + value.slice(1);
  }

  if (!/^254[17]\d{8}$/.test(value)) {
    throw new Error(
      "Enter a valid Kenyan M-Pesa number, e.g. 0712345678."
    );
  }

  return value;
}

async function getAccessToken() {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;

  if (
    !key ||
    !secret ||
    key === "YOUR_CONSUMER_KEY" ||
    secret === "YOUR_CONSUMER_SECRET"
  ) {
    throw new Error(
      "Enter your actual Daraja Sandbox Consumer Key and Consumer Secret in .env."
    );
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const response = await fetch(
    `${SANDBOX_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Daraja token response was empty or invalid JSON (HTTP ${response.status}).`
    );
  }

  if (!response.ok || !data.access_token) {
    console.error("Daraja token request failed:", {
      status: response.status,
      error: data.error,
      description: data.error_description,
    });

    throw new Error(
      "Daraja Sandbox authentication failed. Check your Consumer Key and Consumer Secret."
    );
  }

  console.log("Daraja Sandbox access token obtained successfully.");

  return data.access_token;
}

router.post("/stkpush", async (req, res) => {
  try {
    const { phone, amount } = req.body;

    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;
    const callbackUrl = process.env.DARAJA_CALLBACK_URL;

    if (!shortcode || !passkey || !callbackUrl) {
      return res.status(500).json({
        success: false,
        message: "Missing shortcode, passkey, or callback URL in .env.",
      });
    }

    if (
      !Number.isInteger(Number(amount)) ||
      Number(amount) < 1 ||
      Number(amount) > 250000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid whole-number test amount.",
      });
    }

    let parsedCallbackUrl;

    try {
      parsedCallbackUrl = new URL(callbackUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "The callback URL is not a valid URL.",
      });
    }

    if (
      parsedCallbackUrl.protocol !== "https:" ||
      parsedCallbackUrl.hostname === "localhost"
    ) {
      return res.status(400).json({
        success: false,
        message: "The callback URL must be a public HTTPS URL.",
      });
    }

    const formattedPhone = normalizePhone(phone);
    const timestamp = getTimestamp();

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    const token = await getAccessToken();

    console.log("Sending STK request to Daraja Sandbox...");

    const response = await fetch(
      `${SANDBOX_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Number(amount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: "JanoluxBag",
          TransactionDesc: "JanoluxBag Sandbox test",
        }),
      }
    );

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Daraja STK response was empty or invalid JSON (HTTP ${response.status}).`
      );
    }

    console.log("Daraja STK HTTP status:", response.status);
    console.log("Daraja STK response code:", data.ResponseCode);
    console.log("Daraja STK description:", data.ResponseDescription);

    if (!response.ok || data.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message:
          data.errorMessage ||
          data.errorMessageDescription ||
          data.ResponseDescription ||
          "Daraja rejected the STK Push request.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        data.CustomerMessage ||
        "Daraja accepted the STK Push request.",
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
    });
  } catch (error) {
    console.error("M-Pesa STK Push error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "M-Pesa request failed.",
    });
  }
});

router.post("/callback", (req, res) => {
  const callback = req.body?.Body?.stkCallback;

  if (!callback) {
    return res.status(400).json({
      ResultCode: 1,
      ResultDesc: "Invalid callback payload",
    });
  }

  console.log("M-Pesa callback received:", {
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDescription: callback.ResultDesc,
    metadata: callback.CallbackMetadata?.Item || [],
  });

  // This example logs the callback only. It does not mark an order as paid.
  return res.json({
    ResultCode: 0,
    ResultDesc: "Callback received successfully",
  });
});

module.exports = router;
