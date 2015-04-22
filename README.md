# Peat

> Transform your Google Maps images into beautiful interactive embeds.

# What's it?

![Hire me!](https://maps.googleapis.com/maps/api/staticmap?center=Edinburgh,+United+Kingdom&zoom=13&size=364x182&maptype=terrain&markers=size:mid%7Ccolor:0x006341%7Clabel:S%7C55.9510567,-3.2036655%7C55.9498952,-3.1882087%7C55.9531544,-3.1997905&markers=Edinburgh+Castle,+Castlehill,+Edinburg,+United+Kingdom&path=color:0x0065BD%7Cenc:qgotIrqjRtGfo%40dFfn%40tC%60_%40nBlRv%40~X&style=visibility:simplified)![Hire me!](https://maps.googleapis.com/maps/api/streetview?size=364x182&location=55.948437,-3.194501&heading=33&fov=90&pitch=3)

`Peat` is a way of introducing a progressive enhancement in the use of Google Maps.

The objective is to offer a first experience as simple as possible with a static representation of a Google Maps or a Street View panorama (via [Image APIs](https://developers.google.com/maps/documentation/imageapis/)) and to transform it later on into a dynamic one.
All of this happens without any further external informations (in most cases) and especially when you choose to do it.

`Peat` will help you decode the embed URL params, fetch the Google Maps JavaScript API on demand and it will let you improve the visualisation by handling preformatted data as you wish. 

Why should you load unnecessary ressources if users don't want to interact with it?

# Examples

## Simple transformation

```js
var g = new Peat("#DùnÈideannMap")
```

**Notice**: not yet implemented

## Use preformatted data to improve visualisation

```js
var g = new Peat("#DùnÈideannMap", function (g) {
    var data = g.getMapData()

    g.map.setOptions(data.mapOptions)

    data.markerOptions.forEach(function (options) {
        options["animation"] = google.maps.Animation.DROP
        options["icon"] = "http://example.scot/assets/img/ico-starbucks.png"

        var marker = new google.maps.Marker(options)
        marker.setMap(g.map)
    })

    g.img.parentNode.replaceChild(g.div, g.img)
})
```

## Require the Pegman's help when you really need

```js
var img = document.getElementById("VictoriaStView")

img.addEvenListener("click", function (event) {
    var p = new Peat(this, function (p) {
        var opts = p.getStreetViewPanoramaOptions()

        p.map.setOptions(opts)
        p.img.parentNode.replaceChild(p.div, p.img)
    })
})
```

## Enjoy to the support of GeoJSON 

```js
var g = new Peat("#DùnÈideannMap", function (g) {
    var geoJSON = g.getMapGeoJson()

    g.map.setOptions(geoJSON.metadata.options)
    g.map.data.addGeoJson(geoJSON)

    g.img.parentNode.replaceChild(g.div, g.img)
})
```

# JavaScript API

## `new Peat(img[, callback])`

```js
var g = new Peat("#DùnÈideannMap")

// play and use any of the other documented API methods
```

## `getImageParams()`

Returns a key/value object with all GET query arguments contained in the URL.

```js
var g = new Peat("#DùnÈideannMap")

g.getImageParams()

// -> {
// ->   center: "Edinburgh, United Kingdom",
// ->   zoom: "13",
// ->   size: "364x182",
// ->   maptype: "terrain",
// ->   markers: [
// ->     "size:mid|color:0x006341|label:S|55.9510567,-3.2036655|…",
// ->     "Edinburgh Castle, Castlehill, Edinburg, United Kingdom"
// ->   ],
// ->   path: [
// ->     "color:0x0065BD|enc:qgotIrqjRtGfo@dFfn@tC`_@nBlRv@~X"
// ->   ],
// ->   style: [
// ->     "visibility:simplified"
// ->   ]
// -> }
```

## `getMapData()`

Returns an expanded object of all collections needed to play with the Google Maps API.

```js
var g = new Peat("#DùnÈideannMap")

g.getMapData()

// -> {
// ->   mapOptions: {center:{lat:55.953252, lng:-3.188267}, zoom:13, mapTypeId:"terrain"},
// ->   mapTypeStyle: [{stylers:[{visibility:"simplified"}]}],
// ->   markerOptions: [{position:{lat:55.9510567, lng:-3.2036655}}, …],
// ->   polylineOptions: [{path:[{lat:55.95273, lng:-3.17226}, …], strokeColor:"#ffd700", strokeOpacity:0.5}]
// -> }
```

## `getMapGeoJson()`

Returns a GeoJSON object to display markers, polylines and polygons in an easy way with the help of `google.maps.Data` class.

```js
var g = new Peat("#DùnÈideannMap")

g.getMapGeoJson()

// -> {
// ->   type: "FeatureCollection",
// ->   metadata: {
// ->       url: "https://maps.googleapis.com/maps/api/staticmap?…",
// ->       title: "",
// ->       options: {center:{lat:55.953252, lng:-3.188267}, zoom:13, maptype:"terrain"},
// ->       style: [{stylers:[{visibility:"simplified"}]}]
// ->   }
// ->   features: [
// ->     {
// ->       type: "Feature",
// ->       geometry: {
// ->         type: "Point",
// ->         coordinates: [-3.20366551, 55.9510567]
// ->       }
// ->     },
// ->     …
// ->     {
// ->       type: "Feature",
// ->       geometry: {
// ->         type: "LineString",
// ->         coordinates: [[-3.172261: 55.95273], …]
// ->       },
// ->       properties: {
// ->           strokeColor: "#ffd700",
// ->           strokeOpacity: 0.5
// ->       }
// ->     }
// ->   ]
// -> }
```

## `getStreetViewPanoramaOptions()`

Returns an object defining the properties of a `StreetViewPanorama` object.

```js
var g = new Peat("#VictoriaStView")

g.getStreetViewPanoramaOptions()

// -> {
// ->   mode: "html5",
// ->   position: {lat:55.948437, lng:-3.194501},
// ->   pov: {heading:33, pitch:3},
// ->   zoom: 1
// -> }
```

# Contribution
This project is still a work in progress, and needs <del>more</del> testing before it can be recommended to be used in production. There are some optimisations that need to be further expanded upon, and others yet to be written.
