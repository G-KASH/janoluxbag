
document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "https://janoluxbag.onrender.com/api/products";

  const cartItemsContainer = document.getElementById("cartItems");
  const subtotalElement = document.getElementById("cartSubtotal");
  const totalElement = document.getElementById("cartTotal");
  const cartCountElement = document.getElementById("cartCount");
  const itemCountElement = document.getElementById("itemCount");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const yearElement = document.getElementById("year");

  let products = [];

  function readStorage(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (error) {
      console.error(`Could not read ${key}:`, error);
      return fallback;
    }
  }

  function readCart() {
    const cart = readStorage("janoluxCart");
    if (!Array.isArray(cart)) return [];

    return cart
      .filter(item =>
        item &&
        (typeof item.id === "string" || typeof item.id === "number") &&
        String(item.id).length > 0 &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0
      )
      .map(item => ({
        ...item,
        id: String(item.id),
        name: String(item.name || "JanoluxBag Product"),
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: typeof item.image === "string" ? item.image : ""
      }));
  }

  function saveCart(cart) {
    localStorage.setItem("janoluxCart", JSON.stringify(cart));
  }

  function formatPrice(price) {
    return `KSh ${Number(price || 0).toLocaleString("en-KE")}`;
  }

  function getProductId(product) {
    return String(product?._id ?? product?.id ?? "");
  }

  function findProduct(cartItem) {
    return products.find(
      product => getProductId(product) === String(cartItem.id)
    );
  }

  function getDisplayItem(item) {
    const product = findProduct(item);

    // Use the latest product information from MongoDB when available.
    if (!product) return item;

    return {
      ...item,
      name: product.name || item.name,
      price: Number.isFinite(Number(product.price))
        ? Number(product.price)
        : item.price,
      image: product.image || item.image,
      stock: product.stock
    };
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  async function loadProducts() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      products = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : [];

      // Store a compatible catalogue copy for other existing site scripts.
      localStorage.setItem(
        "janoluxProducts",
        JSON.stringify(
          products.map(product => ({
            ...product,
            id: getProductId(product)
          }))
        )
      );
    } catch (error) {
      console.error("Could not load products from MongoDB:", error);
      products = [];
    }
  }

  function updateCart() {
    if (!cartItemsContainer) return;

    const cart = readCart();
    saveCart(cart);
    cartItemsContainer.innerHTML = "";

    const totalQuantity = cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const subtotal = cart.reduce((total, item) => {
      const displayItem = getDisplayItem(item);
      return total + displayItem.price * item.quantity;
    }, 0);

    if (cartCountElement) cartCountElement.textContent = totalQuantity;

    if (itemCountElement) {
      itemCountElement.textContent =
        `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;
    }

    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (totalElement) totalElement.textContent = formatPrice(subtotal);
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

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
      const displayItem = getDisplayItem(item);
      const row = createElement("article", "cart-item");

      const image = createElement("img");
      image.alt = displayItem.name;
      image.loading = "lazy";

      if (displayItem.image) {
        image.src = displayItem.image;
      } else {
        image.alt = `${displayItem.name} — image unavailable`;
        image.classList.add("cart-image-unavailable");
      }

      image.addEventListener("error", () => {
        image.style.display = "none";
      }, { once: true });

      const info = createElement("div", "cart-item-info");
      const name = createElement("h3", "", displayItem.name);
      const price = createElement("p", "", formatPrice(displayItem.price));

      const quantityControl = createElement("div", "quantity-control");

      const decrease = createElement("button", "", "−");
      decrease.type = "button";
      decrease.setAttribute("aria-label", `Decrease ${displayItem.name}`);
      decrease.disabled = item.quantity <= 1;

      const quantity = createElement("span", "", item.quantity);

      const increase = createElement("button", "", "+");
      increase.type = "button";
      increase.setAttribute("aria-label", `Increase ${displayItem.name}`);

      const product = findProduct(item);
      const hasStock = product &&
        product.stock !== undefined &&
        product.stock !== null &&
        product.stock !== "";

      const stock = hasStock ? Number(product.stock) : null;

      if (hasStock && Number.isFinite(stock)) {
        increase.disabled = item.quantity >= stock;
      }

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
        formatPrice(displayItem.price * item.quantity)
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
    const cart = readCart();
    const item = cart.find(entry => String(entry.id) === String(id));
    if (!item) return;

    const newQuantity = item.quantity + amount;
    if (newQuantity < 1) return;

    const product = findProduct(item);

    if (amount > 0 && product &&
        product.stock !== undefined && product.stock !== null &&
        product.stock !== "") {
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
    const cart = readCart().filter(
      item => String(item.id) !== String(id)
    );

    saveCart(cart);
    updateCart();
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (readCart().length > 0) {
        window.location.href = "checkout.html";
      }
    });
  }

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Load MongoDB products before rendering the cart.
  await loadProducts();
  updateCart();

  window.addEventListener("storage", event => {
    if (event.key === "janoluxCart" || event.key === "janoluxProducts") {
      updateCart();
    }
  });
});
