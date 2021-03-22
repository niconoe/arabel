var ArabelMap = {
    props: {
        speciesId: Number,
        squaresEndpoint: String
    },
    data: function () {
        return {
            mapObject: null,
            geojsonLayer: null,
            allFeatures: []
        }
    },
    methods: {
        setupMap: function () {
            this.mapObject = L.map('mapid').setView([50.6411, 4.6680], 8);

            var OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
            });
            OpenStreetMap_HOT.addTo(this.mapObject);

            this.geojsonLayer = L.geoJSON().addTo(this.mapObject);

        },
        entryToFeature: function (entry) {
            //console.log(JSON.parse(entry));

            var geojsonFeature = {
                "type": "Feature",
                "properties": {
                    "name": "Write something here",
                },
                "geometry": JSON.parse(entry.geojson_str)
            };

            return geojsonFeature;
        },

        loadOccurrences: function (speciesId) {
            var vm = this;

            axios
                .get(vm.squaresEndpoint, {params: {'speciesId': vm.speciesId}})
                .then(function (response) {
                    var squares = response.data.squares;
                    vm.allFeatures = squares.map(entry => vm.entryToFeature(entry))
                })
        }
    },
    mounted: function () {
        this.setupMap();
    },
    watch: {
        allFeatures: function (newFeatures) {
            this.geojsonLayer.clearLayers();
            this.geojsonLayer.addData(newFeatures);
        },
        speciesId: function (speciesId) {
            if (speciesId !== null) {
                this.loadOccurrences(speciesId);
            }
        }

    },
    template: `
        <div id="mapid" style="width: 100%; height: 600px;"></div>
    `
}