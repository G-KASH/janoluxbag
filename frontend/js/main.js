
document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyMessage = document.getElementById("emptyMessage");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const sortProducts = document.getElementById("sortProducts");
  const cartCount = document.getElementById("cartCount");

  let selectedCategory = "";

  // Load products added through the admin dashboard
  function getProducts() {
    try {
      const products = JSON.parse(
        localStorage.getItem("janoluxProducts") || "[]"
      );

      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error("Unable to load store products:", error);
      return [];
    }
  }

  // Escape product text before displaying it
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

  // Keep the cart count in sync with the saved cart
  function updateCartCount() {
    if (!cartCount) return;

    try {
      const cart = JSON.parse(localStorage.getItem("janoluxCart") || "[]");

      cartCount.textContent = Array.isArray(cart)
        ? cart.reduce((total, item) => total + Number(item.quantity || 1), 0)
        : 0;
    } catch {
      cartCount.textContent = "0";
    }
  }

  // Display products on the storefront
  function displayProducts(products) {
    resultCount.textContent =
      `${products.length} product${products.length === 1 ? "" : "s"} found`;

    if (products.length === 0) {
      productGrid.innerHTML = "";
      emptyMessage.hidden = false;
      emptyMessage.textContent = getProducts().length === 0
        ? "Our collection is being updated. Please check back soon."
        : "No products found. Try another search or category.";

      return;
    }

    emptyMessage.hidden = true;

    productGrid.innerHTML = products.map(product => {
      const id = encodeURIComponent(String(product.id ?? ""));
      const name = escapeHTML(product.name);
      const category = escapeHTML(product.category);
      const image = product.image || "";
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

  // Search, filter and sort
  function renderProducts() {
    let products = getProducts();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortOption = sortProducts.value;

    products = products.filter(product => {
      const matchesSearch =
        String(product.name || "").toLowerCase().includes(searchTerm) ||
        String(product.description || "").toLowerCase().includes(searchTerm) ||
        String(product.category || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

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

  // Search without reloading the page
  searchInput.addEventListener("input", renderProducts);

  // Prevent the search form from reloading the page
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    renderProducts();
    document.getElementById("shop").scrollIntoView({
      behavior: "smooth"
    });
  });

  // Sorting
  sortProducts.addEventListener("change", renderProducts);

  // Clicking a category filters the product list
  document.querySelectorAll(".category-card").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category || "";
      searchInput.value = "";

      document.getElementById("shop").scrollIntoView({
        behavior: "smooth"
      });

      renderProducts();
    });
  });

  // Automatically update the year in the footer
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Initial display
  renderProducts();
  updateCartCount();
});
