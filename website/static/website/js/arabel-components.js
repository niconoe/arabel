var ArabelMap = {
    data: function () {
        return {

        }
    },
    mounted: function() {
        var mymap = L.map('mapid').setView([50.6411, 4.6680], 8);

        var OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	        maxZoom: 19,
	        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
        });
        OpenStreetMap_HOT.addTo(mymap);
    },
    template: `
        <div id="mapid" style="width: 100%; height: 600px;"></div>
    `
}