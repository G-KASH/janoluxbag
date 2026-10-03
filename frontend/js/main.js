
function displayProducts(items) {
  productGrid.innerHTML = "";

  resultCount.textContent =
    `${items.length} product${items.length === 1 ? "" : "s"} found`;

  emptyMessage.hidden = items.length > 0;

  items.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const badge = product.badge
      ? `<span class="product-badge">${product.badge}</span>`
      : "";

    card.innerHTML = `
      <div class="product-image">
        <a href="product.html?id=${product.id}">
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          >
        </a>
        ${badge}
      </div>

      <div class="product-info">
        <p class="product-category">${product.category}</p>

        <h3>
          <a href="product.html?id=${product.id}">
            ${product.name}
          </a>
        </h3>

        <p class="product-price">
          ${formatPrice(product.price)}
        </p>

        <a
          href="product.html?id=${product.id}"
          class="add-cart"
          style="text-align:center;text-decoration:none;"
        >
          View Product
        </a>
      </div>
    `;

    productGrid.appendChild(card);
  });
}