
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cart = readCart();

  if (cart.length === 0) {
    showMessage("Your cart is empty. Please add products first.");
    return;
  }

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const paymentMethod = String(
    formData.get("paymentMethod") || ""
  );
  const phone = String(
    formData.get("phone") || ""
  ).trim();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!Number.isSafeInteger(total) || total < 1) {
    showMessage("The order total is invalid.");
    return;
  }

  if (paymentMethod === "mpesa") {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Requesting M-Pesa...";

    try {
      const response = await fetch(
        "http://localhost:5000/api/mpesa/stkpush",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            amount: total,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Could not initiate M-Pesa payment."
        );
      }

      showMessage(
        "M-Pesa request accepted. Follow the payment instructions on the test phone.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.message ||
        "Could not connect to the JanoluxBag payment server."
      );
    } finally {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    }

    return;
  }

  if (paymentMethod === "cash_on_delivery") {
    const orderDraft = {
      customer: {
        fullName: String(
          formData.get("fullName") || ""
        ).trim(),
        phone,
        email: String(
          formData.get("email") || ""
        ).trim(),
      },
      delivery: {
        county: String(
          formData.get("county") || ""
        ).trim(),
        address: String(
          formData.get("deliveryAddress") || ""
        ).trim(),
        notes: String(
          formData.get("deliveryNotes") || ""
        ).trim(),
      },
      paymentMethod,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    console.log("Checkout order draft:", orderDraft);

    showMessage(
      "Your details are valid, but order submission is not yet connected to the backend.",
      "success"
    );

    return;
  }

  showMessage("Please select a payment method.");
});
