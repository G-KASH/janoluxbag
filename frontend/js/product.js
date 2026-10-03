
const products = [
  {
    id: 1,
    name: "Classic Luxury Handbag",
    category: "Handbags",
    price: 3500,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900",
    description: "A timeless and elegant handbag designed for everyday sophistication. Its versatile design makes it suitable for work, casual outings and special occasions.",
    features: [
      "Elegant and modern design",
      "Spacious main compartment",
      "Comfortable carrying handles",
      "Suitable for everyday use"
    ],
    stock: 25
  },
  {
    id: 2,
    name: "Elegant Shoulder Bag",
    category: "Shoulder Bags",
    price: 2800,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900",
    description: "A fashionable shoulder bag that combines beauty and functionality. A versatile accessory for everyday fashion.",
    features: [
      "Stylish shoulder design",
      "Practical storage space",
      "Lightweight construction",
      "Suitable for everyday occasions"
    ],
    stock: 18
  },
  {
    id: 3,
    name: "Premium Crossbody Bag",
    category: "Crossbody Bags",
    price: 2500,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900",
    description: "A compact and stylish crossbody bag that keeps your essentials close while complementing your everyday look.",
    features: [
      "Compact and practical design",
      "Adjustable shoulder strap",
      "Convenient storage compartment",
      "Ideal for casual outings"
    ],
    stock: 30
  },
  {
    id: 4,
    name: "Luxury Tote Bag",
    category: "Tote Bags",
    price: 4000,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=900",
    description: "A spacious tote bag designed for those who appreciate both style and functionality. Perfect for shopping, work and daily use.",
    features: [
      "Spacious interior",
      "Elegant silhouette",
      "Comfortable carrying handles",
      "Versatile everyday accessory"
    ],
    stock: 12
  },
  {
    id: 5,
    name: "Elegant Evening Bag",
    category: "Handbags",
    price: 3200,
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=900",
    description: "An elegant bag for dinners, celebrations and special occasions. Add a refined touch to your evening outfit.",
    features: [
      "Sophisticated appearance",
      "Compact storage space",
      "Elegant evening styling",
      "Suitable for special occasions"
    ],
    stock: 10
  },
  {
    id: 6,
    name: "Classic Crossbody",
    category: "Crossbody Bags",
    price: 2700,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=900",
    description: "A classic crossbody accessory that offers a balance of convenience and timeless style.",
    features: [
      "Classic styling",
      "Hands-free carrying",
      "Compact everyday storage",
      "Easy to pair with different outfits"
    ],
    stock: 20
  }
];

const detailsContainer = document.getElementById("productDetails");
const productId = Number(new URLSearchParams(window.location.search).get("id"));
const product = products.find(item => item.id === productId);

let selectedQuantity = 1;

function formatPrice(price) {
  return `KSh ${price.toLocaleString("en-KE")}`;
}

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem("janoluxCart"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function showProduct() {
  if (!product) {
    detailsContainer.innerHTML = `
      <div class="product-not-found">
        <h2>Product Not Found</h2>
        <p>The product you're looking for does not exist.</p>
        <a href="index.html#shop">Return to Shop</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | JANOLUXBAG`;
  document.getElementById("breadcrumbName").textContent = product.name;

  const features = product.features
    .map(feature => `<li>${feature}</li>`)
    .join("");

  detailsContainer.innerHTML = `
    <div class="detail-image">
      <img src="${product.image}" alt="${product.name}">
    </div>

    <div class="detail-info">
      <p class="detail-category">${product.category}</p>
      <h1>${product.name}</h1>
      <p class="detail-price">${formatPrice(product.price)}</p>

      <p class="detail-description">${product.description}</p>

      <h3>Product Features</h3>
      <ul class="detail-features">
        ${features}
      </ul>

      <p class="stock-status ${product.stock === 0 ? "out-of-stock" : ""}">
        ${product.stock > 0
          ? `${product.stock} items available`
          : "Out of stock"}
      </p>

      <div class="detail-actions">
        <div class="detail-quantity">
          <button type="button" id="decreaseQuantity" aria-label="Decrease quantity">−</button>
          <span id="selectedQuantity">1</span>
          <button type="button" id="increaseQuantity" aria-label="Increase quantity">+</button>
        </div>

        <button type="button" class="detail-add-cart" id="addProductToCart"
          ${product.stock === 0 ? "disabled" : ""}>
          <i class="fas fa-shopping-bag"></i>
          Add to Cart
        </button>
      </div>
    </div>
  `;

  const quantityDisplay = document.getElementById("selectedQuantity");

  document.getElementById("decreaseQuantity").addEventListener("click", () => {
    if (selectedQuantity > 1) {
      selectedQuantity--;
      quantityDisplay.textContent = selectedQuantity;
    }
  });

  document.getElementById("increaseQuantity").addEventListener("click", () => {
    if (selectedQuantity < product.stock) {
      selectedQuantity++;
      quantityDisplay.textContent = selectedQuantity;
    }
  });

  document.getElementById("addProductToCart").addEventListener("click", addToCart);
}

function addToCart() {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  const existingQuantity = existing ? existing.quantity : 0;

  if (existingQuantity + selectedQuantity > product.stock) {
    alert("The selected quantity exceeds the available sample stock.");
    return;
  }

  if (existing) {
    existing.quantity += selectedQuantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: selectedQuantity
    });
  }

  localStorage.setItem("janoluxCart", JSON.stringify(cart));
  updateCartCount();

  alert(`${product.name} added to your cart!`);
}

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

document.getElementById("year").textContent = new Date().getFullYear();

showProduct();
updateCartCount();