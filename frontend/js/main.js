
// Sample products for the first version of JanoluxBag
// Later, these will be loaded from the Node.js API.

const products = [
  {
    id: 1,
    name: "Classic Luxury Handbag",
    category: "Handbags",
    price: 3500,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600",
    badge: "Popular"
  },
  {
    id: 2,
    name: "Elegant Shoulder Bag",
    category: "Shoulder Bags",
    price: 2800,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600",
    badge: "New"
  },
  {
    id: 3,
    name: "Premium Crossbody Bag",
    category: "Crossbody Bags",
    price: 2500,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
    badge: ""
  },
  {
    id: 4,
    name: "Luxury Tote Bag",
    category: "Tote Bags",
    price: 4000,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600",
    badge: "Trending"
  },
  {
    id: 5,
    name: "Elegant Evening Bag",
    category: "Handbags",
    price: 3200,
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600",
    badge: ""
  },
  {
    id: 6,
    name: "Classic Crossbody",
    category: "Crossbody Bags",
    price: 2700,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600",
    badge: ""
  }
];

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const sortProducts = document.getElementById("sortProducts");
const resultCount = document.getElementById("resultCount");
const emptyMessage = document.getElementById("emptyMessage");

let currentSearch = "";
let currentCategory = "";

// Format prices in Kenyan shillings
function formatPrice(price) {
  return `KSh ${price.toLocaleString("en-KE")}`;
}

// Display products
function displayProducts(items) {
  productGrid.innerHTML = "";

  resultCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"} found`;
  emptyMessage.hidden = items.length > 0;

  items.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const badge = product.badge
      ? `<span class="product-badge">${product.badge}</span>`
      : "";

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${badge}
      </div>

      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>

        <button class="add-cart" data-id="${product.id}">
          <i class="fas fa-shopping-bag"></i>
          Add to Cart
        </button>
      </div>
    `;

    productGrid.appendChild(card);
  });
}

// Read cart safely from local storage
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("janoluxCart"));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

// Update cart counter
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);

  document.getElementById("cartCount").textContent = count;
}

// Add product to cart
function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  localStorage.setItem("janoluxCart", JSON.stringify(cart));
  updateCartCount();

  alert(`${product.name} added to your cart!`);
}

// Search and filter products
function filterProducts() {
  let filtered = [...products];

  if (currentSearch) {
    filtered = filtered.filter(product =>
      `${product.name} ${product.category}`
        .toLowerCase()
        .includes(currentSearch.toLowerCase())
    );
  }

  if (currentCategory) {
    filtered = filtered.filter(product =>
      product.category === currentCategory
    );
  }

  const sortValue = sortProducts.value;

  if (sortValue === "low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortValue === "high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortValue === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  displayProducts(filtered);
}

// Search form
searchForm.addEventListener("submit", event => {
  event.preventDefault();
  currentSearch = searchInput.value.trim();
  currentCategory = "";
  filterProducts();

  document.getElementById("shop").scrollIntoView({
    behavior: "smooth"
  });
});

// Live search
searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim();
  currentCategory = "";
  filterProducts();
});

// Sorting
sortProducts.addEventListener("change", filterProducts);

// Category filtering
document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;
    currentSearch = "";
    searchInput.value = "";
    filterProducts();

    document.getElementById("shop").scrollIntoView({
      behavior: "smooth"
    });
  });
});

// Add to cart buttons
productGrid.addEventListener("click", event => {
  const button = event.target.closest(".add-cart");
  if (!button) return;

  addToCart(Number(button.dataset.id));
});

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// Close mobile navigation after clicking a link
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Initialize homepage
displayProducts(products);
updateCartCount();