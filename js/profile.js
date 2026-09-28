const profileForm = document.querySelector("#profile-form");

const usernameInput = document.querySelector("#profile-username");

const emailInput = document.querySelector("#profile-email");

const passwordInput = document.querySelector("#profile-password");

const profileMessage = document.querySelector("#profile-message");

const avatarForm = document.querySelector("#avatar-form");

const avatarInput = document.querySelector("#avatar-input");

const avatarMessage = document.querySelector("#avatar-message");

const profilePictureBox = document.querySelector("#profile-picture-box");

const profilePlaceholder = document.querySelector("#profile-placeholder");

const removeAvatarButton = document.querySelector("#remove-avatar-button");

const apiUrl = "https://media2.edu.metropolia.fi/restaurant/api/v1";

const baseUrl = "https://media2.edu.metropolia.fi/restaurant";

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function getProfile() {
  try {
    const response = await fetch(`${apiUrl}/users/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await response.json();

    if (!response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");

      window.location.href = "login.html";

      return;
    }

    usernameInput.value = user.username || "";

    emailInput.value = user.email || "";

    if (user.username) {
      profilePlaceholder.textContent = user.username
        .substring(0, 2)
        .toUpperCase();
    }

    if (user.avatar) {
      showAvatar(user.avatar);
    } else {
      showPlaceholder();
    }
  } catch (error) {
    profileMessage.textContent = "Could not load your profile.";
  }
}

function getProfilePicture() {
  return document.querySelector("#profile-picture");
}

function createProfilePicture() {
  let profilePicture = getProfilePicture();

  if (!profilePicture) {
    profilePicture = document.createElement("img");

    profilePicture.id = "profile-picture";

    profilePicture.className = "profile-picture";

    profilePicture.alt = "Profile picture";

    profilePictureBox.appendChild(profilePicture);
  }

  return profilePicture;
}

function showAvatar(avatar) {
  const profilePicture = createProfilePicture();

  if (avatar.startsWith("http")) {
    profilePicture.src = avatar;
  } else {
    profilePicture.src = `${baseUrl}/uploads/${avatar}`;
  }

  profilePicture.classList.remove("hidden");

  profilePlaceholder.classList.add("hidden");

  removeAvatarButton.classList.remove("hidden");
}

function showPlaceholder() {
  const profilePicture = getProfilePicture();

  if (profilePicture) {
    profilePicture.remove();
  }

  profilePlaceholder.classList.remove("hidden");

  removeAvatarButton.classList.add("hidden");
}

profileForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const updatedUser = {
    username: usernameInput.value,
    email: emailInput.value,
  };

  if (passwordInput.value) {
    updatedUser.password = passwordInput.value;
  }

  profileMessage.textContent = "Saving changes...";

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUser),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("username", usernameInput.value);

      profilePlaceholder.textContent = usernameInput.value
        .substring(0, 2)
        .toUpperCase();

      passwordInput.value = "";

      profileMessage.textContent = "Profile updated successfully.";
    } else {
      profileMessage.textContent =
        data.message || "Could not update your profile.";
    }
  } catch (error) {
    profileMessage.textContent = "Could not connect to the server.";
  }
});

avatarInput.addEventListener("change", function () {
  const file = avatarInput.files[0];

  if (!file) {
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  const profilePicture = createProfilePicture();

  profilePicture.src = imageUrl;

  profilePicture.classList.remove("hidden");

  profilePlaceholder.classList.add("hidden");

  avatarMessage.textContent = "Picture selected. Click Upload Picture.";
});

avatarForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const file = avatarInput.files[0];

  if (!file) {
    avatarMessage.textContent = "Please choose a picture first.";

    return;
  }

  const formData = new FormData();

  formData.append("avatar", file);

  avatarMessage.textContent = "Uploading picture...";

  try {
    const response = await fetch(`${apiUrl}/users/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      avatarMessage.textContent = "Profile picture uploaded successfully.";

      avatarInput.value = "";

      if (data.data && data.data.avatar) {
        showAvatar(data.data.avatar);
      }
    } else {
      avatarMessage.textContent =
        data.message || data.error || "Could not upload profile picture.";
    }
  } catch (error) {
    avatarMessage.textContent = "Could not connect to the server.";
  }
});

removeAvatarButton.addEventListener("click", async function () {
  avatarMessage.textContent = "Removing picture...";

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        avatar: "",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showPlaceholder();

      avatarInput.value = "";

      avatarMessage.textContent = "Profile picture removed.";
    } else {
      avatarMessage.textContent =
        data.message || "Could not remove profile picture.";
    }
  } catch (error) {
    avatarMessage.textContent = "Could not connect to the server.";
  }
});

getProfile();
