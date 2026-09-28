const restaurantList = document.querySelector("#restaurant-list");
const search = document.querySelector("#search");
const cityFilter = document.querySelector("#city-filter");
const companyFilter = document.querySelector("#company-filter");
const favoriteFilter = document.querySelector("#favorite-filter");
const restaurantCount = document.querySelector("#restaurant-count");
const resetButton = document.querySelector("#reset-button");
const loginLink = document.querySelector("#login-link");
const profileLink = document.querySelector("#profile-link");
const logoutButton = document.querySelector("#logout-button");
const locationButton = document.querySelector("#location-button");
const locationMessage = document.querySelector("#location-message");
const restaurantMap = document.querySelector("#restaurant-map");
const mapRestaurantName = document.querySelector("#map-restaurant-name");
const mapRestaurantAddress = document.querySelector("#map-restaurant-address");
const removeSelectionButton = document.querySelector(
  "#remove-selection-button",
);

const apiUrl = "https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants";

let restaurants = [];
let nearestRestaurantId = "";
let selectedRestaurantId = "";

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

let favorites = [];

if (username) {
  const savedFavorites = localStorage.getItem("favorites-" + username);

  if (savedFavorites) {
    favorites = JSON.parse(savedFavorites);
  }
}

function checkLogin() {
  if (token && username) {
    loginLink.classList.add("hidden");
    profileLink.textContent = username;
    logoutButton.classList.remove("hidden");
  } else {
    loginLink.classList.remove("hidden");
    profileLink.textContent = "";
    logoutButton.classList.add("hidden");
  }
}

logoutButton.addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "index.html";
});

async function getRestaurants() {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Could not load restaurants.");
    }

    restaurants = await response.json();

    createCityOptions();
    showRestaurants(restaurants);
    showRestaurantsOnMap(restaurants, "All restaurant areas");
  } catch (error) {
    restaurantCount.textContent = "";

    restaurantList.innerHTML =
      '<p class="menu-message">Could not load restaurants.</p>';
  }
}

function createCityOptions() {
  const cities = [];

  restaurants.forEach(function (restaurant) {
    if (restaurant.city && !cities.includes(restaurant.city)) {
      cities.push(restaurant.city);
    }
  });

  cities.sort();

  cities.forEach(function (city) {
    cityFilter.innerHTML += `
      <option value="${city}">
        ${city}
      </option>
    `;
  });
}

function showRestaurants(restaurantArray) {
  restaurantList.innerHTML = "";

  restaurantCount.textContent = restaurantArray.length + " restaurants found";

  if (restaurantArray.length === 0) {
    restaurantList.innerHTML =
      '<p class="menu-message">No restaurants found.</p>';

    return;
  }

  restaurantArray.forEach(function (restaurant) {
    const isFavorite = favorites.includes(restaurant._id);

    const isNearest = restaurant._id === nearestRestaurantId;

    const isSelected = restaurant._id === selectedRestaurantId;

    let favoriteClass = "";
    let favoriteText = "☆";
    let nearestClass = "";
    let nearestLabel = "";
    let selectedClass = "";

    if (isFavorite) {
      favoriteClass = "favorite-active";
      favoriteText = "★";
    }

    if (isNearest) {
      nearestClass = "nearest-restaurant";

      nearestLabel = `
        <div class="nearest-label">
          Nearest Restaurant
        </div>
      `;
    }

    if (isSelected) {
      selectedClass = "selected-restaurant-card";
    }

    restaurantList.innerHTML += `
      <article
        class="restaurant ${nearestClass} ${selectedClass}"
        data-restaurant-id="${restaurant._id}"
      >
        ${nearestLabel}

        <div class="restaurant-top">
          <span class="company-badge">
            ${restaurant.company}
          </span>

          <button
            class="favorite-button ${favoriteClass}"
            data-id="${restaurant._id}"
            title="Favorite restaurant"
          >
            ${favoriteText}
          </button>
        </div>

        <h3>
          ${restaurant.name}
        </h3>

        <div class="restaurant-info">
          <p>
            ${restaurant.address}
          </p>

          <p>
            ${restaurant.postalCode || ""}
            ${restaurant.city}
          </p>
        </div>

        <div class="restaurant-actions">
          <button
            class="daily-button"
            data-id="${restaurant._id}"
          >
            Daily Menu
          </button>

          <button
            class="weekly-button"
            data-id="${restaurant._id}"
          >
            Weekly Menu
          </button>
        </div>

        <button
          class="map-button"
          data-id="${restaurant._id}"
        >
          View on Map
        </button>

        <div class="menu"></div>
      </article>
    `;
  });

  addRestaurantButtonEvents();
}

function addRestaurantButtonEvents() {
  const favoriteButtons = document.querySelectorAll(".favorite-button");

  favoriteButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      toggleFavorite(button.dataset.id);
    });
  });

  const dailyButtons = document.querySelectorAll(".daily-button");

  dailyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const restaurantCard = button.closest(".restaurant");

      const menuDiv = restaurantCard.querySelector(".menu");

      if (menuDiv.dataset.menu === "daily") {
        menuDiv.innerHTML = "";
        menuDiv.dataset.menu = "";
        button.textContent = "Daily Menu";

        return;
      }

      const weeklyButton = restaurantCard.querySelector(".weekly-button");

      weeklyButton.textContent = "Weekly Menu";

      menuDiv.dataset.menu = "daily";

      button.textContent = "Close Daily Menu";

      getDailyMenu(button.dataset.id, menuDiv);
    });
  });

  const weeklyButtons = document.querySelectorAll(".weekly-button");

  weeklyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const restaurantCard = button.closest(".restaurant");

      const menuDiv = restaurantCard.querySelector(".menu");

      if (menuDiv.dataset.menu === "weekly") {
        menuDiv.innerHTML = "";
        menuDiv.dataset.menu = "";
        button.textContent = "Weekly Menu";

        return;
      }

      const dailyButton = restaurantCard.querySelector(".daily-button");

      dailyButton.textContent = "Daily Menu";

      menuDiv.dataset.menu = "weekly";

      button.textContent = "Close Weekly Menu";

      getWeeklyMenu(button.dataset.id, menuDiv);
    });
  });

  const mapButtons = document.querySelectorAll(".map-button");

  mapButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const restaurant = restaurants.find(function (item) {
        return item._id === button.dataset.id;
      });

      if (restaurant) {
        selectedRestaurantId = restaurant._id;

        showRestaurants(getFilteredRestaurants());

        showRestaurantOnMap(restaurant);
      }
    });
  });
}

function toggleFavorite(restaurantId) {
  if (!token || !username) {
    window.location.href = "login.html";

    return;
  }

  if (favorites.includes(restaurantId)) {
    favorites = favorites.filter(function (id) {
      return id !== restaurantId;
    });
  } else {
    favorites.push(restaurantId);
  }

  localStorage.setItem("favorites-" + username, JSON.stringify(favorites));

  filterRestaurants();
}

function getFilteredRestaurants() {
  const searchText = search.value.toLowerCase().trim();

  const selectedCity = cityFilter.value;

  const selectedCompany = companyFilter.value;

  const selectedFavorite = favoriteFilter.value;

  return restaurants.filter(function (restaurant) {
    const name = restaurant.name.toLowerCase();

    const city = restaurant.city.toLowerCase();

    const matchesSearch =
      name.includes(searchText) || city.includes(searchText);

    const matchesCity =
      selectedCity === "all" || restaurant.city === selectedCity;

    const matchesCompany =
      selectedCompany === "all" || restaurant.company === selectedCompany;

    const matchesFavorite =
      selectedFavorite === "all" || favorites.includes(restaurant._id);

    return matchesSearch && matchesCity && matchesCompany && matchesFavorite;
  });
}

function filterRestaurants() {
  const filteredRestaurants = getFilteredRestaurants();

  showRestaurants(filteredRestaurants);
}

search.addEventListener("input", filterRestaurants);

companyFilter.addEventListener("change", filterRestaurants);

favoriteFilter.addEventListener("change", filterRestaurants);

cityFilter.addEventListener("change", function () {
  selectedRestaurantId = "";

  removeSelectionButton.classList.add("hidden");

  const filteredRestaurants = getFilteredRestaurants();

  showRestaurants(filteredRestaurants);

  if (cityFilter.value === "all") {
    showRestaurantsOnMap(filteredRestaurants, "All restaurant areas");
  } else {
    showRestaurantsOnMap(
      filteredRestaurants,
      cityFilter.value + " restaurants",
    );
  }
});

resetButton.addEventListener("click", function () {
  search.value = "";
  cityFilter.value = "all";
  companyFilter.value = "all";
  favoriteFilter.value = "all";

  nearestRestaurantId = "";
  selectedRestaurantId = "";

  locationMessage.textContent = "";

  removeSelectionButton.classList.add("hidden");

  showRestaurants(restaurants);

  showRestaurantsOnMap(restaurants, "All restaurant areas");
});

removeSelectionButton.addEventListener("click", function () {
  selectedRestaurantId = "";

  removeSelectionButton.classList.add("hidden");

  const filteredRestaurants = getFilteredRestaurants();

  showRestaurants(filteredRestaurants);

  if (cityFilter.value === "all") {
    showRestaurantsOnMap(filteredRestaurants, "All restaurant areas");
  } else {
    showRestaurantsOnMap(
      filteredRestaurants,
      cityFilter.value + " restaurants",
    );
  }
});

async function getDailyMenu(restaurantId, menuDiv) {
  const menuUrl = `${apiUrl}/daily/${restaurantId}/en`;

  menuDiv.innerHTML = '<p class="menu-message">Loading menu...</p>';

  try {
    const response = await fetch(menuUrl);

    if (menuDiv.dataset.menu !== "daily") {
      return;
    }

    if (!response.ok) {
      menuDiv.innerHTML = `
        <p class="menu-message">
          Daily menu is not available from this restaurant.
        </p>
      `;

      return;
    }

    const menu = await response.json();

    if (menuDiv.dataset.menu !== "daily") {
      return;
    }

    if (!menu.courses || menu.courses.length === 0) {
      menuDiv.innerHTML = `
        <p class="menu-message">
          Daily menu is not available from this restaurant.
        </p>
      `;

      return;
    }

    menuDiv.innerHTML = `
      <h4 class="menu-title">
        Daily Menu
      </h4>
    `;

    menu.courses.forEach(function (course) {
      menuDiv.innerHTML += `
          <div class="course">
            <p class="course-name">
              ${course.name}
            </p>

            <p>
              Price: ${course.price || "-"}
            </p>

            <p>
              Diets: ${course.diets || "-"}
            </p>
          </div>
        `;
    });
  } catch (error) {
    if (menuDiv.dataset.menu !== "daily") {
      return;
    }

    menuDiv.innerHTML = `
      <p class="menu-message">
        Could not load the daily menu.
      </p>
    `;
  }
}

async function getWeeklyMenu(restaurantId, menuDiv) {
  const menuUrl = `${apiUrl}/weekly/${restaurantId}/en`;

  menuDiv.innerHTML = '<p class="menu-message">Loading menu...</p>';

  try {
    const response = await fetch(menuUrl);

    if (menuDiv.dataset.menu !== "weekly") {
      return;
    }

    if (!response.ok) {
      menuDiv.innerHTML = `
        <p class="menu-message">
          Weekly menu is not available from this restaurant.
        </p>
      `;

      return;
    }

    const menu = await response.json();

    if (menuDiv.dataset.menu !== "weekly") {
      return;
    }

    if (!menu.days || menu.days.length === 0) {
      menuDiv.innerHTML = `
        <p class="menu-message">
          Weekly menu is not available from this restaurant.
        </p>
      `;

      return;
    }

    menuDiv.innerHTML = `
      <h4 class="menu-title">
        Weekly Menu
      </h4>

      <div class="weekly-menu"></div>
    `;

    const weeklyMenu = menuDiv.querySelector(".weekly-menu");

    menu.days.forEach(function (day) {
      let courses = "";

      if (day.courses && day.courses.length > 0) {
        day.courses.forEach(function (course) {
          courses += `
                <div class="weekly-course">
                  <p class="course-name">
                    ${course.name}
                  </p>

                  <p>
                    Price: ${course.price || "-"}
                  </p>

                  <p class="course-diets">
                    Diets: ${course.diets || "-"}
                  </p>
                </div>
              `;
        });
      } else {
        courses = `
            <p class="menu-message">
              No menu available.
            </p>
          `;
      }

      weeklyMenu.innerHTML += `
          <div class="weekly-day">
            <h4>
              ${day.date}
            </h4>

            ${courses}
          </div>
        `;
    });
  } catch (error) {
    if (menuDiv.dataset.menu !== "weekly") {
      return;
    }

    menuDiv.innerHTML = `
      <p class="menu-message">
        Could not load the weekly menu.
      </p>
    `;
  }
}

function getRestaurantsWithLocation(restaurantArray) {
  return restaurantArray.filter(function (restaurant) {
    return (
      restaurant.location &&
      restaurant.location.coordinates &&
      typeof restaurant.location.coordinates[0] === "number" &&
      typeof restaurant.location.coordinates[1] === "number"
    );
  });
}

function showRestaurantsOnMap(restaurantArray, title) {
  const mapRestaurants = getRestaurantsWithLocation(restaurantArray);

  if (mapRestaurants.length === 0) {
    mapRestaurantName.textContent = title;

    mapRestaurantAddress.textContent = "No restaurant locations available.";

    restaurantMap.src =
      "https://www.openstreetmap.org/export/embed.html?bbox=19.0%2C59.0%2C32.0%2C70.5&layer=mapnik";

    return;
  }

  const longitudes = mapRestaurants.map(function (restaurant) {
    return restaurant.location.coordinates[0];
  });

  const latitudes = mapRestaurants.map(function (restaurant) {
    return restaurant.location.coordinates[1];
  });

  let left = Math.min(...longitudes);

  let right = Math.max(...longitudes);

  let bottom = Math.min(...latitudes);

  let top = Math.max(...latitudes);

  if (left === right) {
    left -= 0.03;
    right += 0.03;
  } else {
    const longitudePadding = (right - left) * 0.15;

    left -= longitudePadding;
    right += longitudePadding;
  }

  if (bottom === top) {
    bottom -= 0.02;
    top += 0.02;
  } else {
    const latitudePadding = (top - bottom) * 0.15;

    bottom -= latitudePadding;
    top += latitudePadding;
  }

  const mapUrl =
    "https://www.openstreetmap.org/export/embed.html" +
    "?bbox=" +
    encodeURIComponent(`${left},${bottom},${right},${top}`) +
    "&layer=mapnik";

  restaurantMap.src = mapUrl;

  mapRestaurantName.textContent = title;

  mapRestaurantAddress.textContent =
    mapRestaurants.length + " restaurant locations in this view.";
}

function showRestaurantOnMap(restaurant) {
  if (!restaurant.location || !restaurant.location.coordinates) {
    locationMessage.textContent =
      "Location is not available for this restaurant.";

    return;
  }

  const longitude = restaurant.location.coordinates[0];

  const latitude = restaurant.location.coordinates[1];

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    locationMessage.textContent =
      "Location is not available for this restaurant.";

    return;
  }

  const distance = 0.01;

  const left = longitude - distance;

  const right = longitude + distance;

  const bottom = latitude - distance;

  const top = latitude + distance;

  const mapUrl =
    "https://www.openstreetmap.org/export/embed.html" +
    "?bbox=" +
    encodeURIComponent(`${left},${bottom},${right},${top}`) +
    "&layer=mapnik" +
    "&marker=" +
    encodeURIComponent(`${latitude},${longitude}`);

  restaurantMap.src = mapUrl;

  mapRestaurantName.textContent = restaurant.name;

  mapRestaurantAddress.textContent = `${restaurant.address}, ${restaurant.postalCode || ""} ${restaurant.city}`;

  removeSelectionButton.classList.remove("hidden");

  document.querySelector("#map-section").scrollIntoView({
    behavior: "smooth",
  });
}

locationButton.addEventListener("click", function () {
  if (!navigator.geolocation) {
    locationMessage.textContent = "Location is not supported by your browser.";

    return;
  }

  locationMessage.textContent = "Finding your location...";

  navigator.geolocation.getCurrentPosition(
    findNearestRestaurant,
    locationError,
  );
});

function findNearestRestaurant(position) {
  const userLatitude = position.coords.latitude;

  const userLongitude = position.coords.longitude;

  let nearestRestaurant = null;
  let shortestDistance = Infinity;

  restaurants.forEach(function (restaurant) {
    if (!restaurant.location || !restaurant.location.coordinates) {
      return;
    }

    const longitude = restaurant.location.coordinates[0];

    const latitude = restaurant.location.coordinates[1];

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return;
    }

    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      latitude,
      longitude,
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;

      nearestRestaurant = restaurant;
    }
  });

  if (!nearestRestaurant) {
    locationMessage.textContent = "Could not find a nearby restaurant.";

    return;
  }

  nearestRestaurantId = nearestRestaurant._id;

  selectedRestaurantId = nearestRestaurant._id;

  locationMessage.textContent = `Nearest: ${nearestRestaurant.name} - ${shortestDistance.toFixed(1)} km away`;

  showRestaurants(getFilteredRestaurants());

  showRestaurantOnMap(nearestRestaurant);
}

function calculateDistance(latitude1, longitude1, latitude2, longitude2) {
  const earthRadius = 6371;

  const latitudeDifference = degreesToRadians(latitude2 - latitude1);

  const longitudeDifference = degreesToRadians(longitude2 - longitude1);

  const firstLatitude = degreesToRadians(latitude1);

  const secondLatitude = degreesToRadians(latitude2);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function locationError(error) {
  if (error.code === 1) {
    locationMessage.textContent = "Location permission was denied.";
  } else if (error.code === 2) {
    locationMessage.textContent = "Your location is unavailable.";
  } else {
    locationMessage.textContent = "Could not get your location.";
  }
}

checkLogin();
getRestaurants();
