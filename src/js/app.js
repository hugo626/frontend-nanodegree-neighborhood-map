 /* globals $,ko,google*/

 /**
  * Global Variables whcih will be used cross between initMap function and ViewModel.
  */
 var map,
   googleAddress = {
     lat: 37.4224936,
     lng: -122.0877586
   }, //Google's address "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States"
   foursquareAPI = 'https://api.foursquare.com/v2/venues/explore?v=20170627&client_id=5FGAX5XB03JLW5CIP10XDGS1RBBKXRP5NU2CRG4SUSXVN42G&client_secret=UGUH4QH3A5RFUPXGVDCIFN2JIYZGQ4IZYEXSWFHT4UJA0TS2&query=food&ll=',
   searchedCenter = ko.observable(googleAddress);

 /**
  * The ViewModel which will be used to binding with index.html by using Knockout.js.
  * 
  * @param {object} googleMap The google map object which is created by google javascript library.
  */
 var ViewModel = function(googleMap) {
   var self = this;
   var streetViewInfowindow = new google.maps.InfoWindow(),
     geocoder = new google.maps.Geocoder(),
     // Initialize the drawing manager. 
     drawingManager = new google.maps.drawing.DrawingManager({
       drawingMode: google.maps.drawing.OverlayType.POLYGON,
       drawingControl: true,
       drawingControlOptions: {
         position: google.maps.ControlPosition.TOP_LEFT,
         drawingModes: [
           google.maps.drawing.OverlayType.POLYGON
         ]
       }
     }),
     // Create the autocomplete object, restricting the search to geographical
     // location types.
     autocompleteAddress = new google.maps.places.Autocomplete(
       (document.getElementById('autocomplete-address')), {
         types: ['geocode']
       });


   var polygon = null,
     // define the default Icon for normal Icon.
     defaultIcon = _makeMarkerIcon('0091ff'),
     // define the icon which will be used when user mouse hover ove the marker.
     highlightedIcon = _makeMarkerIcon('dd6666');

   self.map = googleMap;
   self.markerList = ko.observableArray();
   self.filteredMarkerList = ko.observableArray();
   self.selectedMarker = ko.observable();

   var _updateFilterMarkerList = function() {
     self.filteredMarkerList.removeAll();
     self.markerList().forEach(function(marker) {
       if (marker.getVisible()) {
         self.filteredMarkerList.push(marker);
       }
     });
   };

   /**
    * When user selected the address from input field, the address will be saved in 
    * searchCenter, so when user really press search button, we will call google api
    * and foursquare api to make the search.
    */
   autocompleteAddress.addListener('place_changed', function() {
     var place = autocompleteAddress.getPlace();
     if (place.geometry && place.geometry.location) {
       searchedCenter({
         lat: place.geometry.location.lat(),
         lng: place.geometry.location.lng()
       });
     } else {
       var newSearchCenter = _findAccurateLatLngByAddress(place.name);
       if (newSearchCenter) {
         searchedCenter(newSearchCenter);
       }else{
         _handleErrors("Unable to find the location you searched.\r\nPlease try use completed and formatted address.");
       }
     }
   });

   /**
    * The function to handle click event on the seacth button.
    * Tow section work will be done here: make the map center to user's search center.
    * Call foursquare api to seach restaurants around the user's searched address.
    */
   self.searchHandler = function() {
     map.panTo(searchedCenter());
     self.searchRestaurants();
   };

   /**
    * We would like to make the website a little bit smarter, so if we 
    * can accsee user's geolocation, then we will make the start loation
    * based on their location, otherwise, use the default location: Google's address.
    */
   self.getInitialGeoLocation = function() {
     self.searchHandler();
     if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(function(position) {
         searchedCenter({
           lat: position.coords.latitude,
           lng: position.coords.longitude
         });
         self.searchHandler();
       });
     }
   };

   /**
    * This function is mainly used to call foursquare's api to search the restaurants around 
    * user's search center address. For every found restaurant, we will generate a marker for it.
    */
   self.searchRestaurants = function() {
     $.ajax({
       url: foursquareAPI + searchedCenter().lat + ',' + searchedCenter().lng,
       context: document.body
     }).done(function(fourSquareData) {
       if (fourSquareData.meta.code === 200) {
         self.markerList.removeAll();
         _generateMakers(fourSquareData, streetViewInfowindow);
         _updateFilterMarkerList();
       } else {
         _handleErrors("No Venue found.");
       }
     }).fail(function(err) {
       _handleErrors('Fail to send request [' + err.statusText + '], please check your internet connection.');
     });
   };

   /**
    * When a marker was selected, firstly hide other markers, and then make the marker bounce while it was selected.
    * Also display the inforwidnow.
    */
   self.selectMarkerHandler = function(marker) {
     self.selectedMarker(marker);
     _toggleBounce(marker);
     _populateInfoWindow(marker, streetViewInfowindow);
     map.panTo(marker.position);
   };

   /**
    * Make the selected marker bounce, and make other unselected marker
    * stop bouncing. 
    * 
    * @param {any} selectedMarker 
    */
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

   /**
    * In order to make the street view even mroe accurate, we 
    * will use Google's geocode to convert the address (whcih is
    * queried from foursquare APi) into lat and lng.
    * 
    * @param {any} venueLocation the location which contains the address of the restaurant.
    * @returns any object which contains lat and lng of the given address.
    */
   function _findAccurateLatLngByAddress(address) {
     var location = null;
     geocoder.geocode({
       'address': address
     }, function(results, status) {
       if (status === google.maps.GeocoderStatus.OK) {
         location = results[0].geometry.location;
       } else {
         console.log('unable to find geocoder: ' + status);
       }
     });
     return location;
   }


   /**
    * This function will disable all markers from the map.
    */
   function _hideAllMarkers() {
     self.markerList().forEach(function(marker) {
       marker.setVisible(false);
     });
   }

   /**
    * Simply display an aler to show the error message to user. 
    * 
    * @param {any} errorMessage 
    */
   function _handleErrors(errorMessage) {
     alert(errorMessage);
   }

   self.getInitialGeoLocation();

   /**************************************************************************
    * Below the code is inspired by Google's example, so I used it as a skeleton to 
    * fill up my own code. 
    */
   /**
    * 
    * @param {any} fourSquareData the JSON object whcih is queried from foursquare API.
    * @param {any} infowindow The inforWindow object which is used to display the information of 
    *                         selected location.
    */
   function _generateMakers(fourSquareData, infowindow) {
     fourSquareData.response.groups[0].items.forEach(function(item, index) {
       var location = {
         lat: item.venue.location.lat,
         lng: item.venue.location.lng
       };
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
       marker.setMap(map);
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

     self.showAllMarkersHandler();
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
         '<div class="label">Rating:</div>' + '<div>' + marker.rating ? marker.rating : 'Rating is not specified.' + '</div></div>' +
         '<div class="infor-text-address">' +
         '<div class="label">Address"</div><div>';

       if (marker.address) {
         marker.address.forEach(function(addr) {
           content += '<div>' + addr + '</div>';
         });
       } else {
         content += '<div> Address is not specified.</div>';
       }
       content += '</div></div><div class="infor-text-categories">' +
         '<div class="label">Categories:</div>' +
         '<div>' + marker.categories ? marker.categories : 'Categories is not specified.' + '</div></div></div>';

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

   /**
    * This function will be used to show all markers on the map, when 
    * Drawer is toggole off.
    */
   self.showAllMarkersHandler = function() {
     var bounds = new google.maps.LatLngBounds();
     // Extend the boundaries of the map for each marker and display the marker
     self.markerList().forEach(function(marker) {
       marker.setVisible(true);
       bounds.extend(marker.position);
     });
     //  self.map.fitBounds(bounds);
     self.map.setCenter(bounds.getCenter());
     self.selectedMarker(null);
     _updateFilterMarkerList();
   };
   /***************************************************************** */

   /**************************************************************************
    * Below the code is COPIED from Google's example
    */
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
   self.toggleDrawingHandler = function() {
     if (drawingManager.map) {
       drawingManager.setMap(null);
       // In case the user drew anything, get rid of the polygon
       if (polygon !== null) {
         polygon.setMap(null);
       }
       self.showAllMarkersHandler();
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
         marker.setVisible(true);
       } else {
         marker.setVisible(false);
       }
     });
     _updateFilterMarkerList();
   }

   /**************************************************************************/
 };

 // initialize the map (Inspired by Google's example)
 function initMap() {
   map = new google.maps.Map(document.getElementById('neighborhood-map'), {
     center: searchedCenter(),
     mapTypeControl: true,
     mapTypeControlOptions: {
       style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
       position: google.maps.ControlPosition.TOP_RIGHT
     },
     zoom: 13
   });
   ko.applyBindings(new ViewModel(map)); // This makes Knockout get to work
 }

 function errorHandler() {
   document.getElementById('map-container').innerHTML = "<div><p>Unable to reach Google Map</p><p>Please contact with WebSite Admin.</p></div>";
 }