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
        updateCounters: function () {
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
        },
        'publicationDetailsUrl': String
    },
    computed: {
        'occurrencesPrepared': function() {
            return this.occurrences.map(occ => {
                return {
                    ...occ,
                    url: this.publicationDetailsUrl + '?publication_id=' + occ.station_publication_id
                }
            })
        }
    },
    template: `<tbody>
                 <tr v-for="occ in occurrencesPrepared">
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
                            
                            <br/>
                            <b>Leg:</b> {{ occ.station_leg }} - 
                            <b>Det:</b> {{ occ.station_det }}
                            
                            <span v-if="occ.station_publication_code">
                                <br/>
                                <b>Literature reference:</b> <a :href="occ.url" target="_blank">{{ occ.station_publication_code }}</a>
                            </span>
                            
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
        publicationDetailsUrl: String,
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
                {'sortId': 'id', 'label': '#',},
                {'sortId': 'date', 'label': 'Date'},
                {'sortId': 'station__station_name', 'label': 'Station',},
                {'sortId': 'individual_count', 'label': 'Individual count',},
            ]
        }
    },
    methods: {
        changeSort: function (newSort) {
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
            <table class="table table-striped table-sm table-hover">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col" :class="{ 'text-primary': (sortBy == col.sortId) }" v-for="col in cols">
                            <span @click="changeSort(col.sortId)">{{ col.label }}</span>
                        </th>
                    </tr>
                </thead>
                <arabel-table-page :occurrences="occurrences" :publication-details-url="publicationDetailsUrl"></arabel-table-page>
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
        publicationDetailsUrl: String,
        filters: Object
    },
    data: function () {
        return {
            mapObject: null,
            defaultBaseLayer: "OpenStreetMap HOT",
            baseLayers: {
                "OpenStreetMap HOT": L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
                }),
                "ESRI World Imagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                }),
                "CartoWeb (NGI/IGN)": L.tileLayer.wms('https://cartoweb.wms.ngi.be/service?', {
                    layers: 'topo',
                    format: 'image/png'
                }),
                "Ortho 2019(NGI/IGN)": L.tileLayer.wms('https://wms.ngi.be/inspire/ortho/service?', {
                    layers: 'orthoimage_coverage_2019',
                    format: 'image/png'
                })
            },
            overlayLayers: {
                "Ecoregions": L.tileLayer.wms('https://projects.biodiversity.be/geoserver/wms?', {
                    layers: 'bbpf:ecoregions',
                    format: 'image/png',
                    transparent: true
                })
            },
            ecoregionsLegend: null,
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
        linkToReference: function (referenceId) {
            return this.publicationDetailsUrl + '?publication_id=' + referenceId;
        },
        setupMap: function () {
            this.mapObject = L.map('mapid', {
                center: [50.6411, 4.6680],
                zoom: 8,
                layers: this.baseLayers[this.defaultBaseLayer]
            });

            this.ecoregionsLegend = this.createEcoregionsLegend();

            L.control.layers(this.baseLayers, this.overlayLayers).addTo(this.mapObject);

            this.mapObject.on('layeradd', e => {
                if(e.layer.options.layers === 'bbpf:ecoregions') { // TODO: we should use a better way to check it's the ecoregions layer
                    this.ecoregionsLegend.addTo(this.mapObject)
                }
            })
            this.mapObject.on('layerremove', e => {
                if(e.layer.options.layers === 'bbpf:ecoregions') { // TODO: we should use a better way to check it's the ecoregions layer
                    this.mapObject.removeControl(this.ecoregionsLegend);
                }
            })
        },
        createEcoregionsLegend: function () {
            var legend = L.control({position: 'bottomright'});

            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend'),
                    legendData = [
                        { name: 'Ardennes', color: '#3f38f0' },
                        { name: 'Condroz', color: '#fb5966' },
                        { name: 'Fagne - Famenne - Calestienne', color: '#54c2cd' },
                        { name: 'Gaume - Lorraine', color: '#6b7b82' },
                        { name: 'Thierache', color: '#e02463' },
                        { name: 'Dune', color: '#1ddcf1' },
                        { name: 'Campine', color: '#6aba3f' },
                        { name: 'Loam', color: '#5f75f0' },
                        { name: 'Gravel Meuse', color: '#e56631' },
                        { name: 'Polder', color: '#418495' },
                        { name: 'Sandyloam', color: '#9cb4d8;' },
                    ]

                div.innerHTML += '<h4>Ecoregions</h4>';
                legendData.forEach(entry => {
                    div.innerHTML +=
                        '<p class="legend-entry"><i style="background:' + entry.color + '"></i> ' + entry.name + '</p>'
                })

                return div;
            };
            return legend;
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
            var vm = this;

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

                        var referenceStr = '';
                        if (station.publication_id) {
                            referenceStr = `litterature reference: <a target="_blank" href="${vm.linkToReference(station.publication_id)}">${station.publication_code}</a>`
                        }

                        stationsStr = stationsStr.concat(`
                            <h5>station: ${station.name} (#${station.id})</h5> 
                            <p>
                            staal id: ${station.staal_id}<br/>
                            area: ${station.area}<br/>
                            subarea: ${station.subarea}<br/>
                            
                            ${referenceStr}
                            </p>
                            
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