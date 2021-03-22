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

        },
        entryToFeature: function (entry) {
            console.log("Entry", entry)
            var geojsonFeature = {
                "type": "Feature",
                "properties": {
                    "name": entry.name,
                    "stations": entry.stations
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
            // 1. Remove existing layer, if applicatble
            if (this.mapObject.hasLayer(this.geojsonLayer)) {
                this.mapObject.removeLayer(this.geojsonLayer)
            }

            // 2. Prepare popups
            function onEachFeature(feature, layer) {
                // does this feature have a property named popupContent?
                if (feature.properties) {

                    var stationsStr = ''
                    feature.properties.stations.forEach(function(station) {
                        var occStr = '';
                        station.occurrences.forEach(function(occ) {
                            occStr = occStr.concat(`occurrence #${occ.id} (date: ${occ.date} - count: ${occ.individual_count})<br/>`)
                        });

                        stationsStr = stationsStr.concat(`
                            <h5>station: ${station.name} (#${station.id})</h5> 
                            <p>area: ${station.area}<br/>
                            subarea: ${station.subarea}</p>
                            
                            ${occStr}
                        `)
                    })

                    var popupContent = `
                        <h3>${feature.properties.name}</h3>
                        
                        ${stationsStr}
                    `

                    layer.bindPopup(popupContent, {maxHeight: 300});
                }
            }

            // 3. Create and add layer on map
            this.geojsonLayer = L.geoJSON(newFeatures, {onEachFeature: onEachFeature}).addTo(this.mapObject);
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