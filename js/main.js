const restaurantList = document.querySelector("#restaurant-list");
const search = document.querySelector("#search");
const cityFilter = document.querySelector("#city-filter");
const companyFilter = document.querySelector("#company-filter");
const restaurantCount = document.querySelector("#restaurant-count");
const resetButton = document.querySelector("#reset-button");

const apiUrl = "https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants";

let restaurants = [];

async function getRestaurants() {
  try {
    const response = await fetch(apiUrl);
    restaurants = await response.json();

    createCityOptions();
    showRestaurants(restaurants);
  } catch (error) {
    console.log("Restaurant error:", error);

    restaurantList.innerHTML = "<p>Could not load restaurants.</p>";
  }
}

function createCityOptions() {
  const cities = [];

  restaurants.forEach(function (restaurant) {
    if (!cities.includes(restaurant.city)) {
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
    restaurantList.innerHTML = "<p>No restaurants found.</p>";

    return;
  }

  restaurantArray.forEach(function (restaurant) {
    restaurantList.innerHTML += `
      <div class="restaurant">

        <h3>${restaurant.name}</h3>

        <p>${restaurant.address}</p>

        <p>${restaurant.city}</p>

        <p>${restaurant.company}</p>

        <button
          class="daily-button"
          data-id="${restaurant._id}">
          Daily Menu
        </button>

        <button
          class="weekly-button"
          data-id="${restaurant._id}">
          Weekly Menu
        </button>

        <div class="menu"></div>

      </div>
    `;
  });

  const dailyButtons = document.querySelectorAll(".daily-button");

  dailyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const restaurantId = button.dataset.id;

      const menuDiv = button.parentElement.querySelector(".menu");

      getDailyMenu(restaurantId, menuDiv);
    });
  });

  const weeklyButtons = document.querySelectorAll(".weekly-button");

  weeklyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const restaurantId = button.dataset.id;

      const menuDiv = button.parentElement.querySelector(".menu");

      getWeeklyMenu(restaurantId, menuDiv);
    });
  });
}

function filterRestaurants() {
  const searchText = search.value.toLowerCase();
  const selectedCity = cityFilter.value;
  const selectedCompany = companyFilter.value;

  const filteredRestaurants = restaurants.filter(function (restaurant) {
    const name = restaurant.name.toLowerCase();
    const city = restaurant.city.toLowerCase();

    const matchesSearch =
      name.includes(searchText) || city.includes(searchText);

    const matchesCity =
      selectedCity === "all" || restaurant.city === selectedCity;

    const matchesCompany =
      selectedCompany === "all" || restaurant.company === selectedCompany;

    return matchesSearch && matchesCity && matchesCompany;
  });

  showRestaurants(filteredRestaurants);
}

search.addEventListener("input", filterRestaurants);

cityFilter.addEventListener("change", filterRestaurants);

companyFilter.addEventListener("change", filterRestaurants);

resetButton.addEventListener("click", function () {
  search.value = "";
  cityFilter.value = "all";
  companyFilter.value = "all";

  showRestaurants(restaurants);
});

async function getDailyMenu(restaurantId, menuDiv) {
  const menuUrl = `${apiUrl}/daily/${restaurantId}/en`;

  try {
    const response = await fetch(menuUrl);
    const menu = await response.json();

    menuDiv.innerHTML = "<h4>Daily Menu</h4>";

    if (!menu.courses || menu.courses.length === 0) {
      menuDiv.innerHTML += "<p>No menu available today.</p>";

      return;
    }

    menu.courses.forEach(function (course) {
      menuDiv.innerHTML += `
        <div class="course">

          <p>
            <strong>${course.name}</strong>
          </p>

          <p>Price: ${course.price}</p>

          <p>Diets: ${course.diets || "-"}</p>

        </div>
      `;
    });
  } catch (error) {
    console.log("Daily menu error:", error);

    menuDiv.innerHTML = "<p>Could not load the daily menu.</p>";
  }
}

async function getWeeklyMenu(restaurantId, menuDiv) {
  const menuUrl = `${apiUrl}/weekly/${restaurantId}/en`;

  try {
    const response = await fetch(menuUrl);
    const menu = await response.json();

    menuDiv.innerHTML = "<h4>Weekly Menu</h4>";

    if (!menu.days || menu.days.length === 0) {
      menuDiv.innerHTML += "<p>No weekly menu available.</p>";

      return;
    }

    menu.days.forEach(function (day) {
      menuDiv.innerHTML += `
        <h4>${day.date}</h4>
      `;

      if (!day.courses || day.courses.length === 0) {
        menuDiv.innerHTML += "<p>No menu available for this day.</p>";

        return;
      }

      day.courses.forEach(function (course) {
        menuDiv.innerHTML += `
          <div class="course">

            <p>
              <strong>${course.name}</strong>
            </p>

            <p>Price: ${course.price}</p>

            <p>Diets: ${course.diets || "-"}</p>

          </div>
        `;
      });
    });
  } catch (error) {
    console.log("Weekly menu error:", error);

    menuDiv.innerHTML = "<p>Could not load the weekly menu.</p>";
  }
}

getRestaurants();
