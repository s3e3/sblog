requirejs([
    "jquery",
    "knockout",
    "async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBhVgsPQkWOY4xK_3PANZ64eEwdeGSx9pk&libraries=places",
    ], 
function($, ko){
    var Movie = function (params) {
        var self = this;

        //[{lat: 133123, lng:1232}]
        self.locations = ko.observableArray(params.locations);
        self.title = params.title;
    }
    var KoModel = function () {
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
            if(val == undefined || val == '') return;
            if(self.isJustSelected()){
                self.isJustSelected(false);
                return;
            }
            self.results([]);
            self.fetchResults(val);
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
            self.fetchMovieDetail(data);
        }

        self.fetchResults = function (search) {
            $.ajax({
                type: 'GET',
                url: '/movie/list/?search=' + search,
                success: function(response){
                    self.results(response.results);
                },
                error: function(err) {
                   console.log(err); 
                }
            })
        }

        self.movie = undefined;

        self.fetchMovieDetail = function(data){
            remove_markers();
            $.ajax({
                type: 'GET',
                url: '/movie/' + data.value,
                success: function(response) {
                    put_markers(response.result.locations);
                },
                error: function(err){
                    alert("Error Occured");
                }
            })
        }
    };

    ko.applyBindings(KoModel);

    var default_position = {
        lat: Number(GLOBAL.DEFAULT_LATITUDE),
        lng: Number(GLOBAL.DEFAULT_LONGITUDE),
    }
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: Number(GLOBAL.DEFAULT_ZOOM),
        center: default_position,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap']
        }

    });
    var MARKERS = [];
    var ICONS = {};
    var BOUNDS = new google.maps.LatLngBounds();

    var getIcon = function (key) {
        if(ICONS[key] == undefined){
            ICONS[key] = new google.maps.MarkerImage(
                "http://www.googlemapsmarkers.com/v1/" + randomColor() + "/"
            );
        } 
        return ICONS[key];
    }

    var reset_map = function () {
        BOUNDS = new google.maps.LatLngBounds();
        map.setCenter(default_position);
        map.setZoom(Number(GLOBAL.DEFAULT_ZOOM));
    }
    var put_markers = function(locations){
        for(var i=0; i< locations.length; i++){
            var loc = locations[i];
            var icon_key = 0;
            var movies_len = 1;
            if(loc.movies != undefined && loc.movies.length > 0){
                icon_key = loc.movies[0].id;
                movies_len = loc.movies.length;
            }

            MARKERS.push(
                new google.maps.Marker({
                    position: {
                        lat: Number(locations[i].lat),
                        lng: Number(locations[i].lng),
                    },
                    map: map,
                    title: 'Hello World!',
                    animation: google.maps.Animation.BOUNCE,
                    icon: getIcon(icon_key),
                })
            )
            BOUNDS.extend(MARKERS[i].getPosition());
        }
        map.setCenter(BOUNDS.getCenter());
        map.fitBounds(BOUNDS);
    }
    var remove_markers = function(){
        for(var i=0; i< MARKERS.length; i++){
            MARKERS[i].setMap(null);
        }
        if(MARKERS.length > 0){
            MARKERS.length = 0;
            reset_map();
        }
    }

    function randomColor() {
        var color = Math.floor(0x1000000 * Math.random()).toString(16);
        return ('000000' + color).slice(-6);
    }

    var input_location = document.getElementById('input-location');
    var input_movie = document.getElementById('input-movie');

    var searchBox = new google.maps.places.SearchBox(input_location);

    google.maps.event.addListener(searchBox, 'places_changed', function(){
        var places = searchBox.getPlaces();
        if(places.length == 0){
            alert("ERROR: No place found");
        }
        // just take the first place and show nearby movies
        var place = places[0];
    });

})
