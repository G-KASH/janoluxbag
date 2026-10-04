// Protect the page
if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const form = document.getElementById("editProductForm");
const mainImageInput = document.getElementById("mainImage");
const extraImagesInput = document.getElementById("extraImages");
const currentMainPreview = document.getElementById("currentMainPreview");
const newMainPreview = document.getElementById("newMainPreview");
const currentExtraPreview = document.getElementById("currentExtraPreview");
const newExtraPreview = document.getElementById("newExtraPreview");
const formMessage = document.getElementById("formMessage");

const MAX_IMAGE_SIZE = 1024 * 1024;
const MAX_EXTRA_IMAGES = 4;

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let currentProduct = null;

// Load saved products
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

// Escape text for HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Show a message
function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

// Render an image preview safely
function addPreview(container, src, alt) {
  if (!src) return;

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  container.appendChild(img);
}

// Load product details into the form
function loadProduct() {
  if (!productId) {
    showMessage("No product was selected.", "error");
    form.querySelector("button[type='submit']").disabled = true;
    return;
  }

  const products = getProducts();

  currentProduct = products.find(
    product => String(product.id) === productId
  );

  if (!currentProduct) {
    showMessage("Product not found. It may have been deleted.", "error");
    form.querySelector("button[type='submit']").disabled = true;
    return;
  }

  document.getElementById("productName").value = currentProduct.name || "";
  document.getElementById("productCategory").value = currentProduct.category || "";
  document.getElementById("productPrice").value = currentProduct.price ?? "";
  document.getElementById("productStock").value = currentProduct.stock ?? 0;
  document.getElementById("productDescription").value = currentProduct.description || "";
  document.getElementById("productFeatured").checked = currentProduct.featured === true;

  addPreview(currentMainPreview, currentProduct.image, "Current main product image");

  (currentProduct.images || []).forEach(image => {
    addPreview(currentExtraPreview, image, "Current additional product image");
  });
}

// Read an image file
function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`${file.name} is not an image.`));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(`${file.name} is larger than 1 MB. Choose a smaller image.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read an image."));
    reader.readAsDataURL(file);
  });
}

// Preview replacement main image
mainImageInput.addEventListener("change", async () => {
  newMainPreview.innerHTML = "";

  const file = mainImageInput.files[0];
  if (!file) return;

  try {
    const image = await readImage(file);
    addPreview(newMainPreview, image, "New main product image");
  } catch (error) {
    showMessage(error.message, "error");
    mainImageInput.value = "";
  }
});

// Preview new additional images
extraImagesInput.addEventListener("change", async () => {
  newExtraPreview.innerHTML = "";

  const files = Array.from(extraImagesInput.files);

  if (files.length > MAX_EXTRA_IMAGES) {
    showMessage(`Select no more than ${MAX_EXTRA_IMAGES} new images.`, "error");
    extraImagesInput.value = "";
    return;
  }

  try {
    for (const file of files) {
      const image = await readImage(file);
      addPreview(newExtraPreview, image, "New additional product image");
    }
  } catch (error) {
    showMessage(error.message, "error");
    extraImagesInput.value = "";
    newExtraPreview.innerHTML = "";
  }
});

// Save changes
form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentProduct) return;

  formMessage.className = "form-message";

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const description = document.getElementById("productDescription").value.trim();
  const featured = document.getElementById("productFeatured").checked;

  const extraFiles = Array.from(extraImagesInput.files);

  if (!name || !category || !description) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (!Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    showMessage("Enter a valid price and whole-number stock quantity.", "error");
    return;
  }

  if (extraFiles.length > MAX_EXTRA_IMAGES) {
    showMessage(`Select no more than ${MAX_EXTRA_IMAGES} new images.`, "error");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  try {
    let mainImage = currentProduct.image;

    if (mainImageInput.files[0]) {
      mainImage = await readImage(mainImageInput.files[0]);
    }

    const newImages = [];

    for (const file of extraFiles) {
      newImages.push(await readImage(file));
    }

    const updatedProduct = {
      ...currentProduct,
      name,
      category,
      price,
      stock,
      description,
      featured,
      image: mainImage,
      images: [...(currentProduct.images || []), ...newImages],
      updatedAt: new Date().toISOString()
    };

    const products = getProducts().map(product =>
      String(product.id) === productId ? updatedProduct : product
    );

    localStorage.setItem("janoluxProducts", JSON.stringify(products));

    showMessage("Product updated successfully!", "success");

    setTimeout(() => {
      window.location.href = "products.html";
    }, 900);

  } catch (error) {
    showMessage(
      error.name === "QuotaExceededError"
        ? "Browser storage is full. Try smaller images or remove some products."
        : error.message || "Unable to update product.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save Changes";
  }
});

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

loadProduct();