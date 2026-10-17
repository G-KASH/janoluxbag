
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://janoluxbag.onrender.com/api/products";

  const tableBody = document.getElementById("productsTableBody");
  const searchInput = document.getElementById("productSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const productCount = document.getElementById("productCount");
  const inventoryMessage = document.getElementById("inventoryMessage");
  const emptyProducts = document.getElementById("emptyProducts");
  const logoutBtn = document.getElementById("logoutBtn");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  let products = [];

  // Protect the admin page
  if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
    window.location.href = "login.html";
    return;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatPrice(price) {
    return `KSh ${Number(price || 0).toLocaleString("en-KE")}`;
  }

  function getStockStatus(stock) {
    const quantity = Number(stock) || 0;

    if (quantity <= 0) {
      return '<span class="status-badge out-of-stock">Out of Stock</span>';
    }

    if (quantity <= 5) {
      return '<span class="status-badge low-stock">Low Stock</span>';
    }

    return '<span class="status-badge in-stock">In Stock</span>';
  }

  function renderProducts() {
    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const selectedCategory = categoryFilter?.value || "";

    const filteredProducts = products.filter(product => {
      const matchesSearch = [
        product.name,
        product.description,
        product.category
      ].some(value => String(value || "").toLowerCase().includes(searchTerm));

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (productCount) {
      productCount.textContent =
        `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`;
    }

    if (inventoryMessage) {
      inventoryMessage.textContent =
        filteredProducts.length !== products.length
          ? `Showing ${filteredProducts.length} of ${products.length}`
          : "";
    }

    if (emptyProducts) {
      emptyProducts.hidden = filteredProducts.length !== 0;
    }

    if (!filteredProducts.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            ${products.length
              ? "No products match your search."
              : "No products found in MongoDB. Add a product to get started."}
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filteredProducts.map(product => {
      const id = String(product._id || product.id || "");
      const image = product.image || "";
      const stock = Number(product.stock) || 0;

      return `
        <tr>
          <td>
            <div class="admin-product-info">
              ${image
                ? `<img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    class="admin-product-image"
                  >`
                : ""}
              <span>${escapeHTML(product.name || "Unnamed product")}</span>
            </div>
          </td>
          <td>${escapeHTML(product.category || "Uncategorized")}</td>
          <td>${formatPrice(product.price)}</td>
          <td>${stock}</td>
          <td>${getStockStatus(stock)}</td>
          <td>
            <div class="product-actions">
              <a
                class="edit-btn"
                href="edit-product.html?id=${encodeURIComponent(id)}"
              >Edit</a>
              <button
                type="button"
                class="delete-btn"
                data-delete-id="${escapeHTML(id)}"
                data-delete-name="${escapeHTML(product.name || "this product")}"
              >Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadProducts() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Loading products from MongoDB...</td>
      </tr>
    `;

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The API did not return a product list.");
      }

      products = data.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      renderProducts();
    } catch (error) {
      console.error("Could not load admin products:", error);

      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Unable to load products. Check your internet connection
            and try refreshing this page.
          </td>
        </tr>
      `;

      if (productCount) productCount.textContent = "Unavailable";
      if (inventoryMessage) inventoryMessage.textContent = "API connection failed";
    }
  }

  // Delete directly from MongoDB
  tableBody.addEventListener("click", async event => {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;

    const id = button.dataset.deleteId;
    const name = button.dataset.deleteName || "this product";

    if (!id || !confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `Delete failed: HTTP ${response.status}`);
      }

      products = products.filter(product =>
        String(product._id || product.id) !== id
      );

      renderProducts();

      if (inventoryMessage) {
        inventoryMessage.textContent = "Product deleted from the database.";
      }
    } catch (error) {
      console.error("Product deletion failed:", error);
      alert(
        "Could not delete the product. Check the server and try again.\n" +
        error.message
      );
      button.disabled = false;
      button.textContent = "Delete";
    }
  });

  searchInput?.addEventListener("input", renderProducts);
  categoryFilter?.addEventListener("change", renderProducts);

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("janoluxAdminLoggedIn");
    localStorage.removeItem("janoluxAdminEmail");
    window.location.href = "login.html";
  });

  menuToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  loadProducts();
});
