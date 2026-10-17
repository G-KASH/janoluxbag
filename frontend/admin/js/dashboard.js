
const API_URL = "https://janoluxbag.onrender.com/api/products";

// Protect the dashboard page
if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Fetch products from MongoDB through the backend API
async function getProducts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Could not load products from the server.");
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error("The products API returned an unexpected response.");
  }

  return products;
}

// Update dashboard statistics
async function loadDashboard() {
  const recentProducts = document.getElementById("recentProducts");

  try {
    recentProducts.innerHTML = `
      <tr>
        <td colspan="4">Loading products...</td>
      </tr>
    `;

    const products = await getProducts();

    // Sort newest products first
    products.sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    document.getElementById("totalProducts").textContent =
      products.length;

    document.getElementById("featuredProducts").textContent =
      products.filter(product => product.featured === true).length;

    document.getElementById("inStockProducts").textContent =
      products.filter(product => Number(product.stock) > 0).length;

    document.getElementById("lowStockProducts").textContent =
      products.filter(product => Number(product.stock) <= 5).length;

    const latest = products.slice(0, 5);

    if (latest.length === 0) {
      recentProducts.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            No products found in the database yet.
          </td>
        </tr>
      `;
      return;
    }

    recentProducts.innerHTML = latest.map(product => `
      <tr>
        <td>${escapeHTML(product.name)}</td>
        <td>${escapeHTML(product.category)}</td>
        <td>KSh ${Number(product.price || 0).toLocaleString("en-KE")}</td>
        <td>${Number(product.stock) || 0}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Dashboard loading error:", error);

    // Avoid showing misleading zero statistics when the API fails
    ["totalProducts", "featuredProducts", "inStockProducts", "lowStockProducts"]
      .forEach(id => {
        document.getElementById(id).textContent = "—";
      });

    recentProducts.innerHTML = `
      <tr>
        <td colspan="4">
          Could not load products. Check your internet connection
          and try refreshing the page.
        </td>
      </tr>
    `;
  }
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

// Start loading the dashboard
loadDashboard();
