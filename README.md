# Space News Aggregator

A real-time web application that gathers the latest space and tech news into a
single, responsive feed. Instead of checking NASA, SpaceX, ESA, ISRO and various
news outlets separately, users get one clean interface with live search, source
filtering, sorting and the ability to save favourite articles.

Built as a portfolio project for the course **DLBCSPJWD01 - Project Java and Web
Development**.

**Live demo:** https://space-news-aggregator-u14y.onrender.com
*(Hosted on a free tier - the first load after a period of inactivity may take up
to a minute while the server wakes up.)*

---

## Features

- **Real-time news feed** - the backend fetches the latest articles from the Spaceflight News API
- **Live search** - filters articles by title or summary as you type (handled by the backend)
- **Filter by source** - show only articles from a chosen outlet (NASA, ESA, SpaceNews, …)
- **Sort by date** - order the feed newest-first or oldest-first
- **Favourites** - save articles with the star button and view them in a dedicated view (stored on the server)
- **Responsive layout** - adapts from four cards down to one across desktop, tablet and mobile
- **Source badges** and **relative timestamps** (e.g. "3 hr ago") on each card
- **Live result count** showing how many articles match
- **Graceful states** - loading spinner, empty-search message, and an error message if the backend or API is unavailable
- **Safe rendering** - article text is escaped and URLs are validated to prevent HTML/script injection; a built-in SVG placeholder is shown when an article has no image
- **Backend caching** - the server caches results for 5 minutes so the external API isn't hit on every request

---

## Architecture

This app has a **Node/Express backend** and a **static frontend**, with one
important rule: the browser only ever talks to my own backend, never directly to
the external news API.

```
Browser (public/)  ──>  Express backend (server.js)  ──>  Spaceflight News API
    script.js              /api/articles                  api.spaceflightnewsapi.net
                           /api/sources
                           /api/favorites
```

- The **backend** (`server.js`) serves the frontend, fetches news from the
  Spaceflight News API, transforms and caches it, applies the search / source
  filter / sort, and exposes three API features (articles, sources, favourites).
- The **frontend** (`public/`) talks only to those endpoints and renders the
  returned articles as cards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend / server | Node.js + [Express 4](https://expressjs.com/) |
| Structure | HTML5 |
| Styling / responsive layout | CSS3 + Bootstrap 5 |
| Dynamic behaviour | Vanilla JavaScript (ES6) - no frontend framework |
| Data source | [Spaceflight News API v4](https://www.spaceflightnewsapi.net/) (REST, JSON, no API key required) |

The frontend makes no direct calls to the Spaceflight News API - all requests go
through the Express backend.

---

## Getting Started

### Prerequisites

- **Node.js 18 or newer** (the backend uses the built-in `fetch`)
- An **internet connection** (the app fetches live data from the Spaceflight News API)

### 1. Get the code

```bash
git clone https://github.com/kashishgada/space-news-aggregator.git
cd space-news-aggregator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run it

```bash
npm start
```

Then open <http://localhost:3000> in your browser.

> The port can be changed by setting the `PORT` environment variable, e.g.
> `PORT=8080 npm start`.

---

## Project Structure

```
space-news-aggregator/
├── server.js         # Express backend: serves the frontend, fetches + caches news, exposes the API
├── package.json      # Project metadata, dependencies (express) and the "start" script
├── favorites.json    # Where saved favourites are stored (created automatically)
└── public/           # Static frontend served by the backend
    ├── index.html    # Page markup: top bar, hero, news grid, footer
    ├── styles.css    # Dark theme, card styling, responsive rules
    └── script.js     # Calls the backend, renders cards, handles search, sort, source filter and favourites
```

---

## API

The backend exposes three features that the frontend consumes.

### `GET /api/articles`

Returns the news feed, with search, source filter and sort applied on the server.

| Query param | Values | Description |
|-------------|--------|-------------|
| `search` | any text | Keeps only articles whose title or summary contains the term (case-insensitive) |
| `source` | a source name | Keeps only articles from that source (empty = all sources) |
| `sort` | `newest` (default) / `oldest` | Orders the articles by publication date |

Example: `GET /api/articles?search=mars&source=NASA&sort=newest`

Returns: `{ "count": <number>, "articles": [ … ] }`

### `GET /api/sources`

Returns the unique list of news sources, used to build the filter dropdown.

Returns: `{ "sources": ["ESA", "NASA", "SpaceNews", …] }`

### `GET / POST / DELETE /api/favorites`

Save, list and remove favourite articles (stored server-side in `favorites.json`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/favorites` | List saved articles |
| `POST` | `/api/favorites` | Save an article (JSON body; only known fields are stored) |
| `DELETE` | `/api/favorites/:id` | Remove a saved article by id |

Returns: `{ "favorites": [ … ] }`

> **Known limitation:** favourites are currently stored in a single shared file,
> so they are not separated per user. Making favourites per-user (e.g. via an
> anonymous client id) would be the next step.

---

## Credits

- News data provided by the [Spaceflight News API](https://www.spaceflightnewsapi.net/).
- Layout grid and components from [Bootstrap 5](https://getbootstrap.com/).

---

## Author

**Gada Kashish Paresh** · Matriculation No. 102202657
Course: DLBCSPJWD01 - Project Java and Web Development

Created for educational purposes as part of university project work. Not
affiliated with any space agency or news provider.
