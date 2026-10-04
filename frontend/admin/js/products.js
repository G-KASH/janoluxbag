// Protect the page
if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const tableBody = document.getElementById("productsTableBody");
const searchInput = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const productCount = document.getElementById("productCount");
const emptyProducts = document.getElementById("emptyProducts");
const inventoryMessage = document.getElementById("inventoryMessage");

// Load products safely
function getProducts() {
  try {
    const products = JSON.parse(
      localStorage.getItem("janoluxProducts") || "[]"
    );

    return Array.isArray(products) ? products : [];
  } catch {
    return [];
  }
}

// Save products
function saveProducts(products) {
  localStorage.setItem("janoluxProducts", JSON.stringify(products));
}

// Escape user-provided text
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Format prices
function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-KE");
}

// Stock label
function getStockStatus(stock) {
  const quantity = Number(stock) || 0;

  if (quantity === 0) {
    return `<span class="stock-badge stock-out">Out of stock</span>`;
  }

  if (quantity <= 5) {
    return `<span class="stock-badge stock-low">Low stock</span>`;
  }

  return `<span class="stock-badge stock-available">In stock</span>`;
}

// Render the products
function renderProducts() {
  const products = getProducts();
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      String(product.name || "").toLowerCase().includes(searchTerm);

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  productCount.textContent =
    `${filteredProducts.length} of ${products.length} products`;

  inventoryMessage.textContent =
    products.length === 0 ? "Your inventory is empty." : "";

  if (filteredProducts.length === 0) {
    tableBody.innerHTML = "";
    emptyProducts.hidden = false;
    return;
  }

  emptyProducts.hidden = true;

  tableBody.innerHTML = filteredProducts.map(product => {
    const safeName = escapeHTML(product.name);
    const safeCategory = escapeHTML(product.category);
    const safeImage = product.image || "";

    return `
      <tr>
        <td>
          <div class="product-cell">
            <img
              src="${safeImage}"
              alt="${safeName}"
              loading="lazy"
            >
            <div>
              <strong>${safeName}</strong>
              ${product.featured
                ? '<span class="featured-badge">Featured</span>'
                : ""}
            </div>
          </div>
        </td>

        <td>${safeCategory}</td>

        <td>KSh ${formatPrice(product.price)}</td>

        <td>${Number(product.stock) || 0}</td>

        <td>${getStockStatus(product.stock)}</td>

        <td>
          <div class="product-actions">
            <a
              href="edit-product.html?id=${encodeURIComponent(product.id)}"
              class="product-action edit-action"
            >
              Edit
            </a>

            <button
              type="button"
              class="product-action delete-action"
              data-delete-id="${escapeHTML(product.id)}"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Delete a product
tableBody.addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-delete-id]");

  if (!deleteButton) return;

  const productId = deleteButton.dataset.deleteId;
  const products = getProducts();
  const product = products.find(item => String(item.id) === productId);

  if (!product) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${product.name}"?`
  );

  if (!confirmed) return;

  const updatedProducts = products.filter(
    item => String(item.id) !== productId
  );

  saveProducts(updatedProducts);
  renderProducts();
});

// Search and category filtering
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("janoluxAdminLoggedIn");
  localStorage.removeItem("janoluxAdminEmail");
  window.location.href = "login.html";
});

// Mobile sidebar
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// Initial load
renderProducts();