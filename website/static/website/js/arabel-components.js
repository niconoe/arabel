var ArabelMap = {
    props: {
        speciesId: Number
    },
    data: function () {
        return {
            mapObject: null,
            rectangleGroup: null // LayerGroup to interact with all rectangles as a whole
        }
    },
    methods: {
        setupMap: function() {
            this.mapObject = L.map('mapid').setView([50.6411, 4.6680], 8);

            var OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	            maxZoom: 19,
	            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
            });
            OpenStreetMap_HOT.addTo(this.mapObject);

        this.rectangleGroup = L.layerGroup().addTo(this.mapObject);

        },
        loadSpeciesData: function (speciesId) {

        }
    },
    mounted: function() {
        this.setupMap();
    },
    watch: {
        speciesId: function (speciesId) {
            if (speciesId !== null) {
                this.loadSpeciesData(speciesId);
            }
        }
    },
    template: `
        <div id="mapid" style="width: 100%; height: 600px;"></div>
    `
}