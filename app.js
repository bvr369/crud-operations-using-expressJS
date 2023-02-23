const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};

const convertDbSnakeCaseToCamelCase = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

initializeDbAndServer();

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT 
    movie_name
    FROM
    movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((dbObject) => convertDbSnakeCaseToCamelCase(dbObject))
  );
});

app.post("/movies/", async (request, response) => {
  const { movieDetails } = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const insertMovieQuery = `
    INSERT INTO
    movie (director_id, movie_name, lead_actor)
    VALUES
    (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );`;
  await db.run(insertMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
    *
    FROM
    movie
    WHERE
    movie_id = ${movieId};`;
  const dbObject = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(dbObject));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { movieDetails } = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE
        movie
    SET
        director_id=${directorId},
        movie_name='${movieName}',
        lead_actor='${leadActor}'
    WHERE
        movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM
    movie
    WHERE
    movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
    *
    FROM
    director;`;
  let dbObject = await db.all(getDirectorsQuery);
  response.send(
    dbObject.map((each) => convertDirectorDbObjectToResponseObject(each))
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesByDirQuery = `
    SELECT
    movie_name
    FROM
    movie
    WHERE
    director_id = ${directorId};`;
  let dbObject = await db.all(getMoviesByDirQuery);
  response.send(dbObject.map((each) => convertDbSnakeCaseToCamelCase(each)));
});

module.exports = app;
