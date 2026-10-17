
const API_URL = "https://janoluxbag.onrender.com/api/products";

// Protect admin page
if (localStorage.getItem("janoluxAdminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Get form elements
const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productDescription = document.getElementById("productDescription");
const mainImage = document.getElementById("mainImage");
const extraImages = document.getElementById("extraImages");
const productFeatured = document.getElementById("productFeatured");

const mainImagePreview = document.getElementById("mainImagePreview");
const extraImagesPreview = document.getElementById("extraImagesPreview");
const formMessage = document.getElementById("formMessage");

// Convert an image file into Base64
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));

    reader.readAsDataURL(file);
  });
}

// Preview main image
mainImage.addEventListener("change", () => {
  mainImagePreview.innerHTML = "";

  const file = mainImage.files[0];
  if (!file) return;

  const image = document.createElement("img");
  image.src = URL.createObjectURL(file);
  image.alt = "Main product preview";

  mainImagePreview.appendChild(image);
});

// Preview additional images
extraImages.addEventListener("change", () => {
  extraImagesPreview.innerHTML = "";

  Array.from(extraImages.files).forEach(file => {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Additional product preview";

    extraImagesPreview.appendChild(image);
  });
});

// Show status message
function showMessage(message, type = "success") {
  formMessage.textContent = message;

  if (type === "error") {
    formMessage.style.background = "#ffe5e5";
    formMessage.style.color = "#b00020";
  } else {
    formMessage.style.background = "#e7f7ed";
    formMessage.style.color = "#087f3d";
  }
}

// Submit product to MongoDB through Render
productForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = productName.value.trim();
  const category = productCategory.value;
  const price = Number(productPrice.value);
  const stock = Number(productStock.value);
  const description = productDescription.value.trim();
  const featured = productFeatured.checked;

  const mainFile = mainImage.files[0];
  const extraFiles = Array.from(extraImages.files);

  if (!name) {
    showMessage("Please enter the product name.", "error");
    return;
  }

  if (!category) {
    showMessage("Please select a product category.", "error");
    return;
  }

  if (
    productPrice.value.trim() === "" ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    showMessage("Please enter a valid product price.", "error");
    return;
  }

  if (
    productStock.value.trim() === "" ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    showMessage("Please enter a valid whole-number stock quantity.", "error");
    return;
  }

  if (!description) {
    showMessage("Please enter a product description.", "error");
    return;
  }

  if (!mainFile) {
    showMessage("Please select a main product image.", "error");
    return;
  }

  // Prevent excessively large image requests
  const allFiles = [mainFile, ...extraFiles];
  const totalBytes = allFiles.reduce((sum, file) => sum + file.size, 0);

  if (allFiles.some(file => !file.type.startsWith("image/"))) {
    showMessage("Please select image files only.", "error");
    return;
  }

  if (totalBytes > 5 * 1024 * 1024) {
    showMessage(
      "Please select images totalling no more than 5 MB. Smaller images work best.",
      "error"
    );
    return;
  }

  const submitButton = productForm.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  try {
    showMessage("Uploading product to MongoDB...");

    if (submitButton) submitButton.disabled = true;

    const mainImageData = await readImage(mainFile);
    const additionalImages = [];

    for (const file of extraFiles) {
      additionalImages.push(await readImage(file));
    }

    const product = {
      name,
      category,
      price,
      stock,
      description,
      image: mainImageData,
      images: additionalImages,
      featured
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || `Server returned error ${response.status}`
      );
    }

    showMessage("Product saved to MongoDB successfully!");

    productForm.reset();
    mainImagePreview.innerHTML = "";
    extraImagesPreview.innerHTML = "";

    setTimeout(() => {
      window.location.href = "products.html";
    }, 1200);

  } catch (error) {
    console.error("Product save error:", error);

    showMessage(
      error.message.includes("Failed to fetch")
        ? "Could not reach the product server. Check your internet connection and Render status."
        : `Unable to save product: ${error.message}`,
      "error"
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("janoluxAdminLoggedIn");
    localStorage.removeItem("janoluxAdminEmail");
    window.location.href = "login.html";
  });
}

// Mobile menu
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}
