function initMap(){map=new google.maps.Map(document.getElementById("neighborhood-map"),{center:searchedCenter(),mapTypeControl:!0,mapTypeControlOptions:{style:google.maps.MapTypeControlStyle.HORIZONTAL_BAR,position:google.maps.ControlPosition.TOP_RIGHT},zoom:13}),ko.applyBindings(new ViewModel(map))}function errorHandler(){document.getElementById("map-container").innerHTML="<div><p>Unable to reach Google Map</p><p>Please contact with WebSite Admin.</p></div>"}var map,googleAddress={lat:37.4224936,lng:-122.0877586},foursquareAPI="https://api.foursquare.com/v2/venues/explore?v=20170627&client_id=5FGAX5XB03JLW5CIP10XDGS1RBBKXRP5NU2CRG4SUSXVN42G&client_secret=UGUH4QH3A5RFUPXGVDCIFN2JIYZGQ4IZYEXSWFHT4UJA0TS2&query=food&ll=",searchedCenter=ko.observable(googleAddress),ViewModel=function(e){function o(e){d.markerList().forEach(function(o){o===e?null!==o.getAnimation()?o.setAnimation(null):o.setAnimation(google.maps.Animation.BOUNCE):o.setAnimation(null)})}function t(e){var o={lat:e.lat,lng:e.lng};return g.geocode({address:e.formattedAddress.join(" ")},function(e,t){t===google.maps.GeocoderStatus.OK?o=e[0].geometry.location:console.log("unable to find geocoder: "+t)}),o}function n(){d.markerList().forEach(function(e){e.setVisible(!1)})}function a(e){alert(e)}function i(e,n){e.response.groups[0].items.forEach(function(e,a){var i=t(e.venue.location),r=new google.maps.Marker({position:i,title:e.venue.name,animation:google.maps.Animation.DROP,id:a,icon:f,address:e.venue.location.formattedAddress,categories:e.venue.categories[0].name,rating:e.venue.rating});r.setMap(map),d.markerList.push(r),r.addListener("click",function(){s(this,n),o(this)}),r.addListener("mouseover",function(){this.setIcon(v)}),r.addListener("mouseout",function(){this.setIcon(f)})}),d.showAllMarkersHandler()}function r(e){return new google.maps.MarkerImage("http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=restaurant|"+e)}function s(e,o){if(o.marker!==e){o.setContent(""),o.marker=e,o.addListener("closeclick",function(){o.marker=null,e.setAnimation(null)});(new google.maps.StreetViewService).getPanoramaByLocation(e.position,50,function(t,n){var a='<div class="map-inforwindow"><div class= "infor-text"><div class="infor-text-title title">'+e.title+'</div><div class="map-inforwindow infor-text-rating"><div class="label">Rating:</div><div>'+e.rating+'</div></div><div class="infor-text-address"><div class="label">Address"</div><div>';if(e.address&&e.address.forEach(function(e){a+="<div>"+e+"</div>"}),a+='</div></div><div class="infor-text-categories"><div class="label">Categories:</div><div>'+e.categories+"</div></div></div>",n===google.maps.StreetViewStatus.OK){var i=t.location.latLng,r=google.maps.geometry.spherical.computeHeading(i,e.position);o.setContent(a+'<div id="pano"></div></div>');var s={position:i,pov:{heading:r,pitch:30}};new google.maps.StreetViewPanorama(document.getElementById("pano"),s)}else o.setContent(a+'<div id="pano">No Street View Found</div><div>')}),o.open(map,e)}}function l(){d.markerList().forEach(function(e){google.maps.geometry.poly.containsLocation(e.position,m)?e.setVisible(!0):e.setVisible(!1)}),h()}var d=this,c=new google.maps.InfoWindow,g=new google.maps.Geocoder,p=new google.maps.drawing.DrawingManager({drawingMode:google.maps.drawing.OverlayType.POLYGON,drawingControl:!0,drawingControlOptions:{position:google.maps.ControlPosition.TOP_LEFT,drawingModes:[google.maps.drawing.OverlayType.POLYGON]}}),u=new google.maps.places.Autocomplete(document.getElementById("autocomplete-address"),{types:["geocode"]}),m=null,f=r("0091ff"),v=r("dd6666");d.map=e,d.markerList=ko.observableArray(),d.filteredMarkerList=ko.observableArray(),d.selectedMarker=ko.observable();var h=function(){d.filteredMarkerList.removeAll(),d.markerList().forEach(function(e){e.getVisible()&&d.filteredMarkerList.push(e)})};u.addListener("place_changed",function(){var e=u.getPlace();searchedCenter({lat:e.geometry.location.lat(),lng:e.geometry.location.lng()})}),d.searchHandler=function(){map.panTo(searchedCenter()),d.searchRestaurants()},d.getInitialGeoLocation=function(){d.searchHandler(),navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(e){searchedCenter({lat:e.coords.latitude,lng:e.coords.longitude}),d.searchHandler()})},d.searchRestaurants=function(){$.ajax({url:foursquareAPI+searchedCenter().lat+","+searchedCenter().lng,context:document.body}).done(function(e){200===e.meta.code?(d.markerList.removeAll(),i(e,c),h()):a("No Venue found.")}).fail(function(e){a("Fail to send request ["+e.statusText+"], please check your internet connection.")})},d.selectMarkerHandler=function(e){d.selectedMarker(e),o(e),s(e,c),map.panTo(e.position)},d.getInitialGeoLocation(),d.showAllMarkersHandler=function(){var e=new google.maps.LatLngBounds;d.markerList().forEach(function(o){o.setVisible(!0),e.extend(o.position)}),d.map.setCenter(e.getCenter()),d.selectedMarker(null),h()},p.addListener("overlaycomplete",function(e){m&&(m.setMap(null),n()),p.setDrawingMode(null),(m=e.overlay).setEditable(!0),l(),m.getPath().addListener("set_at",l),m.getPath().addListener("insert_at",l)}),d.toggleDrawingHandler=function(){p.map?(p.setMap(null),null!==m&&m.setMap(null)):p.setMap(map)}};