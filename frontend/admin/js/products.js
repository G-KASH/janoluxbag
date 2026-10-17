
document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "https://janoluxbag.onrender.com/api/products";

  const productDetails = document.getElementById("productDetails");
  const breadcrumbName = document.getElementById("breadcrumbName");
  const cartCount = document.getElementById("cartCount");
  const year = document.getElementById("year");

  let cart = [];

  try {
    const savedCart = JSON.parse(
      localStorage.getItem("janoluxCart") || "[]"
    );
    cart = Array.isArray(savedCart) ? savedCart : [];
  } catch {
    cart = [];
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function updateCartCount() {
    if (cartCount) {
      cartCount.textContent = cart.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0
      );
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function showMessage(title, message) {
    if (breadcrumbName) breadcrumbName.textContent = title;

    if (productDetails) {
      productDetails.innerHTML = `
        <div class="product-not-found">
          <h2>${escapeHTML(title)}</h2>
          <p>${escapeHTML(message)}</p>
          <a href="index.html#shop" class="btn-primary">
            Continue Shopping
          </a>
        </div>
      `;
    }
  }

  updateCartCount();

  if (!productDetails) return;

  if (!productId) {
    showMessage("Product not found", "No product ID was provided in the link.");
    return;
  }

  let product;

  try {
    productDetails.innerHTML = "<p>Loading product...</p>";

    // First try fetching this product directly from MongoDB.
    let response = await fetch(
      `${API_URL}/${encodeURIComponent(productId)}`
    );

    if (response.ok) {
      product = await response.json();
    } else if (response.status === 404 || response.status === 400) {
      // Fallback: find it in the complete product list.
      response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load products from the server.");
      }

      const products = await response.json();

      if (!Array.isArray(products)) {
        throw new Error("The server returned an unexpected response.");
      }

      product = products.find(item =>
        String(item._id ?? item.id) === String(productId)
      );
    } else {
      throw new Error(`Product server returned ${response.status}.`);
    }
  } catch (error) {
    console.error("Product loading error:", error);

    showMessage(
      "Unable to load product",
      "Please check your internet connection and try again."
    );
    return;
  }

  if (!product) {
    showMessage(
      "Product not found",
      "This product is not available in the online store. Please return to the shop and try again."
    );
    return;
  }

  // MongoDB uses _id; the cart and page use id.
  product.id = String(product._id ?? product.id ?? productId);

  const price = Number(product.price) || 0;
  const stock = Math.max(0, Number(product.stock) || 0);

  const images = [
    product.image,
    ...(Array.isArray(product.images) ? product.images : [])
  ].filter(image =>
    typeof image === "string" && image.trim() !== ""
  );

  let activeImageIndex = 0;

  breadcrumbName.textContent = product.name || "Product";
  document.title = `${product.name || "Product"} | JANOLUXBAG`;

  function renderProduct() {
    const activeImage = images[activeImageIndex] || "";

    productDetails.innerHTML = `
      <div class="product-gallery">
        <div class="main-image-container">
          ${
            activeImage
              ? `<img
                   src="${escapeHTML(activeImage)}"
                   alt="${escapeHTML(product.name)}"
                   class="main-product-image"
                   id="mainProductImage"
                 >`
              : `<div class="no-product-image">
                   <i class="fas fa-image"></i>
                   <p>No image available</p>
                 </div>`
          }
        </div>

        ${
          images.length > 1
            ? `<div class="product-thumbnails">
                ${images.map((image, index) => `
                  <button
                    type="button"
                    class="thumbnail ${index === activeImageIndex ? "active" : ""}"
                    data-image-index="${index}"
                    aria-label="View product image ${index + 1}"
                  >
                    <img
                      src="${escapeHTML(image)}"
                      alt="${escapeHTML(product.name)} image ${index + 1}"
                    >
                  </button>
                `).join("")}
              </div>`
            : ""
        }
      </div>

      <div class="product-information">
        <p class="product-category">
          ${escapeHTML(product.category || "Fashion")}
        </p>

        ${product.featured ? '<span class="featured-label">Featured Product</span>' : ""}

        <h1>${escapeHTML(product.name || "Unnamed Product")}</h1>

        <p class="detail-price">KSh ${price.toLocaleString("en-KE")}</p>

        <p class="detail-stock ${stock > 0 ? "in-stock" : "out-of-stock"}">
          ${stock > 0 ? `${stock} available in stock` : "Currently out of stock"}
        </p>

        <div class="detail-description">
          <h3>Product Description</h3>
          <p>${escapeHTML(product.description || "Contact us for more information about this product.")}</p>
        </div>

        <div class="quantity-control">
          <label for="quantity">Quantity</label>
          <div class="quantity-buttons">
            <button type="button" id="decreaseQuantity" aria-label="Decrease quantity" ${stock === 0 ? "disabled" : ""}>−</button>
            <input
              type="number"
              id="quantity"
              value="1"
              min="1"
              max="${stock}"
              ${stock === 0 ? "disabled" : ""}
            >
            <button type="button" id="increaseQuantity" aria-label="Increase quantity" ${stock === 0 ? "disabled" : ""}>+</button>
          </div>
        </div>

        <button
          type="button"
          id="addToCartBtn"
          class="btn-primary add-to-cart-btn"
          ${stock === 0 ? "disabled" : ""}
        >
          <i class="fas fa-shopping-bag"></i>
          ${stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>

        <div id="productMessage" class="product-message" role="status"></div>

        <div class="product-benefits">
          <p><i class="fas fa-check-circle"></i> Quality fashion accessories</p>
          <p><i class="fas fa-truck"></i> Contact us for delivery details</p>
          <p><i class="fas fa-shield-alt"></i> Shop with confidence</p>
        </div>
      </div>
    `;

    const quantityInput = document.getElementById("quantity");

    document.getElementById("decreaseQuantity")?.addEventListener("click", () => {
      quantityInput.value = Math.max(
        1,
        Number(quantityInput.value || 1) - 1
      );
    });

    document.getElementById("increaseQuantity")?.addEventListener("click", () => {
      quantityInput.value = Math.min(
        stock,
        Number(quantityInput.value || 1) + 1
      );
    });

    quantityInput?.addEventListener("change", () => {
      let quantity = Number.parseInt(quantityInput.value, 10);

      if (!Number.isFinite(quantity)) quantity = 1;

      quantityInput.value = Math.min(stock, Math.max(1, quantity));
    });

    document.querySelectorAll(".thumbnail").forEach(button => {
      button.addEventListener("click", () => {
        activeImageIndex = Number(button.dataset.imageIndex);
        renderProduct();
      });
    });

    document.getElementById("addToCartBtn")?.addEventListener(
      "click",
      addToCart
    );
  }

  function addToCart() {
    const quantityInput = document.getElementById("quantity");
    const message = document.getElementById("productMessage");
    const quantity = Number.parseInt(quantityInput.value, 10);

    if (!Number.isInteger(quantity) || quantity < 1) {
      message.textContent = "Please enter a valid quantity.";
      return;
    }

    if (quantity > stock) {
      message.textContent = `Only ${stock} item(s) are available.`;
      return;
    }

    const existingItem = cart.find(
      item => String(item.id) === String(product.id)
    );

    const alreadyInCart = existingItem
      ? Number(existingItem.quantity || 0)
      : 0;

    if (alreadyInCart + quantity > stock) {
      message.textContent =
        `You can only add ${Math.max(0, stock - alreadyInCart)} more item(s) to your cart.`;
      return;
    }

    if (existingItem) {
      existingItem.quantity = alreadyInCart + quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price,
        image: product.image || "",
        quantity
      });
    }

    localStorage.setItem("janoluxCart", JSON.stringify(cart));
    updateCartCount();

    message.textContent = "Product added to your cart successfully.";
  }

  renderProduct();

  // Mobile navigation
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("active");
  });
});
