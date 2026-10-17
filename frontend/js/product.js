
document.addEventListener("DOMContentLoaded", async () => {
  const productDetails = document.getElementById("productDetails");
  const breadcrumbName = document.getElementById("breadcrumbName");
  const cartCount = document.getElementById("cartCount");
  const year = document.getElementById("year");

  const API_URL = "https://janoluxbag.onrender.com/api/products";
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (year) year.textContent = new Date().getFullYear();

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem("janoluxCart") || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function updateCartCount() {
    if (cartCount) {
      cartCount.textContent = readCart().reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function showMessage(title, message) {
    if (!productDetails) return;

    productDetails.innerHTML = `
      <div class="product-not-found">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        <a href="index.html" class="btn-primary">Continue Shopping</a>
      </div>
    `;
  }

  updateCartCount();

  if (!productDetails) {
    console.error("Missing #productDetails in product.html");
    return;
  }

  if (!productId) {
    showMessage("Product not selected", "Please return to the shop and select a product.");
    return;
  }

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Product API returned ${response.status}`);
    }

    const data = await response.json();
    const products = Array.isArray(data)
      ? data
      : Array.isArray(data.products)
        ? data.products
        : [];

    const product = products.find(item =>
      String(item._id ?? item.id) === String(productId)
    );

    if (!product) {
      if (breadcrumbName) breadcrumbName.textContent = "Product not found";
      showMessage("Product Not Found", "This product may have been removed or the link is incorrect.");
      return;
    }

    // MongoDB products use _id; the cart needs a consistent id.
    product.id = String(product._id ?? product.id);

    const price = Number(product.price) || 0;
    const stock = Math.max(0, Number(product.stock) || 0);

    const images = [
      product.image,
      ...(Array.isArray(product.images) ? product.images : [])
    ].filter(image => typeof image === "string" && image.trim());

    let activeImage = images[0] || "";

    if (breadcrumbName) {
      breadcrumbName.textContent = product.name || "Product";
    }

    document.title = `${product.name || "Product"} | JANOLUXBAG`;

    function renderProduct() {
      productDetails.innerHTML = `
        <div class="product-gallery">
          <div class="main-image-container">
            ${
              activeImage
                ? `<img src="${escapeHTML(activeImage)}"
                        alt="${escapeHTML(product.name)}"
                        class="main-product-image"
                        id="mainProductImage">`
                : `<div class="no-product-image">
                     <p>No image available</p>
                   </div>`
            }
          </div>

          ${
            images.length > 1
              ? `<div class="product-thumbnails">
                  ${images.map((image, index) => `
                    <button type="button"
                            class="thumbnail ${image === activeImage ? "active" : ""}"
                            data-image-index="${index}">
                      <img src="${escapeHTML(image)}"
                           alt="${escapeHTML(product.name)} image ${index + 1}">
                    </button>
                  `).join("")}
                </div>`
              : ""
          }
        </div>

        <div class="product-information">
          <p class="product-category">${escapeHTML(product.category || "Fashion")}</p>
          ${product.featured ? "<span class='featured-label'>Featured Product</span>" : ""}
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
              <button type="button" id="decreaseQuantity" ${stock === 0 ? "disabled" : ""}>−</button>
              <input type="number" id="quantity" value="1" min="1" max="${stock}" ${stock === 0 ? "disabled" : ""}>
              <button type="button" id="increaseQuantity" ${stock === 0 ? "disabled" : ""}>+</button>
            </div>
          </div>

          <button type="button" id="addToCartBtn" class="btn-primary add-to-cart-btn" ${stock === 0 ? "disabled" : ""}>
            ${stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>

          <p id="productMessage" class="product-message" role="status"></p>

          <div class="product-benefits">
            <p>Quality fashion accessories</p>
            <p>Contact us for delivery details</p>
            <p>Shop with confidence</p>
          </div>
        </div>
      `;

      const quantityInput = document.getElementById("quantity");

      document.getElementById("decreaseQuantity").addEventListener("click", () => {
        quantityInput.value = Math.max(1, Number(quantityInput.value || 1) - 1);
      });

      document.getElementById("increaseQuantity").addEventListener("click", () => {
        quantityInput.value = Math.min(stock, Number(quantityInput.value || 1) + 1);
      });

      quantityInput.addEventListener("change", () => {
        let quantity = parseInt(quantityInput.value, 10);
        if (!Number.isFinite(quantity)) quantity = 1;
        quantityInput.value = Math.min(stock, Math.max(1, quantity));
      });

      document.querySelectorAll(".thumbnail").forEach(button => {
        button.addEventListener("click", () => {
          activeImage = images[Number(button.dataset.imageIndex)];
          renderProduct();
        });
      });

      document.getElementById("addToCartBtn").addEventListener("click", addToCart);
    }

    function addToCart() {
      const quantity = parseInt(document.getElementById("quantity").value, 10);
      const message = document.getElementById("productMessage");

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
        message.textContent = `Please select a quantity between 1 and ${stock}.`;
        return;
      }

      const cart = readCart();
      const existing = cart.find(item => String(item.id) === product.id);
      const currentQuantity = Number(existing?.quantity || 0);

      if (currentQuantity + quantity > stock) {
        message.textContent = `Only ${Math.max(0, stock - currentQuantity)} more item(s) can be added.`;
        return;
      }

      if (existing) {
        existing.quantity = currentQuantity + quantity;
        existing.name = product.name;
        existing.price = price;
        existing.image = product.image || "";
      } else {
        cart.push({
          id: product.id,
          name: product.name || "Product",
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
  } catch (error) {
    console.error("Unable to load product details:", error);
    showMessage(
      "Unable to load product",
      "Please check your internet connection and try again."
    );
  }
});
