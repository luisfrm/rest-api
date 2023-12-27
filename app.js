const express = require("express");
const crypto = require("node:crypto");
const { validateMovie, validatePartialMovie } = require("./schemas/movies")
const movies = require("./movies.json");

const PORT = process.env.PORT || 3000;

const app = express();
app.disable("x-powered-by"); // Deshabilita el header X-Powered-By: Express
app.use(express.json()); // Recibe el body de la request y lo parsea a JSON

const ACCEPTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080"
]

app.get("/", (req, res) => {
	res.send("Hola mundo");
});

app.get("/movies", (req, res) => {
  // res.set("Access-Control-Allow-Origin", "*");
  const origin = req.get("Origin")
  if (ACCEPTED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }

  const { query } = req;

  if (query && Object.keys(query).length > 0) {
    let filteredMovies = movies

    Object.keys(query).forEach((param) => {
      filteredMovies = filteredMovies.filter(movie => {
        if (Array.isArray(movie[param])) return movie[param].includes(query[param])
        else {
          // eslint-disable-next-line eqeqeq
          return movie[param].toString().toLowerCase().includes(query[param].toString().toLowerCase())
        }
      })
    })
    res.status(200).json(filteredMovies);
    return
  }

  res.status(200).json(movies);
})

app.get("/movies/:id", (req, res) => {
  const { id } = req.params;

  const movie = movies.find((m) => m.id === id)

  if (!movie) res.status(404).json({ message: "Movie hasn't been found." })

  res.status(200).json(movie);
})

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  movies.push(newMovie);

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.status(200).json({ message: 'Movie deleted' })
})

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) return res.status(400).json({ message: JSON.parse(result.error.message) })

  const { id } = req.params
  const movieIndex = movies.findIndex(m => m.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: "Movie not found" })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  res.status(200).json(updateMovie)
})

app.put("/movies/:id", (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) return res.status(400).json({ message: JSON.parse(result.error.message) })

  const { id } = req.params
  const movieIndex = movies.findIndex(m => m.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: "Movie not found" })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  res.status(200).json(updateMovie)
})

// app.options("/movies", (req, res) => {
//   const origin = req.get("Origin")
//   if (ACCEPTED_ORIGINS.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//     res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
//     // res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
//   }

//   res.send(200)
// })

// fix core preflight
app.options('*', (req, res) => {
  // const origin = req.get("Origin")
  // if (ACCEPTED_ORIGINS.includes(origin)) {
  //   res.header("Access-Control-Allow-Origin", origin);
  //   res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
  //   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  // }

  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")

  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
