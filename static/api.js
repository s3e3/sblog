define(['jquery'], function ($) {

    //Given a string return all matching movies
    var fetchMovieList = function(search_string, callback){
        $.ajax({
            type: 'GET',
            url: '/movie/list/?search=' + search_string,
            success: function(response){
                callback(response.results);
            },
            error: function(err) {
                alert("Some Error Occured. Contact Admin!");
            }
        })
    };
    // Given a movie fetch all the locations in which it was filmed.
    var fetchLocationsOfMovie = function(movie_id, callback){
        $.ajax({
            type: 'GET',
            url: '/movie/' + movie_id,
            success: function (response) {
               callback(response.result); 
            },
            error: function(err){
                alert("Some Error Occured. Contact Admin!");
            }
        })
    }

    // Given a location, fetch all movie facts at that location
    var fetchFactsAtLocation = function(movie_id, location_id, callback){
        var url = '/fact/location/' + location_id + '/'
        if(movie_id != undefined){
            url += '?movie_id=' + movie_id;
        }
        $.ajax({
            type: 'GET',
            url: url,
            success: function (response) {
                callback(response.template);
            },
            error: function(err){

            }
        })
    };

    var fetchNearByLocations = function (lat, lng, callback) {
        $.ajax({
            type: 'GET',
            url: '/location/nearby/?lat=' + lat + '&lng=' + lng,
            success: function (response) {
                if(response.results.length == 0){
                    alert("Sorry. You can only search within San Francisco");
                }
                callback(response.results);
            },
            error: function (err) {
               alert('Error occured') 
            }
        })
    }
    return {
        fetchFactsAtLocation: fetchFactsAtLocation,
        fetchLocationsOfMovie: fetchLocationsOfMovie,
        fetchMovieList: fetchMovieList,
        fetchNearByLocations: fetchNearByLocations
    }
})