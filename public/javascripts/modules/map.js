import axios from "axios";
import { $ } from "./bling";

// where should the map show and at what magnification
// from Google Maps doc
const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 8,
};

const loadPlaces = (map, lat = 43.2, lng = -79.8) => {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then((res) => {
      const places = res.data;
      if (!places.length) {
        alert("no places found!");
        return;
      }

      // create a bounds - starts with a single point
      const bounds = new google.maps.LatLngBounds();
      // data for the map location
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map((place) => {
        // destructure the location from the coords within the data
        const [placeLng, placeLat] = place.location.coordinates;
        // create a position
        const position = { lat: placeLat, lng: placeLng };
        // include each additional point in the boundary
        bounds.extend(position);
        // create the marker
        const marker = new google.maps.Marker({
          map,
          position,
        });
        // assign the place to the marker
        marker.place = place;
        // return the marker to the map
        return marker;
      });

      // click on marker, show details of the place
      // addListener is google maps for addEventListener
      // create what we want to display in the info window in HTML - can style with CSS
      markers.forEach((marker) =>
        marker.addListener("click", function () {
          const html = `
        <div class="popup">
          <a href="/store/${this.place.slug}">
            <img src="/uploads/${this.place.photo || "store.png"}" alt="${
            this.place.name
          }" />
            <p><span style="font-weight: 400;">${this.place.name}</span> - ${
            this.place.location.address
          }</p>
          </a>
        </div>`;
          infoWindow.setContent(html);
          infoWindow.open(map, this);
        })
      );

      // then zoom the map to fit all the markers perfectly
      map.setCenter(bounds.getCenter()); // calculate the center
      map.fitBounds(bounds); // zoom in on the center
    })
    .catch((err) => console.error(err));
};

const makeMap = (mapDiv) => {
  if (!mapDiv) return;
  // make the map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    loadPlaces(
      map,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  });
};

export default makeMap;
