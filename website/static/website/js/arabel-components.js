var SpeciesDescription = {
    props: {
        speciesData: Object,
        countersEndpoint: String,
        filters: Object
    },
    data: function () {
        return {
            counters: {
                'occurrences': null,
                'stations': null
            }
        }
    },
    watch: {
        filters: {
            deep: true,
            immediate: true,
            handler: function () {
                this.updateCounters()
            }
        },
    },
    methods: {
        updateCounters: function() {
            var vm = this;

            $.ajax({
                url: this.countersEndpoint,
                data: vm.filters,
            }).done(function (data) {
                vm.counters.occurrences = data.occurrences;
            });
        }
    },
    template: `
        <div class="alert alert-info" role="alert">
            <h4>Search results ({{ counters.occurrences }} matching occurrences)</h4>
            <p><b>Species name:</b> {{ speciesData.scientific_name }}<br/>
               <b>Family:</b> {{ speciesData.family_name }}<br/>
               <b>Vernacular name (NL):</b> {{ speciesData.vernacular_name_nl }}<br/>
               <b>Red list status:</b> {{ speciesData.redlist_status_text }}</p>
        </div>
    `
}

// A single page in the occurrence table
Vue.component('arabel-table-page', {
    props: {
        'occurrences': { // Only the subset for the page
            type: Array,
            default: function () {
                return []
            }
        }
    },
    template: `<tbody>
                 <tr v-for="occ in occurrences">
                    <th scope="row">{{ occ.id }}</th>
                    <td>{{ occ.date }}</td>
                    <td>
                        {{ occ.station_name }}
                        <small>
                            <br/>
                            <b>Staal id:</b>{{ occ.station_staal_id }}
                            <br/>
                            
                            <span v-if="occ.station_area != ''"><b>Area:</b> {{ occ.station_area }}</span>
                            <span v-if="occ.station_subarea != ''"><b>Subarea:</b> {{ occ.station_subarea }}</span>
                            
                            <br v-if="occ.station_area != '' || occ.station_subarea != ''"/>
                            <b>Most detailed square:</b> {{ occ.station_most_detailed_square}}
                            
                        </small>
                    </td>
                    <td>{{ occ.individual_count }}</td>
                 </tr>
               </tbody>`
})

// The whole table, manages pagination and data load
Vue.component('arabel-table', {
    props: {
        filters: Object,
        occurrencesEndpoint: String,
    },
    data: function () {
        return {
            currentPage: 1,
            firstPage: null,
            lastPage: null,
            sortBy: 'id',
            pageSize: 20,
            totalOccurrencesCount: null,
            occurrences: [],
            cols: [
                // sortId: must match django QS filter (null = non-sortable), label: displayed in header
                {'sortId': 'id', 'label': '#', },
                {'sortId': 'date', 'label': 'Date'},
                {'sortId': 'station__station_name', 'label': 'Station', },
                {'sortId': 'individual_count', 'label': 'Individual count', },
            ]
        }
    },
    methods: {
        changeSort: function(newSort) {
            if (newSort != null) {
                this.sortBy = newSort;
            }
        },
        loadOccurrences: function (filters, orderBy, pageSize, pageNumber) {
            let params = Object.assign({}, filters);  // Let's clone to avoid mutating props
            params.order = orderBy;
            params.limit = pageSize;
            params.page_number = pageNumber;

            let vm = this;

            $.ajax({
                url: this.occurrencesEndpoint,
                data: params,
            }).done(function (data) {
                vm.occurrences = data.results;
                vm.firstPage = data.firstPage;
                vm.lastPage = data.lastPage - 1;
                vm.totalOccurrencesCount = data.totalResultsCount;
            })
        }
    },
    computed: {
        hasPreviousPage: function () {
            return (this.currentPage > 1);
        },
        hasNextPage: function () {
            return (this.currentPage < this.lastPage);
        },
    },
    watch: {
        filters: {
            deep: true,
            immediate: true,
            handler: function () {
                this.currentPage = 1;
                this.loadOccurrences(this.filters, this.sortBy, this.pageSize, this.currentPage)
            }
        },
        currentPage: function () {
            this.loadOccurrences(this.filters, this.sortBy, this.pageSize, this.currentPage);
        },
        sortBy: function () {
            this.loadOccurrences(this.filters, this.sortBy, this.pageSize, this.currentPage);
        },
    },
    template: `
        <div id="table-outer">
            <table class="table table-striped table-sm">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col" :class="{ 'text-primary': (sortBy == col.sortId) }" v-for="col in cols">
                            <span @click="changeSort(col.sortId)">{{ col.label }}</span>
                        </th>
                    </tr>
                </thead>
                <arabel-table-page :occurrences="occurrences"></arabel-table-page>
            </table>
            <p class="text-center"> 
                <button type="button" :disabled="!hasPreviousPage" class="btn btn-outline-primary btn-sm" @click="currentPage -= 1">Previous</button>
                    Page {{ currentPage }} / {{ lastPage }}
                <button type="button" :disabled="!hasNextPage" class="btn btn-outline-primary btn-sm" @click="currentPage += 1">Next</button>
            </p>
        </div>`
});

var ArabelMap = {
    props: {
        squaresEndpoint: String,
        filters: Object
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

        loadOccurrences: function (speciesId, noSmallSquares, filterLeonBecker) {
            var vm = this;

            axios
                .get(vm.squaresEndpoint, {
                    params: {
                        'speciesId': speciesId,
                        'noSmallSquares': noSmallSquares,
                        'filterOutLeonBecker': filterLeonBecker
                    }
                })
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
                style: function (feature) {
                    return {
                        'color': 'black', // border color
                        'fillColor': vm.colorScale(feature.properties.totalIndividuals),
                        'weight': 1, // border weight
                        'fillOpacity': 0.8
                    }
                }
            }).addTo(this.mapObject);
        },
        filters: {
            deep: true,
            handler: function () {
                if (this.filters.speciesId !== null) {
                    this.loadOccurrences(this.filters.speciesId, this.filters.noSmallSquares, this.filters.filterOutLeonBecker);
                }
            },
        }
    },
    template: `
        <div id="mapid" style="width: 100%; height: 600px;"></div>
    `
}