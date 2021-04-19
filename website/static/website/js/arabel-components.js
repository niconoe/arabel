var SpeciesDescription = {
    props: {
        speciesData: Object
    },
    data: function () {
        return {}
    },
    template: `
        <div class="alert alert-info" role="alert">
            <h4>Selected species</h4>
            <p><b>Name:</b> {{ speciesData.scientific_name }}<br/>
               <b>Family:</b> {{ speciesData.family_name }}<br/>
               <b>Vernacular name (NL):</b> {{ speciesData.vernacular_name_nl }}</p>
        </div>
    `
}

var ArabelTable = {
    props: {
        speciesId: Number
    },
    data: function () {
        return {}
    },
    template: `
        <h4>Results table (not yet implemented)</h4>
    `
}

var ArabelMap = {
    props: {
        speciesId: Number,
        squaresEndpoint: String,
        noSmallSquares: Boolean
    },
    data: function () {
        return {
            mapObject: null,
            geojsonLayer: null,
            allFeatures: []
        }
    },
    computed: {
        colorScale: function () {
            return d3.scaleSequentialLog(d3.interpolateReds)
                .domain([1, this.maxIndividualsPerSquare])

        },
        maxIndividualsPerSquare: function () {
            let max = 1;

            this.allFeatures.forEach(feature => {
                if (feature.properties.totalIndividuals > max) {
                    max = feature.properties.totalIndividuals
                }
            })

            return max;
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
            var geojsonFeature = {
                "type": "Feature",
                "properties": {
                    "name": entry.name,
                    "stations": entry.stations,
                    "totalIndividuals": 0
                },
                "geometry": JSON.parse(entry.geojson_str)
            };

            entry.stations.forEach(station => {
                station.occurrences.forEach(occ => {
                    geojsonFeature.properties.totalIndividuals += occ.individual_count
                })
            })

            return geojsonFeature;
        },

        loadOccurrences: function (speciesId, noSmallSquares) {
            var vm = this;

            axios
                .get(vm.squaresEndpoint, {
                    params: {
                        'speciesId': speciesId,
                        'noSmallSquares': noSmallSquares
                    }})
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
                    feature.properties.stations.forEach(function (station) {
                        var occStr = '';
                        station.occurrences.forEach(function (occ) {
                            occStr = occStr.concat(`occurrence #${occ.id} (date: ${occ.date} - count: ${occ.individual_count})<br/>`)
                        });

                        stationsStr = stationsStr.concat(`
                            <h5>station: ${station.name} (#${station.id})</h5> 
                            <p>
                            staal id: ${station.staal_id}<br/>
                            area: ${station.area}<br/>
                            subarea: ${station.subarea}</p>
                            
                            ${occStr}
                        `)
                    })

                    var popupContent = `
                        <h3>${feature.properties.name}</h3>
                        
                        <p>Total: ${feature.properties.totalIndividuals} individual(s)</p>
                        
                        ${stationsStr}
                    `

                    layer.bindPopup(popupContent, {maxHeight: 300});
                }
            }



            // 3. Create and add layer on map
            var vm = this;
            this.geojsonLayer = L.geoJSON(newFeatures, {
                onEachFeature: onEachFeature,
                style: function(feature) {
                    return {
                        'color': 'black', // border color
                        'fillColor': vm.colorScale(feature.properties.totalIndividuals),
                        'weight': 1, // border weight
                        'fillOpacity': 0.8
                    }
                }
            }).addTo(this.mapObject);
        },
        speciesId: function () {
            if (this.speciesId !== null) {
                this.loadOccurrences(this.speciesId, this.noSmallSquares);
            }
        }, noSmallSquares: function() {
            if (this.speciesId !== null) {
                this.loadOccurrences(this.speciesId, this.noSmallSquares);
            }
        }

    },
    template: `
        <div id="mapid" style="width: 100%; height: 600px;"></div>
    `
}