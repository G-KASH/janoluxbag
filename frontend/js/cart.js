
document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cartItems");
  const subtotalElement = document.getElementById("cartSubtotal");
  const totalElement = document.getElementById("cartTotal");
  const cartCountElement = document.getElementById("cartCount");
  const itemCountElement = document.getElementById("itemCount");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const yearElement = document.getElementById("year");

  function readStorage(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getProducts() {
    const products = readStorage("janoluxProducts");
    return Array.isArray(products) ? products : [];
  }

  function getCart() {
    const storedCart = readStorage("janoluxCart");
    if (!Array.isArray(storedCart)) return [];

    return storedCart
      .filter(item =>
        item &&
        (typeof item.id === "string" || typeof item.id === "number") &&
        String(item.id).length > 0 &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0
      )
      .map(item => ({
        ...item,
        id: String(item.id),
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: typeof item.image === "string" ? item.image : ""
      }));
  }

  function saveCart(cart) {
    localStorage.setItem("janoluxCart", JSON.stringify(cart));
  }

  function formatPrice(price) {
    return `KSh ${Number(price).toLocaleString("en-KE")}`;
  }

  function findProduct(cartItem) {
    return getProducts().find(
      product => String(product.id) === String(cartItem.id)
    );
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  function updateCart() {
    const cart = getCart();
    saveCart(cart);

    cartItemsContainer.innerHTML = "";

    const totalQuantity = cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    cartCountElement.textContent = totalQuantity;
    itemCountElement.textContent =
      `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;

    subtotalElement.textContent = formatPrice(subtotal);
    totalElement.textContent = formatPrice(subtotal);

    checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
      const empty = createElement("div", "empty-cart");

      const icon = createElement("i", "fas fa-shopping-bag");
      icon.setAttribute("aria-hidden", "true");

      const heading = createElement("h3", "", "Your cart is empty");

      const message = createElement(
        "p",
        "",
        "Discover something beautiful for your collection."
      );

      const link = createElement("a", "", "Start Shopping");
      link.href = "index.html#shop";

      empty.append(icon, heading, message, link);
      cartItemsContainer.appendChild(empty);
      return;
    }

    cart.forEach(item => {
      const row = createElement("article", "cart-item");

      const image = createElement("img");
      image.src = item.image;
      image.alt = item.name;
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.style.display = "none";
      }, { once: true });

      const info = createElement("div", "cart-item-info");
      const name = createElement("h3", "", item.name);
      const price = createElement("p", "", formatPrice(item.price));

      const quantityControl = createElement("div", "quantity-control");

      const decrease = createElement("button", "", "−");
      decrease.type = "button";
      decrease.setAttribute("aria-label", `Decrease ${item.name}`);

      const quantity = createElement("span", "", item.quantity);

      const increase = createElement("button", "", "+");
      increase.type = "button";
      increase.setAttribute("aria-label", `Increase ${item.name}`);

      const product = findProduct(item);
      const stock = product ? Number(product.stock) : null;

      if (product && Number.isFinite(stock)) {
        increase.disabled = item.quantity >= stock;
      }

      decrease.disabled = item.quantity <= 1;

      decrease.addEventListener("click", () => {
        changeQuantity(item.id, -1);
      });

      increase.addEventListener("click", () => {
        changeQuantity(item.id, 1);
      });

      quantityControl.append(decrease, quantity, increase);
      info.append(name, price, quantityControl);

      const actions = createElement("div", "cart-item-actions");

      const lineTotal = createElement(
        "p",
        "cart-item-total",
        formatPrice(item.price * item.quantity)
      );

      const remove = createElement("button", "remove-item", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => removeItem(item.id));

      actions.append(lineTotal, remove);
      row.append(image, info, actions);
      cartItemsContainer.appendChild(row);
    });
  }

  function changeQuantity(id, amount) {
    const cart = getCart();
    const item = cart.find(entry => String(entry.id) === String(id));

    if (!item) return;

    const newQuantity = item.quantity + amount;

    // Keep at least one item. Use Remove to delete the item.
    if (newQuantity < 1) return;

    const product = findProduct(item);

    if (amount > 0 && product) {
      const stock = Number(product.stock);

      if (Number.isFinite(stock) && newQuantity > stock) {
        alert(`Only ${stock} item(s) are available in stock.`);
        return;
      }
    }

    item.quantity = newQuantity;
    saveCart(cart);
    updateCart();
  }

  function removeItem(id) {
    const updatedCart = getCart().filter(
      item => String(item.id) !== String(id)
    );

    saveCart(updatedCart);
    updateCart();
  }

checkoutBtn.addEventListener("click", () => {
  if (getCart().length === 0) return;

  window.location.href = "checkout.html";
});

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  updateCart();

  // Refresh the cart if another open tab changes its contents.
  window.addEventListener("storage", event => {
    if (event.key === "janoluxCart" || event.key === "janoluxProducts") {
      updateCart();
    }
  });
});
