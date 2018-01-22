requirejs([
    "jquery",
    "knockout",
    "api",
    "async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBhVgsPQkWOY4xK_3PANZ64eEwdeGSx9pk&libraries=places",
    ], 
function($, ko, api){
    var DEFAULT_POSITION = {
        lat: Number(GLOBAL.DEFAULT_LATITUDE),
        lng: Number(GLOBAL.DEFAULT_LONGITUDE),
    }
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: Number(GLOBAL.DEFAULT_ZOOM),
        center: DEFAULT_POSITION,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap']
        }

    });
    var infowindow = new google.maps.InfoWindow({
        content: '<p>No Content Yet</p>'
    });

    var MARKERS = [];
    var ICONS = {};
    var BOUNDS = new google.maps.LatLngBounds();

    var COLORS = [
        "blue", 'orange', 'pink', 'red', 'green', 'yellow', 'purple', 'brown'
    ]
    var INDEX = 0;
    var CHAR_CODE = 65;

    var eventListeners = {
        MARKER_CLICK: function (movie_id, location_id, marker_index) {
            return function(){
                api.fetchFactsAtLocation(movie_id, location_id, function (template) {
                    if(movie_id){
                        template += '<br/><a href="#" id="show-all">show all movies at this location</a>'
                    }
                    infowindow.setContent(template)
                    infowindow.open(map, MARKERS[marker_index]);  

                    if(movie_id){
                        var button = document.getElementById('show-all');

                        google.maps.event.addDomListener(
                            button, 'click', 
                            eventListeners.MARKER_CLICK(undefined, location_id, marker_index)
                        )
                    }
                })
            }
        },
        PLACES_CHANGED: function () {
            var places = searchBox.getPlaces();
            if(places.length == 0){
                alert("ERROR: No place found");
            }
            // just take the first place and show nearby movies
            var place = places[0];

            resetMap();
            api.fetchNearByLocations(
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                function(locations){
                    for(var i=0; i< locations.length; i++){
                        putMarker(locations[i], true);
                        updateMapViewPort();
                        MARKERS[i].addListener(
                            'click',
                            eventListeners.MARKER_CLICK(undefined, locations[i].id, i)
                        )
                    }
                }
            );
            
        }
    }
    var TextModel = function () {
        var self = this;

        self.searchText = ko.observable().extend({rateLimit: 50});
        self.oldSearchText = ko.observable();
        self.trimmedText = ko.computed(function() {
            return self.searchText() != undefined ? self.searchText().trim() : "";
        });

        self.results = ko.observableArray([]);

        self.searchText.subscribe(function(oldval) {
            self.oldSearchText(oldval)
        }, null, "beforeChange");

        self.trimmedText.subscribe(function(val) {
            if(val == self.oldSearchText()) return;
            if(val == undefined || val == ''){
                self.results([]);
                return;
            }
            if(self.isJustSelected()){
                self.isJustSelected(false);
                return;
            }
            self.results([]);
            //self.fetchResults(val);
            api.fetchMovieList(val, function(results){
                self.results(results);
            })
        })

        self.showList = ko.observable(false);

        self.results.subscribe(function(val) {
           self.showList(val != undefined && val.length > 0); 
        })

        self.selectedMovie = ko.observable();
        self.isJustSelected = ko.observable(false);

        self.selectValue = function(data) {
            self.isJustSelected(true);
            self.results([]);
            self.searchText(data.key);
            self.selectedMovie(data); 
            //self.fetchMovieDetail(data);
            resetMap();
            api.fetchLocationsOfMovie(data.value, function (response) {
               for(var i=0; i< response.locations.length; i++){
                    var loc = response.locations[i];

                    putMarker(loc);
                    updateMapViewPort();
                    MARKERS[i].addListener(
                        'click',
                        eventListeners.MARKER_CLICK(response.id, loc.id, i)
                    )
               } 
            })
        }
    };
    ko.applyBindings(TextModel);

    var updateMapViewPort = function(){
        map.setCenter(BOUNDS.getCenter());
        map.fitBounds(BOUNDS);
        if(MARKERS.length <= 3 && map.getZoom() > 13){
            map.setZoom(13);
        }
    }

    var iconFile = function(index, char_code){
        return '/static/markers/' + COLORS[index] + '_Marker' + String.fromCharCode(char_code) + '.png';
    }
    var getIcon = function (location, use_colors) {
        var key = 0;
        if(location.movies != undefined && location.movies.length > 0 && use_colors){
            key = location.movies[0];
        }
        if(ICONS[key] == undefined){
            if(INDEX >= COLORS.length - 1){
                CHAR_CODE++;
                if(CHAR_CODE >= 90) CHAR_CODE = 65;
                INDEX = INDEX % (COLORS.length - 1);
            }
            else{
                INDEX++;
            }
            ICONS[key] = new google.maps.MarkerImage(iconFile(INDEX, CHAR_CODE));
        } 
        return ICONS[key];
    }

    var resetMap = function () {
        BOUNDS = new google.maps.LatLngBounds();
        map.setCenter(DEFAULT_POSITION);
        map.setZoom(Number(GLOBAL.DEFAULT_ZOOM));
        for(var i=0; i< MARKERS.length; i++){
            MARKERS[i].setMap(null);
        }
        MARKERS.length = 0;
    }

    var putMarker = function (location, use_colors) {
        var marker = new google.maps.Marker({
            position: {
                lat: Number(location.lat),
                lng: Number(location.lng),
            },
            map: map,
            title: 'Click To See The Details',
            animation: google.maps.Animation.BOUNCE,
            icon: getIcon(location, use_colors),
        })
        MARKERS.push(marker);
        BOUNDS.extend(marker.getPosition());
        return marker;
    }

    var input_location = document.getElementById('input-location');
    var searchBox = new google.maps.places.SearchBox(input_location);
    google.maps.event.addListener(searchBox, 'places_changed', eventListeners.PLACES_CHANGED);

})
