// Space News Aggregator - backend server
// -------------------------------------------------------------
// This Express server serves the frontend and exposes three API features the
// frontend uses:
//   /api/articles   - the news feed, with search, sort and source filtering
//   /api/sources    - the list of news sources, for the filter dropdown
//   /api/favorites  - save / list / remove favourite articles (stored in a file)
// The browser never calls the external Spaceflight News API directly - only this
// backend does, so all the fetching and data handling stays on the server.

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=75';
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

app.use(express.json()); // parse JSON bodies so I can read POSTed favourites
app.use(express.static(path.join(__dirname, 'public')));

// Cache the fetched articles for a few minutes so I don't hit the external API
// on every request.
let cache = { data: null, time: 0 };
const CACHE_MS = 5 * 60 * 1000; // 5 minutes
let inFlight = null; // shared promise so parallel requests trigger one fetch

async function getArticles() {
    const now = Date.now();
    if (cache.data && now - cache.time < CACHE_MS) {
        return cache.data;
    }
    if (!inFlight) {
        inFlight = fetchArticles().finally(() => { inFlight = null; });
    }
    return inFlight;
}

async function fetchArticles() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Upstream API error: ' + response.status);

    const json = await response.json();
    const articles = (json.results || []).map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        imageUrl: a.image_url,
        url: a.url,
        source: a.news_site,
        publishedAt: a.published_at
    }));

    cache = { data: articles, time: Date.now() };
    return articles;
}

// Keep only articles whose title or summary contains the search term.
function searchArticles(list, term) {
    const q = (term || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q)
    );
}

// Keep only articles from the chosen source (empty = all sources).
function filterBySource(list, source) {
    if (!source) return list;
    return list.filter(a => a.source === source);
}

// Return a copy of the list sorted by publication date.
function sortArticles(list, order) {
    const time = a => new Date(a.publishedAt).getTime() || 0;
    const sorted = list.map(a => [time(a), a]);
    sorted.sort((x, y) => (order === 'oldest' ? x[0] - y[0] : y[0] - x[0]));
    return sorted.map(([, a]) => a);
}

// Read the saved favourites from the JSON file (empty list if it doesn't exist).
// Any other error (e.g. a corrupted file) is rethrown so a later save can't
// silently overwrite the user's data with an empty list.
function readFavorites() {
    let raw;
    try {
        raw = fs.readFileSync(FAVORITES_FILE, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
}

// Write the favourites back to the JSON file.
function writeFavorites(list) {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(list, null, 2));
}

// --- News feed: search, source filter and sort all applied on the server ---
app.get('/api/articles', async (req, res) => {
    try {
        let articles = await getArticles();
        articles = searchArticles(articles, req.query.search);
        articles = filterBySource(articles, req.query.source);
        articles = sortArticles(articles, req.query.sort);
        res.json({ count: articles.length, articles: articles });
    } catch (error) {
        console.error('Error in /api/articles:', error);
        res.status(502).json({ error: 'Could not fetch space news.' });
    }
});

// --- The unique list of sources, used to build the filter dropdown ---
app.get('/api/sources', async (req, res) => {
    try {
        const articles = await getArticles();
        const sources = [...new Set(articles.map(a => a.source).filter(Boolean))].sort();
        res.json({ sources: sources });
    } catch (error) {
        console.error('Error in /api/sources:', error);
        res.status(502).json({ error: 'Could not load sources.' });
    }
});

// Keep only the fields an article is supposed to have, so arbitrary request
// bodies never end up stored on disk (and later rendered by the frontend).
function pickArticleFields(body) {
    return {
        id: String(body.id),
        title: String(body.title || ''),
        summary: String(body.summary || ''),
        imageUrl: String(body.imageUrl || ''),
        url: String(body.url || ''),
        source: String(body.source || ''),
        publishedAt: String(body.publishedAt || '')
    };
}

// --- Favourites: list saved articles ---
app.get('/api/favorites', (req, res) => {
    try {
        res.json({ favorites: readFavorites() });
    } catch (error) {
        console.error('Error in GET /api/favorites:', error);
        res.status(500).json({ error: 'Could not read favourites.' });
    }
});

// --- Favourites: save an article (ignored if already saved) ---
app.post('/api/favorites', (req, res) => {
    const body = req.body;
    if (!body || body.id === undefined) {
        return res.status(400).json({ error: 'Invalid article.' });
    }
    try {
        const article = pickArticleFields(body);
        const favorites = readFavorites();
        if (!favorites.some(f => String(f.id) === article.id)) {
            favorites.push(article);
            writeFavorites(favorites);
        }
        res.json({ favorites: favorites });
    } catch (error) {
        console.error('Error in POST /api/favorites:', error);
        res.status(500).json({ error: 'Could not save favourite.' });
    }
});

// --- Favourites: remove an article by id ---
app.delete('/api/favorites/:id', (req, res) => {
    try {
        const id = String(req.params.id);
        const favorites = readFavorites().filter(f => String(f.id) !== id);
        writeFavorites(favorites);
        res.json({ favorites: favorites });
    } catch (error) {
        console.error('Error in DELETE /api/favorites:', error);
        res.status(500).json({ error: 'Could not remove favourite.' });
    }
});

app.listen(PORT, () => {
    console.log(`Space News Aggregator running on http://localhost:${PORT}`);
});
