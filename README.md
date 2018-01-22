# SF - Movies: [website link](http://ghule-suhas.ap-south-1.elasticbeanstalk.com)

**Problem State:** Create a service that shows on a map where movies have been filmed in San Francisco. The user should be able to filter the view using autocompletion search.

The data is available on DataSF: Film Locations.

## Features
- #### Search By Movie Title
	- Get all the locations in which a movie was filmed
	- User will get input suggestions as he/she types
- #### Search By Location
	- Get all the movies within a range of **50 kilometres** of a selected location
	- User will get input suggestions as he/she types
	- Location markers are color coded on the map to distinguish between different movies 
- On clicking the location marker, more information about the movie like - Director, Actors, Fun Fact at that location will be displayed
- User can also  get an info of all the movies filmed in that location.

## Backend: Python, Django, Postgres
#### Why Postgres?  -- 
- Using a relational database seemed an appropriate choice to keep a relation between information like Movie, Location and Fact.
- Postgres has a **Full Text Search** functionality, which seemed a good enough and fast solution for the given requirement.
**Trade off**: Since Django's ORM doesn't provide pattern text search, had to use raw sql queries.
#### Error Logging:
On https://sentry.io
#### Database Models:
- **Location**: Store address string and its respective latitude, longitude 
- **Movie**: Store movie details and many-to-many relation with Location
- **Fact**: Store location specific details of a Movie
#### API calls (only Ajax GET request are accepted):
- `/movie/<movie-id>/` - All the locations of a given movie id.
- `/location/nearby/` - All movie locations within a range of 50kms.
- `/fact/location/<location-id>/` - All movies at a given location id.

## Frontend: Jquery, knockoutjs, requirejs
- To build a Single Page Application, these are lighter and easy to implement libraries

## External Libraries used:
- `psycopg2` - Postgres client for Python
- `ipython` - For Debugging
- Google Maps Javascript API
- `async.js` - Useful to load asynchronous dependencies
- `marker pngs` - To display color coded markers on map to distinguish among movies.

**If I had more time...**
- Would have used **webpack** to bundle css, javascript files to improve load time of the website
- It'd be nice to implement LRU cache for caching db queries
- Would love to experiment with Postgres GIS extension
