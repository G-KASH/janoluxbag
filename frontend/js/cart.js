
const cartItemsContainer = document.getElementById("cartItems");
const subtotalElement = document.getElementById("cartSubtotal");
const totalElement = document.getElementById("cartTotal");
const cartCountElement = document.getElementById("cartCount");
const itemCountElement = document.getElementById("itemCount");
const checkoutBtn = document.getElementById("checkoutBtn");

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem("janoluxCart"));
    if (!Array.isArray(data)) return [];

    return data.filter(item =>
      Number.isInteger(item.id) &&
      typeof item.name === "string" &&
      Number.isFinite(item.price) &&
      item.price >= 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("janoluxCart", JSON.stringify(cart));
}

function formatPrice(price) {
  return `KSh ${price.toLocaleString("en-KE")}`;
}

function updateCart() {
  const cart = getCart();

  cartItemsContainer.innerHTML = "";

  const itemCount = cart.reduce(
    (total, item) => total + item.quantity, 0
  );

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity, 0
  );

  cartCountElement.textContent = itemCount;
  itemCountElement.textContent =
    `${itemCount} item${itemCount === 1 ? "" : "s"}`;

  subtotalElement.textContent = formatPrice(subtotal);
  totalElement.textContent = formatPrice(subtotal);

  checkoutBtn.disabled = cart.length === 0;

  if (cart.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-cart";

    const icon = document.createElement("i");
    icon.className = "fas fa-shopping-bag";

    const heading = document.createElement("h3");
    heading.textContent = "Your cart is empty";

    const message = document.createElement("p");
    message.textContent = "Discover something beautiful for your collection.";

    const link = document.createElement("a");
    link.href = "index.html#shop";
    link.textContent = "Start Shopping";

    empty.append(icon, heading, message, link);
    cartItemsContainer.appendChild(empty);
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("article");
    row.className = "cart-item";

    const image = document.createElement("img");
    image.src = item.image || "";
    image.alt = item.name;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const price = document.createElement("p");
    price.textContent = formatPrice(item.price);

    const quantityControl = document.createElement("div");
    quantityControl.className = "quantity-control";

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Decrease ${item.name}`);

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Increase ${item.name}`);

    decrease.addEventListener("click", () => {
      changeQuantity(item.id, -1);
    });

    increase.addEventListener("click", () => {
      changeQuantity(item.id, 1);
    });

    quantityControl.append(decrease, quantity, increase);
    info.append(name, price, quantityControl);

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";

    const lineTotal = document.createElement("p");
    lineTotal.className = "cart-item-total";
    lineTotal.textContent = formatPrice(item.price * item.quantity);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      removeItem(item.id);
    });

    actions.append(lineTotal, remove);
    row.append(image, info, actions);

    cartItemsContainer.appendChild(row);
  });
}

function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
  updateCart();
}

function removeItem(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  updateCart();
}

checkoutBtn.addEventListener("click", () => {
  if (getCart().length === 0) return;

  alert("Checkout will be available in a future update.");
});

document.getElementById("year").textContent = new Date().getFullYear();

updateCart();