;(function (window, document) {

    "use strict"

    /**
     * Peat Constructor.
     *
     * @param {HTMLElement|String} img
     * @param {Function} cb
     * @constructor
     */
    function Peat (img, cb) {
        /**
         *
         * @type {HTMLElement}
         */
        this.img = null

        /**
         *
         * @type {Map|StreetViewPanorama}
         */
        this.map = null

        /**
         *
         * @type {HTMLElement}
         */
        this.div = document.createElement("div")

        /**
         *
         * @type {Function}
         */
        this.onApiLoadingDone = function (g) {}

        this.initImageObject(img)
        this.initCallback(cb)

        this.initApiHandler()
    }

    /**
     * …
     *
     */
    Peat.prototype.initImageObject = function (elem) {
        if (typeof elem === "string") {
            this.img = document.querySelector(elem)
        }
        else {
            this.img = elem
        }

        if (!this.img || !("nodeName" in this.img) || this.img.nodeName !== "IMG") {
            throw new Error("Peat first argument should be a valid CSS selector or a img instance.")
        }
    }

    /**
     * …
     *
     */
    Peat.prototype.initCallback = function (cb) {
        if (typeof cb === "function") {
            this.onApiLoadingDone = cb
        }
    }

    /**
     * …
     *
     */
    Peat.prototype.initMapInstance = function () {
        var type = Peat.getURLProp(this.img.src, "pathname").split("/").pop()
        var constructor = type === "staticmap" ? "Map" : "StreetViewPanorama"

        this.map = new google.maps[constructor](this.div, {})
    }

    /**
     * …
     *
     */
    Peat.prototype.initApiHandler = function () {
        var self = this

        if (!("google" in window) || !("maps" in google)) {
            PeatApiLoader.getApi(function () {
                self.initMapInstance()
                self.onApiLoadingDone(self)
            })
        }
        else {
            this.initMapInstance()
            this.onApiLoadingDone(this)
        }
    }

    /**
     * Returns a key/value object with all GET query arguments
     * contained in the URL.
     *
     * Notice: all values are decoded to follow the URLSearchParams interface behaviour.
     *
     * @api
     * @returns {Object}
     */
    Peat.prototype.getImageParams = function () {
        var params = {}
        var query = Peat.getURLProp(this.img.src, "search")

        // Strips the first character (`?`) to work only with the query string of the URL
        query = query.substr(1)

        query.split("&").forEach(function (p) {
            var name = p.substr(0, p.indexOf("="))
            var value = p.substr(p.indexOf("=") + 1)

            value = Peat.decodeURIComponent(value)

            if (params.hasOwnProperty(name)) {
                if (!Array.isArray(params[name])) {
                    params[name] = [ params[name] ]
                }

                params[name].push(value)
            }
            else {
                params[name] = value
            }
        })

        // Because markers, path or style parameters can appear several times,
        // they will always be returned as an array even for one result
        var keys = ["markers", "path", "style"]
        keys.map(function (k) {
            if (params.hasOwnProperty(k) && !Array.isArray(params[k])) {
                params[k] = [ params[k] ]
            }
        })

        return params
    }

    /**
     * Returns an expanded object of all collections needed to play
     * with the Google Maps API.
     *
     * @api
     * @returns {Object}
     */
    Peat.prototype.getMapData = function () {
        var data = {mapOptions: {}, markerOptions: [], mapTypeStyle: [], polylineOptions: [], polygonOptions: []}
        var params = this.getImageParams()

        for (var name in params) {
            if (params.hasOwnProperty(name)) {
                var value = params[name]

                switch (name) {
                    case "center":
                        data.mapOptions["center"] = Peat.getLatLngLiteral(value)
                    break;
                    case "zoom":
                        data.mapOptions["zoom"] = parseInt(value, 10)
                    break;
                    case "maptype":
                        data.mapOptions["mapTypeId"] = value
                    break;
                    case "markers":
                        data.markerOptions = Peat.markersFormatter(value).map(Peat.markerOptionsDataMapper)
                    break;
                    case "style":
                        data.mapTypeStyle = value.map(Peat.mapTypeStyleDataMapper)
                    break;
                    case "path":
                        value.forEach(function (v) {
                            v = Peat.shapeOptionsDataMapper(v)

                            data["poly"+(v.hasOwnProperty("path")?"line":"gon")+"Options"].push(v)
                        })
                    break;
                }
            }
        }

        // Deletes unnecessary default entries
        for (var key in data) {
            if (data.hasOwnProperty(key) && !Object.keys(data[key]).length) {
                delete data[key]
            }
        }

        return data
    }

    /**
     * Returns a GeoJSON object to display markers, polylines and polygons
     * in an easy way with the help of google.maps.Data class.
     *
     * @api
     * @returns {Object}
     */
    Peat.prototype.getMapGeoJson = function () {
        var geoJson = {}
        var data = this.getMapData()

        geoJson["type"] = "FeatureCollection"
        geoJson["metadata"] = {
            url: this.img.src,
            title: this.img.alt || this.img.title || ""
        }
        geoJson["features"] = []

        if (data.hasOwnProperty("mapOptions")) {
            geoJson.metadata["options"] = data.mapOptions
        }

        if (data.hasOwnProperty("mapTypeStyle")) {
            geoJson.metadata["style"] = data.mapTypeStyle
        }

        if (data.hasOwnProperty("markerOptions")) {
            data.markerOptions.forEach(function (m) {
                var position = m.position
                var feature = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [position.lng, position.lat]
                    }
                }

                delete m.position
                if (Object.keys(m).length) {
                    feature["properties"] = m
                }

                geoJson.features.push(feature)
            })
        }

        if (data.hasOwnProperty("polylineOptions")) {
            data.polylineOptions.forEach(function (p) {
                var path = p.path.map(function (p) { return [p.lng, p.lat] })

                var feature = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: path
                    }
                }

                delete p.path
                if (Object.keys(p).length) {
                    feature["properties"] = p
                }

                geoJson.features.push(feature)
            })
        }

        if (data.hasOwnProperty("polygonOptions")) {
            data.polygonOptions.forEach(function (p) {
                var paths = p.paths.map(function (p) { return [p.lng, p.lat] })

                var feature = {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [paths]
                    }
                }

                delete p.paths
                if (Object.keys(p).length) {
                    feature["properties"] = p
                }

                geoJson.features.push(feature)
            })
        }

        return geoJson
    }

    /**
     * Returns an object defining the properties of a StreetViewPanorama object.
     *
     * @api
     * @returns {Object}
     */
    Peat.prototype.getStreetViewPanoramaOptions = function () {
        var options = {mode: "html5", pov: {pitch: 0}}
        var params = this.getImageParams()

        for (var name in params) {
            if (params.hasOwnProperty(name)) {
                var value = params[name]

                switch (name) {
                    case "location":
                        options["position"] = Peat.getLatLngLiteral(value)
                    break;
                    case "pano":
                        options["pano"] = value
                    break;
                    case "heading":
                    case "pitch":
                        options.pov[name] = parseFloat(value)
                    break;
                    case "fov":
                        var sizes = params.size.split("x").map(function (s) { return parseInt(s, 10) })

                        options["zoom"] = Math.sqrt((sizes[0] * sizes[0]) / (sizes[1] * sizes[1])) / (2 * Math.tan(((value * Math.PI / 180) / 2)))
                    break;
                }
            }
        }

        return options
     }

    /**
     * Splits markers parameters with this following format:
     * `markerStyles|markerLocation1|markerLocation2|…` into
     * multiple markers parameters with separated style informations.
     *
     * @param {Array} markers
     * @returns {Array}
     */
    Peat.markersFormatter = function (markers) {
        var descriptors = []

        markers.forEach(function (m) {
            var styles = []
            var args = m.split("|")
            var i

            // Extracts marker(s)' style(s) and reduces the array `args` to marker(s)' location(s)
            for (i = args.length - 1; i >= 0; i -= 1) {
                if (/^(color|size|label|icon|shadow):/gi.test(args[i])) {
                    styles.push(args[i])
                    args.splice(i, 1);
                }
            }

            args = args.map(function (s) { return styles.concat(s).join("|") })

            descriptors = descriptors.concat(args)
        })

        return descriptors
    }

    /**
     * Maps marker descriptors to a Marker options object literal
     * which could be passed to the google.maps.Marker constructor.
     *
     * Notice: the set of marker style descriptors are ignored because of
     * the lack of compatibility with the Google Maps Javascript API v3.
     *
     * @param {String} descriptor
     * @returns {Object}
     */
    Peat.markerOptionsDataMapper = function (descriptor) {
        var opts = {}

        descriptor
            .split("|")
            .forEach(function (arg) {
                // Marker style or custom icon
                if (/^(color|size|label|icon|shadow):/gi.test(arg)) {
                    var name = arg.substr(0, arg.indexOf(":"))
                    var value = arg.substr(arg.indexOf(":") + 1)

                    switch (name) {
                        case "icon":
                            opts["icon"] = Peat.decodeURIComponent(value)
                        break;
                    }
                }
                // Marker location
                else {
                    opts["position"] = Peat.getLatLngLiteral(arg)
                }
            })

        return opts
    }

    /**
     * Maps style descriptors to a MapTypeStyles object (composed by selectors and stylers)
     * which could be passed (through an array) to the default map's MapOptions object,
     * or to the StyledMapType constructor.
     *
     * @param {String} descriptor
     * @returns {Object}
     */
    Peat.mapTypeStyleDataMapper = function (descriptor) {
        var style = {stylers: []}

        descriptor
            .split("|")
            .forEach(function (arg) {
                var name = arg.substr(0, arg.indexOf(":"))
                var value = arg.substr(arg.indexOf(":") + 1)

                if (name == "feature") {
                    style["featureType"] = value
                }
                else if (name == "element") {
                    style["elementType"] = value
                }
                else {
                    var styler = {}

                    switch (name) {
                        case "color":
                        case "hue":
                            styler[name] = Peat.getColorData(value).hex
                        break;
                        case "gamma":
                        case "lightness":
                        case "saturation":
                            styler[name] = parseFloat(value)
                        break;

                            value = Peat.getColorData(rule[1])
                        case "invert_lightness":
                            styler[name] = Boolean(value)
                        break;
                        case "weight":
                            styler[name] = parseInt(value, 10)
                        break;
                        default:
                            styler[name] = value
                    }

                    style["stylers"].push(styler)
                }
            })

        return style
    }

    /**
     * Maps path descriptors to a PolylineOptions or PolygonOptions object.
     *
     * @param {String} descriptor
     * @returns {Object}
     */
    Peat.shapeOptionsDataMapper = function (descriptor) {
        var opts = {path: []}
        var split = descriptor.indexOf("enc:") != -1 ? /\|(?=weight|color|fillcolor|geodesic|enc)/ig : "|"

        descriptor
            .split(split)
            .forEach(function (arg) {
                // Path style or encoded Polyline
                if (/^(weight|color|fillcolor|geodesic|enc):/gi.test(arg)) {
                    var name = arg.substr(0, arg.indexOf(":"))
                    var value = arg.substr(arg.indexOf(":") + 1)

                    switch (name) {
                        case "weight":
                            opts["strokeWeight"] = parseInt(value, 10)
                        break;
                        case "color":
                            var stroke = Peat.getColorData(value, "stroke")

                            opts["strokeColor"] = stroke.hex
                            opts["strokeOpacity"] = stroke.alpha
                        break;
                        case "fillcolor":
                            var fill = Peat.getColorData(value, "fill")

                            opts["fillColor"] = fill.hex
                            opts["fillOpacity"] = fill.alpha
                        break;
                        case "geodisc":
                            opts["geodisc"] = Boolean(value)
                        break;
                        case "enc":
                            try {
                                opts["path"] = google.maps.geometry.encoding.decodePath(value)

                                // Returns an array of LatLng objects literal in place of LatLng objects
                                opts["path"] = opts["path"].map(function (p) { return {lat: p.lat(), lng: p.lng()} })
                            }
                            catch (e) {
                                throw new Error("Encoded polylines or polygons can not be decoded without the Google Maps JavaScript API V3 geometry library.")
                            }
                        break;
                    }
                }
                // Path point
                else {
                    opts["path"].push(Peat.getLatLngLiteral(arg))
                }
            })

        // If a fillcolor argument is passed into the path parameter (even completely transparent),
        // the path will always be considered as a polygon
        if (opts.hasOwnProperty("fillColor")) {
            opts["paths"] = opts["path"]

            delete opts["path"]
        }

        return opts
    }

    /**
     * …
     *
     * @param {String} location
     * @return {Object}
     */
    Peat.getLatLngLiteral = function (location) {
        // Latitude and Longitude
        if (location.match(/^([-+]?\d{1,2}[.]\d+),\s*([-+]?\d{1,3}[.]\d+)$/gi)) {
            var latlng = location.split(',').map(function (value) { return parseFloat(value) })

            return {'lat': latlng[0], 'lng': latlng[1]}
        }
        // Address
        else {
            var request = new XMLHttpRequest()
                request.open("GET", "http://maps.google.com/maps/api/geocode/json?sensor=false&address="+encodeURIComponent(location), false)
                request.send(null)

            if (request.status === 200) {
                var response = JSON.parse(request.responseText)

                return response.results[0].geometry.location
            }
        }
    }

    /**
     * Utility to extract a specific part from an url
     * as we could do for `window.location`.
     *
     * @param {String} url
     * @param {String} prop
     * @return {String|Object}
     */
    Peat.getURLProp = function (url, prop) {
        var parser = document.createElement("A")
            parser.href = url

        return parser[prop]
    }

    /**
     * Gets the #-hexadecimal value and the alpha-channel of a specified color
     * either as a 24/32-bit hexadecimal (`0xFFFFCCFF`) value or as a keyword.
     *
     * @param {String} color
     * @param {String} from
     * @return {Object}
     */
    Peat.getColorData = function (color, from) {
        from = from || "color"

        var data = {hex: "", alpha: 0}
        var colorKeywords = {
            "black": "#000000",
            "brown": "#a52a2a",
            "green": "#008000",
            "purple": "#800080",
            "yellow": "#ffff00",
            "blue": "#0000ff",
            "gray": "#808080",
            "orange": "#ffa500",
            "red": "#ff0000",
            "white": "#ffffff"
        }

        // Initialises the default alpha-channel value according to the property
        switch (from) {
            case "stroke":
            case "fill":
                data.alpha = .5
            break;
            default:
                data.alpha = 1
        }

        // 24-bit (0xRRGGBB) or 32-bit (0xRRGGBBAA) color
        if (color.indexOf("0x") !== -1) {
            data.hex = "#"+color.substr(2, 6).toLowerCase()

            if (color.length > 8) {
                data.alpha = Math.round((parseInt(color.substr(8), 16) / 255) * 100) / 100
            }
        }
        // Predefined color
        else if (Object.keys(colorKeywords).indexOf(color) !== -1) {
            data.hex = colorKeywords[color]
        }

        return data
    }

    /**
     * …
     *
     * @param {String} string
     * @return {String}
     */
    Peat.decodeURIComponent = function (string) {
        // …
        string = string.replace(/\+/gi, "%20")

        return decodeURIComponent(string)
    }

    window.Peat = Peat

}(window, document))
