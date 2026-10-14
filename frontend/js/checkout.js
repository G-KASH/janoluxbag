
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const message = document.getElementById("checkoutMessage");
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  const checkoutTotal = document.getElementById("checkoutTotal");
  const cartCount = document.getElementById("cartCount");

  function getCart() {
    try {
      const cart = JSON.parse(
        localStorage.getItem("janoluxCart") || "[]"
      );

      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      console.error("Cart error:", error);
      return [];
    }
  }

  function formatPrice(amount) {
    return `KES ${Number(amount).toLocaleString("en-KE")}`;
  }

  function showMessage(text, type = "error") {
    if (!message) return;

    message.textContent = text;
    message.style.display = "block";
    message.style.padding = "12px";
    message.style.marginTop = "15px";
    message.style.borderRadius = "6px";
    message.style.background =
      type === "success" ? "#e8f7e8" : "#fdeaea";
    message.style.color =
      type === "success" ? "#176b2c" : "#a00000";
  }

  function renderCheckout() {
    const cart = getCart();

    const total = cart.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    if (checkoutItems) {
      checkoutItems.innerHTML = "";

      cart.forEach((item) => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        const price = document.createElement("span");

        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.gap = "12px";
        row.style.marginBottom = "12px";

        name.textContent =
          `${item.name} × ${Number(item.quantity || 1)}`;

        price.textContent = formatPrice(
          Number(item.price || 0) * Number(item.quantity || 1)
        );

        row.append(name, price);
        checkoutItems.appendChild(row);
      });
    }

    if (checkoutSubtotal) {
      checkoutSubtotal.textContent = formatPrice(total);
    }

    if (checkoutTotal) {
      checkoutTotal.textContent = formatPrice(total);
    }

    if (cartCount) {
      cartCount.textContent = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
      );
    }

    if (placeOrderBtn) {
      placeOrderBtn.disabled = cart.length === 0;
      placeOrderBtn.textContent =
        cart.length === 0 ? "Your Cart Is Empty" : "Place Order";
    }
  }

  if (!form) {
    console.error("Checkout form not found in checkout.html.");
    return;
  }

  renderCheckout();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
      showMessage("Your cart is empty. Please add a product first.");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    const order = {
      customer: {
        fullName: String(formData.get("fullName") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        county: String(formData.get("county") || "").trim(),
        deliveryAddress: String(
          formData.get("deliveryAddress") || ""
        ).trim(),
        deliveryNotes: String(
          formData.get("deliveryNotes") || ""
        ).trim()
      },

      paymentMethod: String(
        formData.get("paymentMethod") || "cash_on_delivery"
      ),

      items: cart.map((item) => ({
        id: String(item.id),
        name: String(item.name || ""),
        price: Number(item.price),
        quantity: Number(item.quantity || 1)
      }))
    };

    try {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = "Submitting Order...";

      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(order)
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Could not submit your order."
        );
      }

      localStorage.removeItem("janoluxCart");

      showMessage(
        `Order received! Reference: ${result.orderReference}. Total: ${formatPrice(result.total)}.`,
        "success"
      );

      form.reset();
      renderCheckout();

    } catch (error) {
      console.error("Checkout submission error:", error);

      showMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that your server is running on port 5000."
          : error.message
      );

    } finally {
      if (placeOrderBtn) {
        placeOrderBtn.disabled = getCart().length === 0;
        placeOrderBtn.textContent =
          getCart().length === 0 ? "Your Cart Is Empty" : "Place Order";
      }
    }
  });
});

