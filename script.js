"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// |---------------------------------------------------------------------------------------|

// LeafLet API

class Workout {
  date = new Date();
  id = Date.now() + "".slice(-10);
  constructor(cords, distance, duration) {
    this.cords = cords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = "running";
  constructor(cords, distance, duration, cadence) {
    super(cords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(cords, distance, duration, elevationGain) {
    super(cords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speeds = this.distance / this.duration;
  }
}

// |---------------------------------------------------------------------------------------|

class App {
  #map;
  #mapEvent;
  #workOuts = [];
  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener("submit", this._newWorkOut.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener("click", this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        () => alert("click allow to access your location"),
        {
          enableHighAccuracy: true,
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const cords = [latitude, longitude];
    this.#map = L.map("map").setView(cords, 9);

    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 17,
        attribution:
          '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workOuts.forEach((work) => {
      this._renderWorkoutMaker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      "";
    form.classList.add("hidden");
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkOut(e) {
    e.preventDefault();

    // check input is Finite
    const validInputs = (...input) =>
      input.every((inp) => Number.isFinite(inp));
    // check whether postive
    const allPositive = (...input) => input.every((inp) => inp > 0);

    inputDistance.focus();

    // Get Data From Form
    const type = inputType.value;
    console.log(type);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // check whether Running or Cycling
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(
          "Fill in all the details and numbers has to be in positive integers"
        );

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance) ||
        !validInputs(duration) ||
        !validInputs(elevation)
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
      )
        return alert(
          "Fill in all the details and numbers has to be in positive integers"
        );
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add in to database
    this.#workOuts.push(workout);
    console.log(workout);

    // Render Workout on map as marker
    this._renderWorkoutMaker(workout);

    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkoutMaker(workout) {
    L.marker(workout.cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
  `;

    if (workout.type === "running")
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;

    if (workout.type === "cycling")
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speeds.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopUp(e) {
    const moveEl = e.target.closest(".workout");
    console.log(moveEl);

    if (!moveEl) return;

    const workout = this.#workOuts.find(
      (work) => work.id === moveEl.dataset.id
    );
    this.#map.setView(workout.cords, 10, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workOuts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));
    console.log(data);
    if (!data) return;

    this.#workOuts = data;

    this.#workOuts.forEach((work) => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem("workout");
    location.reload();
  }
}

document.querySelector(".reset").addEventListener("click", () => {
  app.reset();
});

const app = new App();
