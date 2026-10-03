const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

// Temporary admin credentials
// We will move authentication to the backend later.
const ADMIN_EMAIL = "admin@janoluxbag.com";
const ADMIN_PASSWORD = "admin123";


// ================================
// TOGGLE PASSWORD
// ================================

togglePassword.addEventListener("click", () => {

  if (passwordInput.type === "password") {

    passwordInput.type = "text";

    togglePassword.textContent = "Hide";

  } else {

    passwordInput.type = "password";

    togglePassword.textContent = "Show";

  }

});


// ================================
// LOGIN
// ================================

loginForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginMessage.className = "login-message";
  loginMessage.textContent = "";


  // Check credentials
  if (
    email === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {

    // Save admin login session
    localStorage.setItem(
      "janoluxAdminLoggedIn",
      "true"
    );

    localStorage.setItem(
      "janoluxAdminEmail",
      email
    );


    loginMessage.textContent =
      "Login successful. Redirecting...";

    loginMessage.classList.add("success");


    // Redirect to dashboard
    setTimeout(() => {

      window.location.href = "dashboard.html";

    }, 800);


  } else {

    loginMessage.textContent =
      "Invalid email or password.";

    loginMessage.classList.add("error");

  }

});