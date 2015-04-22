;(function (window, document) {

    "use strict"

    var PeatApiLoader = (function () {

        var url = "https://maps.googleapis.com/maps/api/js?callback=PeatApiLoader.be0dcb4a530085046b0dff01b1e86271"

        var status = ""

        var options = {
            key: "",
            v: "3",
            signed_in: true,
            language: "",
            region: "",
            libraries: ["geometry"],
            client: "",
            sensor: false
        }

        var callbacks = []

        function load (cb) {
            if (status === "") {
                initURLString()
                loadJS()

                status = "loading"
            }

            queueCallback(cb)
        }

        function loaded () {
            status = "loaded"

            if (callbacks.length) {
                callbacks.forEach(function (cb) { cb.call() })

                callbacks = []
            }
        }

        function loadJS () {
            var script = document.createElement("script")
                script.src = url

            document.body.appendChild(script)
        }

        function initURLString () {
            var params = []
            var value = ""

            for (var key in options) {
                if (options.hasOwnProperty(key) && (value=options[key]) !== "") {
                    params.push((key+"="+(Array.isArray(value)?value.join(","):value)))
                }
            }

            url += "&"+params.join("&")
        }

        function queueCallback (cb) {
            if (typeof cb == "function") {
                callbacks.push(cb)
            }
        }

        return {
            options: options,
            getApi: load,
            be0dcb4a530085046b0dff01b1e86271: loaded
        }
    })()

    window.PeatApiLoader = PeatApiLoader

}(window, document))
