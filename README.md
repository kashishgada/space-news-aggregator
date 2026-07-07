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
- **Live search** — filters articles instantly as you type (no page reload)
- **Sort by date** — order the feed newest-first or oldest-first
- **Responsive layout** — adapts from four cards down to one across desktop, tablet and mobile
- **Source badges** and **relative timestamps** (e.g. "3 hr ago") on each card
- **Live result count** showing how many articles match
- **Graceful states** — loading spinner, empty-search message, and an error message if the API is unavailable
- **Safe rendering** — article text is escaped to prevent HTML injection; a built-in placeholder is shown when an article has no image

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling / responsive layout | CSS3 + Bootstrap 5 |
| Dynamic behaviour | Vanilla JavaScript (ES6) — no framework |
| Data source | [Spaceflight News API v4](https://www.spaceflightnewsapi.net/) (REST, JSON, no API key required) |

The app is entirely client-side. The browser fetches directly from the public
Spaceflight News API, which acts as the backend, so there is no server to install
or run.

---

## Getting Started

There is **no build step and nothing to install** — the project is plain HTML,
CSS and JavaScript.

### 1. Get the code

```bash
git clone https://github.com/kashishgada/space-news-aggregator.git
cd space-news-aggregator
```

(Or download the repository as a ZIP and extract it.)

### 2. Run it

**Option A — open directly**

Double-click `index.html`, or open it in your browser. This works in most modern
browsers because the API sends the required CORS headers.

**Option B — local server (recommended)**

If your browser blocks the request when opening the file directly, serve the
folder over a local web server:

Using the VS Code **Live Server** extension: right-click `index.html` →
*Open with Live Server*.

Or using Python (already installed on most systems):

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

An internet connection is required, since the app fetches live data from the
Spaceflight News API.

---

## Project Structure

```
space-news-aggregator/
├── index.html    # Page markup: top bar, hero, news grid, footer
├── styles.css    # Dark theme, card styling, responsive rules
└── script.js     # Fetches the API, renders cards, handles search & sort
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