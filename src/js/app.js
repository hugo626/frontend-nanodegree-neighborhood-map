 /* globals $,ko,google*/

 var map, autocompleteAddress,
   googleAddress = new MapLocation(37.4224936, -122.0877586),
   searchedCenter = ko.observable();

 function MapLocation(lat, lng, zoom) {
   var self = this;
   self.latLng = {
     lat: lat,
     lng: lng
   };
   self.zoom = zoom || 13;
 }

 // bind the resize event with hamburger button
 // Here's my data model
 var ViewModel = function(googleMap) {
   var self = this;
   self.map = googleMap;
   self.locationList = ko.observableArray();

   self.searchRestaurants = function() {
     map.panTo(searchedCenter().latLng);

   };

 };

 // initialize the map
 function initMap() {
   getInitialGeoLocation();
   map = new google.maps.Map(document.getElementById('neighborhood-map'), {
     center: searchedCenter().latLng,
     mapTypeControl: true,
     mapTypeControlOptions: {
       style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
       position: google.maps.ControlPosition.TOP_RIGHT
     },
     zoom: searchedCenter().zoom
   });
   // Create the autocomplete object, restricting the search to geographical
   // location types.
   autocompleteAddress = new google.maps.places.Autocomplete(
     (document.getElementById('autocomplete-address')), {
       types: ['geocode']
     });

   // When the user selects an address from the dropdown, populate the address
   // fields in the form.
   autocompleteAddress.addListener('place_changed', function() {
     var place = autocompleteAddress.getPlace();
     searchedCenter(new MapLocation(place.geometry.location.lat(), place.geometry.location.lng()));
   });

   ko.applyBindings(new ViewModel(map)); // This makes Knockout get to work
 }

 function getInitialGeoLocation() {
   searchedCenter(googleAddress);
   if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(function(position) {
       searchedCenter(new MapLocation(position.coords.latitude, position.coords.longitude));
     });
   }
 }


 function handleErrors(errorMessage) {
   alert(errorMessage);
 }