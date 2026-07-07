# Space News Aggregator

A real-time web application that gathers the latest space and tech news into a
single, responsive feed. Instead of checking NASA, SpaceX, ESA, ISRO and various
news outlets separately, users get one clean interface with live search and
sorting.

Built as a portfolio project for the course **DLBCSPJWD01 — Project Java and Web
Development**.

---

## Features

- **Real-time news feed** — fetches the latest articles from the Spaceflight News API
- **Live search** — filters articles as you type (no page reload)
- **Sort by date** — order the feed newest-first or oldest-first
- **Responsive layout** — adapts from four cards down to one across desktop, tablet and mobile
- **Source badges** and **relative timestamps** (e.g. "3 hr ago") on each card
- **Live result count** showing how many articles match
- **Graceful states** — loading spinner, empty-search message, and an error message if the API is unavailable
- **Safe rendering** — article text is escaped to prevent HTML injection; a built-in placeholder is shown when an article has no image
- **Backend caching** — the server caches results for 5 minutes so the external API isn't hit on every request

---

## Architecture

This app has a small **Node/Express backend** and a **static frontend**, with one
important rule: the browser only ever talks to my own backend, never directly to
the external news API.

```
Browser (public/)  ──>  Express backend (server.js)  ──>  Spaceflight News API
    script.js                 /api/articles                api.spaceflightnewsapi.net
```

- The **backend** ([server.js](server.js)) serves the frontend, fetches news from the
  Spaceflight News API, applies the search and sort, caches the result for 5
  minutes, and exposes a single endpoint: `GET /api/articles?search=&sort=`.
- The **frontend** ([public/](public/)) sends the current search term and sort order to
  that endpoint and renders the returned articles as cards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend / server | Node.js + [Express 4](https://expressjs.com/) |
| Structure | HTML5 |
| Styling / responsive layout | CSS3 + Bootstrap 5 |
| Dynamic behaviour | Vanilla JavaScript (ES6) — no frontend framework |
| Data source | [Spaceflight News API v4](https://www.spaceflightnewsapi.net/) (REST, JSON, no API key required) |

The frontend makes no direct calls to the Spaceflight News API — all requests go
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
├── server.js         # Express backend: serves the frontend, fetches + caches news, exposes /api/articles
├── package.json      # Project metadata, dependencies (express) and the "start" script
└── public/           # Static frontend served by the backend
    ├── index.html    # Page markup: top bar, hero, news grid, footer
    ├── styles.css    # Dark theme, card styling, responsive rules
    └── script.js     # Calls /api/articles, renders cards, handles search & sort
```

---

## API

The backend exposes a single endpoint that the frontend consumes.

`GET /api/articles`

| Query param | Values | Description |
|-------------|--------|-------------|
| `search` | any text | Keeps only articles whose title or summary contains the term (case-insensitive) |
| `sort` | `newest` (default) / `oldest` | Orders the articles by publication date |

**Example response**

```json
{
  "count": 75,
  "articles": [
    {
      "title": "…",
      "summary": "…",
      "imageUrl": "…",
      "url": "…",
      "source": "…",
      "publishedAt": "…"
    }
  ]
}
```

---

## Credits

- News data provided by the [Spaceflight News API](https://www.spaceflightnewsapi.net/).
- Layout grid and components from [Bootstrap 5](https://getbootstrap.com/).

---

## Author

**Gada Kashish Paresh** · Matriculation No. 102202657
Course: DLBCSPJWD01 — Project Java and Web Development

Created for educational purposes as part of university project work. Not
affiliated with any space agency or news provider.
