// Space News Aggregator - backend server
// -------------------------------------------------------------
// I built this Express server to do three jobs:
//   1. I serve my frontend files (from the /public folder).
//   2. I fetch the news from the external Spaceflight News API here - I did it
//      this way so the browser never calls that API directly, only this backend
//      does. That keeps all the fetching logic on my server.
//   3. I expose /api/articles, where I apply the search and sort on the server
//      and return a list of articles to the frontend.


// I import express here because it's the framework I use to define my route and
// to serve my static frontend files.
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// The external news API. Only this backend talks to it.
// I keep the URL in one constant so it's easy to find and change.
// Here I have set the limit to 75 articles, I can change that to 50 or 100.
const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=75';

// I serve my frontend (index.html, styles.css, script.js) from /public, so
// opening the site loads my page and all of its assets automatically.
app.use(express.static(path.join(__dirname, 'public')));

// I added this simple in-memory cache so I'm not calling the external API on every single request. 
// I only store the raw article list here - I still run search and sort on every request, so the cache never makes results stale, 
// it just saves me from re-downloading the same articles over and over.
let cache = { data: null, time: 0 };
// I set the cache lifetime to 5 minutes, because space news doesn't change every
// second, so refreshing at most once every 5 minutes is fresh enough for me.
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

// I use this function to fetch the articles from the external API (reusing the
// cache when it's still fresh) and to transform each one into the smaller shape my frontend actually needs.
async function getArticles() {
    // I grab the current time so I can check how old my cached data is.
    const now = Date.now();
    // If I already have cached data and it's smaller than 5 minutes, I return it straight away and skip the network call entirely.
    if (cache.data && now - cache.time < CACHE_MS) {
        return cache.data;
    }

    // If the cache was empty or stale, I go fetch fresh data from the API.
    const response = await fetch(API_URL);

    // I check the response is OK first - if the API failed, I throw here so my
    // route's catch block can handle it instead of me returning broken data.
    if (!response.ok) throw new Error('Upstream API error: ' + response.status);


    const json = await response.json();
    // I map over the results and keep only the fields I use, and I rename them to the names my frontend expects 
    // (e.g. image_url -> imageUrl). I default to an empty array with (json.results || []) so this doesn't crash if results is missing.
    const articles = (json.results || []).map(a => ({
        title: a.title,
        summary: a.summary,
        imageUrl: a.image_url,
        url: a.url,
        source: a.news_site,
        publishedAt: a.published_at
    }));

    // I save the fresh list back into the cache along with the current time, so the next requests within 5 minutes can reuse it.
    cache = { data: articles, time: now };
    return articles;
}

// I use this function to keep only the articles whose title or summary contains the search term the user typed.
function searchArticles(list, term) {
    // I lowercase and trim the term so my search is case-insensitive and ignores stray spaces. I use (term || '') so it still works when no term is given.
    const q = (term || '').toLowerCase().trim();
    // If there's no search term, I return the full list unchanged.
    if (!q) return list;
    // Otherwise I keep any article whose title OR summary contains the term. I lowercase each field so the comparison matches regardless of casing.
    return list.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q)
    );
}

// I use this function to return a copy of the list sorted by publication date.
function sortArticles(list, order) {
    // I copy the array first with [...list] so I don't mutate the original list (which is my cached data) while sorting.
    const sorted = [...list];
    // I subtract the two dates to sort: if the caller asked for 'oldest' I put older dates first, otherwise I default to newest first.
    sorted.sort((a, b) =>
        order === 'oldest'
            ? new Date(a.publishedAt) - new Date(b.publishedAt)
            : new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    return sorted;
}

// This is the one endpoint my frontend calls. I read ?search= and ?sort= from the query string, apply both on the server, and send the result back as JSON.
app.get('/api/articles', async (req, res) => {
    try {
        // I get the article list first (from cache or a fresh fetch).
        let articles = await getArticles();
        // Then I filter by the search term the frontend sent.
        articles = searchArticles(articles, req.query.search);
        // Then I sort by the requested order. I do search before sort so I'm only sorting the articles that actually matched.
        articles = sortArticles(articles, req.query.sort);
        // I return the count and the articles so the frontend can show both the cards and a "showing N articles" message.
        res.json({ count: articles.length, articles: articles });
    } catch (error) {
        // If anything above failed (usually the external API), I log it for myself and send a 502 with a friendly message instead of crashing.
        console.error('Error in /api/articles:', error);
        res.status(502).json({ error: 'Could not fetch space news.' });
    }
});

// I start the server here and log the address so I know where to open it.
app.listen(PORT, () => {
    console.log(`Space News Aggregator running on http://localhost:${PORT}`);
});
