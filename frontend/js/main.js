
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://janoluxbag.onrender.com/api/products";

  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyMessage = document.getElementById("emptyMessage");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const sortProducts = document.getElementById("sortProducts");
  const cartCount = document.getElementById("cartCount");

  let allProducts = [];
  let selectedCategory = "";

  // Escape text before inserting it into HTML
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

  // Update cart count; the shopping cart remains in localStorage
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

  // Fetch the current product list from the backend
  async function loadProducts() {
    if (productGrid) {
      productGrid.innerHTML = "<p>Loading our collection...</p>";
    }

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Products API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server did not return a product list.");
      }

      // MongoDB uses _id; storefront links use id
      allProducts = data.map(product => ({
        ...product,
        id: String(product._id ?? product.id ?? "")
      }));

      renderProducts();
    } catch (error) {
      console.error("Unable to load store products:", error);

      if (productGrid) productGrid.innerHTML = "";
      if (resultCount) resultCount.textContent = "";

      if (emptyMessage) {
        emptyMessage.hidden = false;
        emptyMessage.textContent =
          "We couldn't load our collection right now. Please refresh the page and try again.";
      }
    }
  }

  // Display products on the storefront
  function displayProducts(products) {
    if (!productGrid) return;

    if (resultCount) {
      resultCount.textContent =
        `${products.length} product${products.length === 1 ? "" : "s"} found`;
    }

    if (products.length === 0) {
      productGrid.innerHTML = "";

      if (emptyMessage) {
        emptyMessage.hidden = false;
        emptyMessage.textContent = allProducts.length === 0
          ? "Our collection is being updated. Please check back soon."
          : "No products found. Try another search or category.";
      }

      return;
    }

    if (emptyMessage) emptyMessage.hidden = true;

    productGrid.innerHTML = products.map(product => {
      const id = encodeURIComponent(String(product.id));
      const name = escapeHTML(product.name || "Unnamed Product");
      const category = escapeHTML(product.category || "Fashion");
      const image = typeof product.image === "string"
        ? product.image
        : "";
      const price = formatPrice(product.price);
      const stock = Number(product.stock) || 0;

      return `
        <article class="product-card">
          <a href="product.html?id=${id}" class="product-image-link">
            <div class="product-image">
              ${
                image
                  ? `<img
                       src="${escapeHTML(image)}"
                       alt="${name}"
                       loading="lazy"
                     >`
                  : `<div class="no-product-image">
                       <p>Image unavailable</p>
                     </div>`
              }
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

  // Search, filter and sort the fetched products
  function renderProducts() {
    let products = [...allProducts];

    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const sortOption = sortProducts?.value || "";

    products = products.filter(product => {
      const matchesSearch = [
        product.name,
        product.description,
        product.category
      ].some(value =>
        String(value || "").toLowerCase().includes(searchTerm)
      );

      const matchesCategory =
        !selectedCategory ||
        String(product.category || "").toLowerCase() ===
          selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    if (sortOption === "low") {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "high") {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === "name") {
      products.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    } else {
      products.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    displayProducts(products);
  }

  // Search without reloading the page
  searchInput?.addEventListener("input", renderProducts);

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    renderProducts();

    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  // Sorting
  sortProducts?.addEventListener("change", renderProducts);

  // Category cards
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

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  updateCartCount();
  loadProducts();
});
