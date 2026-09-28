const showLogin = document.querySelector("#show-login");
const showRegister = document.querySelector("#show-register");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const accountMessage = document.querySelector("#account-message");

const apiUrl = "https://media2.edu.metropolia.fi/restaurant/api/v1";

showLogin.addEventListener("click", function () {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");

  showLogin.classList.add("active-tab");
  showRegister.classList.remove("active-tab");

  accountMessage.textContent = "";
});

showRegister.addEventListener("click", function () {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  showRegister.classList.add("active-tab");
  showLogin.classList.remove("active-tab");

  accountMessage.textContent = "";
});

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.querySelector("#register-username").value;

  const password = document.querySelector("#register-password").value;

  const email = document.querySelector("#register-email").value;

  const user = {
    username: username,
    password: password,
    email: email,
  };

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (response.ok) {
      accountMessage.textContent =
        "Registration successful. You can now login.";

      registerForm.reset();

      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");

      showLogin.classList.add("active-tab");
      showRegister.classList.remove("active-tab");
    } else {
      accountMessage.textContent = data.message || "Registration failed.";
    }
  } catch (error) {
    accountMessage.textContent = "Could not connect to the server.";
  }
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.querySelector("#login-username").value;

  const password = document.querySelector("#login-password").value;

  const user = {
    username: username,
    password: password,
  };

  accountMessage.textContent = "Logging in...";

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem("token", data.token);

      localStorage.setItem("username", data.data.username);

      accountMessage.textContent = "Login successful.";

      window.location.href = "index.html";
    } else {
      accountMessage.textContent =
        data.message || "Incorrect username or password.";
    }
  } catch (error) {
    accountMessage.textContent = "Could not connect to the server.";
  }
});
