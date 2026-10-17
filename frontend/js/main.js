
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

  // Safely escape text displayed in HTML.
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  // Escape an image URL before placing it in an HTML attribute.
  function safeImageURL(value) {
    const url = String(value ?? "").trim();

    if (url.startsWith("data:image/")) {
      return escapeHTML(url);
    }

    try {
      const parsed = new URL(url, window.location.href);

      if (["http:", "https:"].includes(parsed.protocol)) {
        return escapeHTML(url);
      }
    } catch (error) {
      console.warn("Invalid product image URL");
    }

    return "";
  }

  function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-KE");
  }

  function getProductId(product) {
    return String(product._id || product.id || "");
  }

  // Read cart from local storage.
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
    } catch (error) {
      console.error("Could not read cart:", error);
      cartCount.textContent = "0";
    }
  }

  // Display products fetched from MongoDB.
  function displayProducts(products) {
    if (!productGrid) {
      console.error("Cannot find the productGrid element in index.html");
      return;
    }

    if (resultCount) {
      resultCount.textContent =
        `${products.length} product${products.length === 1 ? "" : "s"} found`;
    }

    if (products.length === 0) {
      productGrid.innerHTML = "";

      if (emptyMessage) {
        emptyMessage.hidden = false;
        emptyMessage.textContent = allProducts.length === 0
          ? "No products are available right now. Please check back soon."
          : "No products found. Try another search or category.";
      }

      return;
    }

    if (emptyMessage) {
      emptyMessage.hidden = true;
    }

    productGrid.innerHTML = products.map(product => {
      const id = getProductId(product);

      if (!id) {
        console.warn("Skipping product without an ID:", product.name);
        return "";
      }

      const productURL = `product.html?id=${encodeURIComponent(id)}`;
      const name = escapeHTML(product.name || "Unnamed Product");
      const category = escapeHTML(product.category || "Fashion");
      const image = safeImageURL(product.image);
      const price = formatPrice(product.price);
      const stock = Number(product.stock || 0);

      return `
        <article class="product-card">
          <a href="${productURL}" class="product-image-link">
            <div class="product-image">
              ${
                image
                  ? `<img src="${image}" alt="${name}" loading="lazy">`
                  : `<div class="product-image-placeholder">Image unavailable</div>`
              }
              ${
                product.featured
                  ? '<span class="featured-badge">Featured</span>'
                  : ""
              }
            </div>
          </a>

          <div class="product-info">
            <p class="product-category">${category}</p>
            <h3>
              <a href="${productURL}">${name}</a>
            </h3>
            <p class="product-price">KSh ${price}</p>
            <p class="product-stock">
              ${stock > 0 ? "In stock" : "Out of stock"}
            </p>
            <a href="${productURL}" class="btn-primary">
              View Product
            </a>
          </div>
        </article>
      `;
    }).join("");
  }

  // Search, filter and sort the products.
  function renderProducts() {
    const searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const sortOption = sortProducts ? sortProducts.value : "";

    let products = allProducts.filter(product => {
      const matchesSearch =
        String(product.name || "").toLowerCase().includes(searchTerm) ||
        String(product.description || "").toLowerCase().includes(searchTerm) ||
        String(product.category || "").toLowerCase().includes(searchTerm);

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

  // Fetch the latest products from the backend.
  async function loadProducts() {
    if (productGrid) {
      productGrid.innerHTML = "<p>Loading products...</p>";
    }

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Product API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The product API did not return a product list.");
      }

      allProducts = data.map(product => ({
        ...product,
        id: getProductId(product)
      }));

      renderProducts();
    } catch (error) {
      console.error("Failed to load JanoluxBag products:", error);

      if (productGrid) {
        productGrid.innerHTML = "";
      }

      if (resultCount) {
        resultCount.textContent = "Products unavailable";
      }

      if (emptyMessage) {
        emptyMessage.hidden = false;
        emptyMessage.textContent =
          "We couldn't load products. Please refresh the page and try again.";
      }
    }
  }

  // Search without reloading the page.
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

  // Sorting.
  if (sortProducts) {
    sortProducts.addEventListener("change", renderProducts);
  }

  // Category filters.
  document.querySelectorAll(".category-card").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category || "";

      if (searchInput) {
        searchInput.value = "";
      }

      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth"
      });

      renderProducts();
    });
  });

  // Automatically update the footer year.
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  updateCartCount();
  loadProducts();
});
