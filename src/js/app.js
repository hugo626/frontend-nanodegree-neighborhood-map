 /* globals $,ko,google*/

 var map, autocompleteAddress,
   googleAddress = new MapLocation( 37.4224936,-122.0877586, "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States"),
   foursquareAPI = 'https://api.foursquare.com/v2/venues/explore?v=20170627&client_id=5FGAX5XB03JLW5CIP10XDGS1RBBKXRP5NU2CRG4SUSXVN42G&client_secret=UGUH4QH3A5RFUPXGVDCIFN2JIYZGQ4IZYEXSWFHT4UJA0TS2&query=food&limit=20&ll=',
   searchedCenter = ko.observable(googleAddress);

 function MapLocation(lat, lng, address) {
   var self = this;
   self.latLng = {
     lat: lat,
     lng: lng
   };
   self.address = address;
 }

 // bind the resize event with hamburger button
 // Here's my data model
 var ViewModel = function(googleMap) {
   var self = this;
   var streetViewInfowindow = new google.maps.InfoWindow();
   var geocoder = new google.maps.Geocoder();

   self.map = googleMap;
   self.markerList = ko.observableArray();

   self.searchHandler = function() {
     map.panTo(searchedCenter().latLng);
     self.searchRestaurants();
   };

   self.getInitialGeoLocation = function() {
     if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(function(position) {
         searchedCenter(new MapLocation(position.coords.latitude, position.coords.longitude));
       });
     }
     self.searchHandler();
   };

   self.searchRestaurants = function() {
     $.ajax({
       url: foursquareAPI + searchedCenter().latLng.lat + ',' + searchedCenter().latLng.lng,
       context: document.body
     }).done(function(fourSquareData) {
       if (fourSquareData.meta.code === 200) {
         self.markerList.removeAll();
         _generateMakers(fourSquareData, streetViewInfowindow);
       } else {
         _handleErrors("No Venue found.");
       }
     }).fail(function(err) {
       self.handleErrors(err);
     });
   };

   function _generateMakers(fourSquareData, infowindow) {
     console.log(fourSquareData);

     fourSquareData.response.groups[0].items.forEach(function(item, index) {
       var location =  _findAccurateLatLngByAddress(item.venue.location);

       var marker = new google.maps.Marker({
         position: location,
         title: item.venue.name,
         animation: google.maps.Animation.DROP,
         id: index,
         address: item.venue.location.formattedAddress,
       });
       self.markerList.push(marker);
       // Create an onclick event to open the large infowindow at each marker.
       marker.addListener('click', function() {
         _populateInfoWindow(this, infowindow);
       });
     });

     _showMarkers();
   }

   function _populateInfoWindow(marker, infowindow) {
     // In case the status is OK, which means the pano was found, compute the
     // position of the streetview image, then calculate the heading, then get a
     // panorama from that and set the options
     function getStreetView(data, status) {
       if (status === google.maps.StreetViewStatus.OK) {
         var nearStreetViewLocation = data.location.latLng;
         var heading = google.maps.geometry.spherical.computeHeading(
           nearStreetViewLocation, marker.position);
         infowindow.setContent('<div>' + marker.title + '</div><div>' + marker.address + '</div><div>' + marker.position.lat() + ',' + marker.position.lng() + '</div><div id="pano"></div>');
         var panoramaOptions = {
           position: nearStreetViewLocation,
           pov: {
             heading: heading,
             pitch: 30
           }
         };
         var panorama = new google.maps.StreetViewPanorama(
           document.getElementById('pano'), panoramaOptions);
       } else {
         infowindow.setContent('<div>' + marker.title + '</div><div>' + marker.address + '</div><div>' + marker.position.lat() + ',' + marker.position.lng() + '</div>'+
           '<div>No Street View Found</div>');
       }
     }

     // Check to make sure the infowindow is not already opened on this marker.
     if (infowindow.marker !== marker) {
       // Clear the infowindow content to give the streetview time to load.
       infowindow.setContent('');
       infowindow.marker = marker;
       // Make sure the marker property is cleared if the infowindow is closed.
       infowindow.addListener('closeclick', function() {
         infowindow.marker = null;
       });
       var streetViewService = new google.maps.StreetViewService();
       var radius = 50;

       // Use streetview service to get the closest streetview image within
       // 50 meters of the markers position
       streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
       // Open the infowindow on the correct marker.
       infowindow.open(map, marker);
     }
   }

   function _findAccurateLatLngByAddress(venueLocation) {
     var location = {
       lat: venueLocation.lat,
       lng: venueLocation.lng
     };
     geocoder.geocode({
       'address': venueLocation.formattedAddress.join(' ')
     }, function(results, status) {
       if (status === google.maps.GeocoderStatus.OK) {
         location = results[0].geometry.location;
       } else {
         console.log('unable to find geocoder');
       }
     });
     return location;
   }

   function _showMarkers() {
     var bounds = new google.maps.LatLngBounds();
     // Extend the boundaries of the map for each marker and display the marker
     self.markerList().forEach(function(marker) {
       marker.setMap(self.map);
       bounds.extend(marker.position);
     });
     //  self.map.fitBounds(bounds);
     self.map.setCenter(bounds.getCenter());
   }

   function _handleErrors(errorMessage) {
     alert(errorMessage);
   }

   self.getInitialGeoLocation();
 };

 // initialize the map
 function initMap() {
   map = new google.maps.Map(document.getElementById('neighborhood-map'), {
     center: searchedCenter().latLng,
     mapTypeControl: true,
     mapTypeControlOptions: {
       style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
       position: google.maps.ControlPosition.TOP_RIGHT
     },
     zoom: 13
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
     searchedCenter(new MapLocation(place.geometry.location.lat(),place.geometry.location.lng()));
   });

   ko.applyBindings(new ViewModel(map)); // This makes Knockout get to work
 }