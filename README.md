# Frontend Nanodegree Neighborhood Map
---------------------------------------
This is one of the project which comes from [Udacity](https://udacity.com/) [Front End Nanodegree](https://www.udacity.com/course/--nd001-cn-advanced).

## Goal
The goal of this project is to start a project from scratch, and delivered a complex enough web site which will use Google Map API and other third-party API to provide a fully function website to user.

More detialed project specification can be fund from [Project Specification](https://classroom.udacity.com/nanodegrees/nd001-cn-advanced/parts/7cfc9f99-e827-4ed3-8e13-126f6b0f3998/modules/b77eb95c-6b10-46dc-9269-354006cbc862/lessons/2711658591239847/concepts/26906985370923). [Project Rubic](https://review.udacity.com/#!/rubrics/17/view). 

## Check Result
This project is host by Github page, you can visit it from [HERE](https://hugo626.github.io/frontend-nanodegree-neighborhood-map/dist/).

Or you can run build and serve localy. 

## Build
### Build Environment
In order to build and serve the website locally you should:
1. Install [node.js](https://nodejs.org/en/download/) first on your machine. 
2. Install [Gulp](http://gulpjs.com/), 
   ```
   npm install gulp-cli -g
   ``` 
3. Go to the root folder of this project ```**/frontend-nanodegree-neighborhood-map/``` then run 
   ```
   npm install
   ```
If no error appears, then you are good to move to next step.
### Build Site 
To build this site, please run below command under the root folder of this project. 
```
  gulp
```
This command will remove contents in ```dist/``` folder, then minify css,js,html files and copied into ```dist/``` folder.

Below list of all defined ```gulp``` command:
```
gulp
   1. jshint                jshint task to check the js file
   2. copy-html             copy, minified and compressed html to dist/
   3. copy-js               copy, minified and compressed javascript to dist/js
   4. process-sass          complie scss file into css and put it to src/css, then compressed and minified css file to dist/css folder.
   5. clean                 remove the content of dist/ folder
   6. serve                 run server based on dist/ folder
```  
## Run on Local Machine
if you successfuly install and run through the build section, you should be ready for run the website on you machine. Since Gulp will run the local server on PORT 3000, so be sure the port is avaiable for use, or you can change the port number in [gulpfile.js](gulpfile.js).

To run server on you machine, please run below command under the root folder of this project.
```
gulp serve
```

This command basically will run ```gulp build``` first and then run server based on ```dist/``` folder. When ```gulp serve``` is ready, it should open the default browser in your machine to visit
```localhost:3000```. It is not opened automatically, please visit it by self.

## API and Thired Party Packages
1. **Google Map Javascript API**: [https://developers.google.com/maps/documentation/javascript/](https://developers.google.com/maps/documentation/javascript/), this project use Google Map API to display POI (restaurant) around user searched location.
2. **Google Map Javascript - Geocoder**: In order to get accurate enough Latitude and Longitude to get street view, we try to use the Geocoder to convert Restaurant's address to Latitude and Longitude.
3. **Google Map Javascript - Drawing Manager**: This website allow user to draw an polygon on the map to filter the restaurants. 
4. **KnockoutJS**: [knockoutjs](http://knockoutjs.com/index.html). This project is using KnockoutJS's MVVM pattern to display data from backend. 
5. **Foursquare API**: [https://developer.foursquare.com/](https://developer.foursquare.com/). This project, all POI (restaurant) around the user searched location is queried from Foursquare api. The name of restaurant, address, categories and rating will be dispalied in InforWindow when user click one of the location's marker.
6. **Material Design Lite**: [https://getmdl.io/index.html](https://getmdl.io/index.html). To make a beautiful and responsive UI, I also include Material Design Lite package to build up the GUI of website.

## Project structure
```
Project Root/
  +- dist/                               // A ready for deployed version, all files are minified.
  |    +- css/
  |    |   +- styles.css                 // Minified from src/css/styles.css
  |    +- js/
  |    |   +- app.js                     // Compressed,minfied and optimized from src/js/app.js
  |    +- index.html                     // Minified from src/index.html
  +- src/                                // A folder which contains the well formatted source code.
  |    +- css/
  |    |   +- styles.css                 // Generated from scss/styles.scss
  |    +- js/
  |    |   +- app.js                     // Js files contains KnockoutJS ViewModel and other functions.
  |    +- scss/
  |    |   +- styles.scss                // All css code is implemented in SCSS formatted.
  |    +- index.html
  +- .jshintrc
  +- gulpfile.js
  +- README.md
```
## License
This project is Copyright (c) 2017 Yuguo LI. It is free software, and may be redistributed under the terms specified in the [LICENSE](LICENSE) file.

## Screenshot
![Click, Drawing and InfoWindow](screenshot/neighbour-map1.gif "Click, Drawing and InfoWindow")
![Responsive Drawer](screenshot/neighbour-map2.gif "Responsive Drawer")
![Auto Complete Address Input and Search](screenshot/neighbour-map3.gif "Auto Complete Address Input and Search")
