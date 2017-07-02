 /* globals $,ko,google*/

 var map, autocompleteAddress,
   googleAddress = new MapLocation(37.4224936, -122.0877586, "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States"),
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
   // Initialize the drawing manager.
   var drawingManager = new google.maps.drawing.DrawingManager({
     drawingMode: google.maps.drawing.OverlayType.POLYGON,
     drawingControl: true,
     drawingControlOptions: {
       position: google.maps.ControlPosition.TOP_LEFT,
       drawingModes: [
         google.maps.drawing.OverlayType.POLYGON
       ]
     }
   });
   var polygon = null;
   // Style the markers a bit. This will be our listing marker icon.
   var defaultIcon = _makeMarkerIcon('0091ff');

   // Create a "highlighted location" marker color for when the user
   // mouses over the marker.
   var highlightedIcon = _makeMarkerIcon('dd6666');

   self.map = googleMap;
   self.markerList = ko.observableArray();
   self.selectedMarker = ko.observable();


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

   self.selectMarker = function(marker) {
     _hideAllMarkers();
     self.selectedMarker(marker);
     marker.setMap(map);
     _toggleBounce(marker);
     _populateInfoWindow(marker, streetViewInfowindow);
   };

   // Add an event listener so that the polygon is captured,  call the
   // searchWithinPolygon function. This will show the markers in the polygon,
   // and hide any outside of it.
   drawingManager.addListener('overlaycomplete', function(event) {
     // First, check if there is an existing polygon.
     // If there is, get rid of it and remove the markers
     if (polygon) {
       polygon.setMap(null);
       _hideAllMarkers();
     }
     // Switching the drawing mode to the HAND (i.e., no longer drawing).
     drawingManager.setDrawingMode(null);
     // Creating a new editable polygon from the overlay.
     polygon = event.overlay;
     polygon.setEditable(true);
     // Searching within the polygon.
     searchWithinPolygon();
     // Make sure the search is re-done if the poly is changed.
     polygon.getPath().addListener('set_at', searchWithinPolygon);
     polygon.getPath().addListener('insert_at', searchWithinPolygon);
   });


   // This shows and hides (respectively) the drawing options.
   self.toggleDrawing = function() {
     if (drawingManager.map) {
       drawingManager.setMap(null);
       // In case the user drew anything, get rid of the polygon
       if (polygon !== null) {
         polygon.setMap(null);
       }
     } else {
       drawingManager.setMap(map);
     }
   };

   // This function hides all markers outside the polygon,
   // and shows only the ones within it. This is so that the
   // user can specify an exact area of search.
   function searchWithinPolygon() {
     self.markerList().forEach(function(marker) {
       if (google.maps.geometry.poly.containsLocation(marker.position, polygon)) {
         marker.setMap(map);
       } else {
         marker.setMap(null);
       }
     });
   }

   function _generateMakers(fourSquareData, infowindow) {
     console.log(fourSquareData);

     fourSquareData.response.groups[0].items.forEach(function(item, index) {
       var location = _findAccurateLatLngByAddress(item.venue.location);

       var marker = new google.maps.Marker({
         position: location,
         title: item.venue.name,
         animation: google.maps.Animation.DROP,
         id: index,
         icon: defaultIcon,
         address: item.venue.location.formattedAddress,
         categories: item.venue.categories[0].name,
         rating: item.venue.rating
       });
       self.markerList.push(marker);
       // Create an onclick event to open the large infowindow at each marker.
       marker.addListener('click', function() {
         _populateInfoWindow(this, infowindow);
         _toggleBounce(this);
       });
       // Two event listeners - one for mouseover, one for mouseout,
       // to change the colors back and forth.
       marker.addListener('mouseover', function() {
         this.setIcon(highlightedIcon);
       });
       marker.addListener('mouseout', function() {
         this.setIcon(defaultIcon);
       });
     });

     self.showAllMarkers();
   }

   // This function takes in a COLOR, and then creates a new marker
   // icon of that color. The icon will be 21 px wide by 34 high, have an origin
   // of 0, 0 and be anchored at 10, 34).
   function _makeMarkerIcon(markerColor) {
     var markerImage = new google.maps.MarkerImage(
       'http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=restaurant|' + markerColor);
     return markerImage;
   }

   function _populateInfoWindow(marker, infowindow) {
     // In case the status is OK, which means the pano was found, compute the
     // position of the streetview image, then calculate the heading, then get a
     // panorama from that and set the options
     function getStreetView(data, status) {
       var content = '<div class="map-inforwindow">' +
         '<div class= "infor-text">' +
         '<div class="infor-text-title title">' + marker.title + '</div>' +
         '<div class="map-inforwindow infor-text-rating">' +
         '<div class="label">Rating:</div><div>' + marker.rating + '</div></div>' +
         '<div class="infor-text-address">' +
         '<div class="label">Address"</div>' +
         '<div><div>' + marker.address[0] + '</div><div>' + marker.address[1] + '</div><div>' + marker.address[2] + '</div></div></div>' +
         '<div class="infor-text-categories">' +
         '<div class="label">Categories:</div>' +
         '<div>' + marker.categories + '</div></div></div>';

       if (status === google.maps.StreetViewStatus.OK) {
         var nearStreetViewLocation = data.location.latLng;
         var heading = google.maps.geometry.spherical.computeHeading(
           nearStreetViewLocation, marker.position);
         infowindow.setContent(content + '<div id="pano"></div></div>');
         var panoramaOptions = {
           position: nearStreetViewLocation,
           pov: {
             heading: heading,
             pitch: 30
           }
         };
         var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
       } else {
         infowindow.setContent(content + '<div id="pano">No Street View Found</div><div>');
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
         marker.setAnimation(null);
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

   function _toggleBounce(selectedMarker) {
     self.markerList().forEach(function(marker) {
       if (marker === selectedMarker) {
         if (marker.getAnimation() !== null) {
           marker.setAnimation(null);
         } else {
           marker.setAnimation(google.maps.Animation.BOUNCE);
         }
       } else {
         marker.setAnimation(null);
       }
     });
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

   self.showAllMarkers = function() {
     var bounds = new google.maps.LatLngBounds();
     // Extend the boundaries of the map for each marker and display the marker
     self.markerList().forEach(function(marker) {
       marker.setMap(self.map);
       bounds.extend(marker.position);
     });
     //  self.map.fitBounds(bounds);
     self.map.setCenter(bounds.getCenter());
     self.selectedMarker(null);
   };

   // This function will loop through the listings and hide them all.
   function _hideAllMarkers() {
     self.markerList().forEach(function(marker) {
       marker.setMap(null);
     });
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
     searchedCenter(new MapLocation(place.geometry.location.lat(), place.geometry.location.lng()));
   });

   ko.applyBindings(new ViewModel(map)); // This makes Knockout get to work
 }