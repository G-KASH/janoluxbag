
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://janoluxbag.onrender.com/api/products";

  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyMessage = document.getElementById("emptyMessage");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const sortProducts = document.getElementById("sortProducts");
  const cartCount = document.getElementById("cartCount");

  let selectedCategory = "";
  let allProducts = [];
  let loadFailed = false;

  function getProducts() {
    return allProducts;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-KE");
  }

  function updateCartCount() {
    if (!cartCount) return;

    try {
      const cart = JSON.parse(
        localStorage.getItem("janoluxCart") || "[]"
      );

      cartCount.textContent = Array.isArray(cart)
        ? cart.reduce(
            (total, item) => total + Number(item.quantity || 1),
            0
          )
        : 0;
    } catch {
      cartCount.textContent = "0";
    }
  }

  function displayProducts(products) {
    if (!productGrid || !resultCount || !emptyMessage) return;

    resultCount.textContent =
      `${products.length} product${products.length === 1 ? "" : "s"} found`;

    if (products.length === 0) {
      productGrid.innerHTML = "";
      emptyMessage.hidden = false;

      if (loadFailed) {
        emptyMessage.textContent =
          "We couldn't load products right now. Please refresh the page and try again.";
      } else if (getProducts().length === 0) {
        emptyMessage.textContent =
          "Our collection is being updated. Please check back soon.";
      } else {
        emptyMessage.textContent =
          "No products found. Try another search or category.";
      }

      return;
    }

    emptyMessage.hidden = true;

    productGrid.innerHTML = products.map(product => {
      const id = encodeURIComponent(String(product.id ?? product._id ?? ""));
      const name = escapeHTML(product.name);
      const category = escapeHTML(product.category);
      const image = escapeHTML(product.image || "");
      const price = formatPrice(product.price);
      const stock = Number(product.stock || 0);

      return `
        <article class="product-card">
          <a href="product.html?id=${id}" class="product-image-link">
            <div class="product-image">
              <img
                src="${image}"
                alt="${name}"
                loading="lazy"
              >
              ${product.featured
                ? '<span class="featured-badge">Featured</span>'
                : ""}
            </div>
          </a>

          <div class="product-info">
            <p class="product-category">${category}</p>
            <h3>
              <a href="product.html?id=${id}">${name}</a>
            </h3>
            <p class="product-price">KSh ${price}</p>
            <p class="product-stock">
              ${stock > 0 ? "In stock" : "Out of stock"}
            </p>
            <a href="product.html?id=${id}" class="btn-primary">
              View Product
            </a>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderProducts() {
    if (!searchInput || !sortProducts) return;

    let products = getProducts().filter(product => {
      const searchTerm = searchInput.value.trim().toLowerCase();

      const matchesSearch =
        String(product.name || "").toLowerCase().includes(searchTerm) ||
        String(product.description || "").toLowerCase().includes(searchTerm) ||
        String(product.category || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const sortOption = sortProducts.value;

    if (sortOption === "low") {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "high") {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === "name") {
      products.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    } else {
      products.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    displayProducts(products);
  }

  async function loadProducts() {
    if (productGrid && emptyMessage) {
      productGrid.innerHTML = "";
      emptyMessage.hidden = false;
      emptyMessage.textContent = "Loading products...";
    }

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Product API returned ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected product API response");
      }

      allProducts = data.map(product => ({
        ...product,
        id: String(product._id ?? product.id ?? "")
      }));

      loadFailed = false;
      renderProducts();
    } catch (error) {
      console.error("Unable to load products from MongoDB:", error);
      allProducts = [];
      loadFailed = true;
      renderProducts();
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (searchForm) {
    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      renderProducts();

      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth"
      });
    });
  }

  if (sortProducts) {
    sortProducts.addEventListener("change", renderProducts);
  }

  document.querySelectorAll(".category-card").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category || "";

      if (searchInput) searchInput.value = "";

      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth"
      });

      renderProducts();
    });
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  updateCartCount();
  loadProducts();
});
