function MapLocation(e,o,t){var a=this;a.latLng={lat:e,lng:o},a.zoom=t||13}function initMap(){getInitialGeoLocation(),map=new google.maps.Map(document.getElementById("neighborhood-map"),{center:searchedCenter().latLng,mapTypeControl:!0,mapTypeControlOptions:{style:google.maps.MapTypeControlStyle.HORIZONTAL_BAR,position:google.maps.ControlPosition.TOP_RIGHT},zoom:searchedCenter().zoom}),(autocompleteAddress=new google.maps.places.Autocomplete(document.getElementById("autocomplete-address"),{types:["geocode"]})).addListener("place_changed",function(){var e=autocompleteAddress.getPlace();searchedCenter(new MapLocation(e.geometry.location.lat(),e.geometry.location.lng()))}),ko.applyBindings(new ViewModel(map))}function getInitialGeoLocation(){searchedCenter(googleAddress),navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(e){searchedCenter(new MapLocation(e.coords.latitude,e.coords.longitude))})}function handleErrors(e){alert(e)}var map,autocompleteAddress,googleAddress=new MapLocation(37.4224936,-122.0877586),searchedCenter=ko.observable(),ViewModel=function(e){var o=this;o.map=e,o.locationList=ko.observableArray(),o.searchRestaurants=function(){map.panTo(searchedCenter().latLng)}};