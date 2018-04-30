function initializeAutocomplete(id) {
  const element = document.getElementById(id);
  if (element) {
    const autocomplete = new google.maps.places.Autocomplete(element);
    google.maps.event.addListener(autocomplete, 'place_changed', () => {
      const place = autocomplete.getPlace();
      element.value = place.formatted_address;
    });
  }
}

function initAutocompleteEditProfile(){
  google.maps.event.addDomListener(window, 'load', () => {
    initializeAutocomplete('inputCurrentCity');
  });
}

function initAutocompleteExperience(){
  google.maps.event.addDomListener(window, 'load', () => {
    initializeAutocomplete('inputMeetingPointAddr');
  });
}
