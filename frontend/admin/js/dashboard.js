
// Protect the dashboard
if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Get saved products
function getProducts() {
  try {
    const products = JSON.parse(
      localStorage.getItem("janoluxProducts") || "[]"
    );

    return Array.isArray(products) ? products : [];
  } catch (error) {
    return [];
  }
}

// Update dashboard statistics
function loadDashboard() {
  const products = getProducts();

  document.getElementById("totalProducts").textContent =
    products.length;

  document.getElementById("featuredProducts").textContent =
    products.filter(product => product.featured === true).length;

  document.getElementById("inStockProducts").textContent =
    products.filter(product => Number(product.stock) > 0).length;

  document.getElementById("lowStockProducts").textContent =
    products.filter(product => Number(product.stock) <= 5).length;

  const recentProducts = document.getElementById("recentProducts");

  const latest = products.slice(-5).reverse();

  if (latest.length === 0) {
    recentProducts.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          No products added yet.
        </td>
      </tr>
    `;
    return;
  }

  recentProducts.innerHTML = latest.map(product => `
    <tr>
      <td>${escapeHTML(product.name)}</td>
      <td>${escapeHTML(product.category)}</td>
      <td>KSh ${Number(product.price).toLocaleString("en-KE")}</td>
      <td>${Number(product.stock) || 0}</td>
    </tr>
  `).join("");
}

// Escape user-entered text before displaying it in HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

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

loadDashboard();