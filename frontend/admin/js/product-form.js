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


// Get existing products
function getProducts() {
  try {
    const products = JSON.parse(
      localStorage.getItem("janoluxProducts") || "[]"
    );

    return Array.isArray(products) ? products : [];
  } catch (error) {
    console.error("Could not load products:", error);
    return [];
  }
}


// Save products
function saveProducts(products) {
  localStorage.setItem(
    "janoluxProducts",
    JSON.stringify(products)
  );
}


// Convert an image file into a Base64 image
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));

    reader.readAsDataURL(file);
  });
}


// Show main image preview
mainImage.addEventListener("change", () => {
  mainImagePreview.innerHTML = "";

  const file = mainImage.files[0];

  if (!file) {
    return;
  }

  const image = document.createElement("img");

  image.src = URL.createObjectURL(file);
  image.alt = "Main product preview";

  mainImagePreview.appendChild(image);
});


// Show additional image previews
extraImages.addEventListener("change", () => {
  extraImagesPreview.innerHTML = "";

  const files = Array.from(extraImages.files);

  files.forEach(file => {
    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);
    image.alt = "Additional product preview";

    extraImagesPreview.appendChild(image);
  });
});


// Display message
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


// Submit product form
productForm.addEventListener("submit", async event => {
  event.preventDefault();

  // Get values
  const name = productName.value.trim();
  const category = productCategory.value;
  const price = Number(productPrice.value);
  const stock = Number(productStock.value);
  const description = productDescription.value.trim();
  const featured = productFeatured.checked;

  const mainFile = mainImage.files[0];
  const extraFiles = Array.from(extraImages.files);


  // Validation
  if (!name) {
    showMessage("Please enter the product name.", "error");
    return;
  }

  if (!category) {
    showMessage("Please select a product category.", "error");
    return;
  }

  if (!price || price < 0) {
    showMessage("Please enter a valid product price.", "error");
    return;
  }

  if (stock < 0 || Number.isNaN(stock)) {
    showMessage("Please enter a valid stock quantity.", "error");
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


  try {

    // Show saving message
    showMessage("Saving product...");


    // Convert main image
    const mainImageData = await readImage(mainFile);


    // Convert additional images
    const additionalImages = [];

    for (const file of extraFiles) {
      const imageData = await readImage(file);
      additionalImages.push(imageData);
    }


    // Create product
    const product = {
      id: Date.now().toString(),

      name: name,

      category: category,

      price: price,

      stock: stock,

      description: description,

      image: mainImageData,

      images: additionalImages,

      featured: featured,

      createdAt: new Date().toISOString()
    };


    // Get existing products
    const products = getProducts();


    // Add new product
    products.push(product);


    // Save
    saveProducts(products);


    // Success
    showMessage("Product added successfully!");


    // Reset form
    productForm.reset();

    mainImagePreview.innerHTML = "";
    extraImagesPreview.innerHTML = "";


    // Redirect to Manage Products
    setTimeout(() => {
      window.location.href = "products.html";
    }, 1000);


  } catch (error) {

    console.error("Product save error:", error);

    showMessage(
      "Unable to save the product. Your browser storage may be full.",
      "error"
    );
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