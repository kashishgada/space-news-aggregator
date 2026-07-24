// Space News Aggregator - frontend
// -------------------------------------------------------------
// The frontend talks only to my own backend, never to the external API.
// It uses three backend features: the news feed (/api/articles with search,
// sort and source filter), the source list (/api/sources), and favourites
// (/api/favorites) which let the user save articles.

// I grab all the DOM elements I need up front, once, so I'm not repeatedly looking them up every time I render or handle an event.
const container = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortDropdown');
const sourceDropdown = document.getElementById('sourceDropdown');
const favBtn = document.getElementById('favBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const resultCount = document.getElementById('resultCount');

// I build a placeholder image as an inline SVG so I have a fallback that needs no network request. I show this whenever an article has no picture of its own.
const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">' +
    '<rect width="400" height="200" fill="#1f2833"/>' +
    '<text x="200" y="105" font-family="Arial" font-size="16" fill="#9aa7b2" text-anchor="middle">No image</text>' +
    '</svg>');
// I put it on window so the inline onerror handler in my card HTML can reach it when an image URL fails to load.
window.NO_IMAGE = NO_IMAGE; // used by the image onerror handler

let favoriteIds = new Set();   // ids of articles the user has favourited
let currentArticles = [];      // the articles currently on screen
let showingFavorites = false;  // whether the favourites view is active

// Load the ids of saved favourites so the stars show the correct state.
async function loadFavoriteIds() {
    try {
        const res = await fetch('/api/favorites');
        const data = await res.json();
        favoriteIds = new Set((data.favorites || []).map(f => String(f.id)));
    } catch (error) {
        console.error('Could not load favourites:', error);
    }
}

// Fill the source filter dropdown from the backend.
async function loadSources() {
    try {
        const res = await fetch('/api/sources');
        const data = await res.json();
        (data.sources || []).forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Could not load sources:', error);
    }
}

// Load the news feed, sending the current search, sort and source to the backend.
async function loadArticles() {
    showingFavorites = false;
    favBtn.classList.remove('active');
    favBtn.textContent = '\u2605 Favourites';

    try {
        loadingSpinner.style.display = 'block';
        container.innerHTML = '';
        emptyState.style.display = 'none';

        const params = new URLSearchParams({
            search: searchInput.value,
            sort: sortDropdown.value,
            source: sourceDropdown.value
        });

        const res = await fetch('/api/articles?' + params.toString());
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);

        const data = await res.json();
        loadingSpinner.style.display = 'none';
        currentArticles = data.articles || [];
        displayNews(currentArticles);
    } catch (error) {
        loadingSpinner.style.display = 'none';
        container.innerHTML = '<p class="text-danger">Error loading news. Please try again later.</p>';
        console.error('Fetch error:', error);
    }
}

// Load the saved favourites and show them in the grid.
async function loadFavorites() {
    try {
        loadingSpinner.style.display = 'block';
        container.innerHTML = '';
        emptyState.style.display = 'none';

        const res = await fetch('/api/favorites');
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);

        const data = await res.json();
        loadingSpinner.style.display = 'none';
        currentArticles = data.favorites || [];
        favoriteIds = new Set(currentArticles.map(f => String(f.id)));
        displayNews(currentArticles);
    } catch (error) {
        loadingSpinner.style.display = 'none';
        container.innerHTML = '<p class="text-danger">Error loading favourites.</p>';
        console.error(error);
    }
}

// Show a list of articles as cards.
function displayNews(list) {
    container.innerHTML = '';

    if (list.length === 0) {
        emptyState.style.display = 'block';
        resultCount.textContent = '';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = list.map(createCardHTML).join('');
    resultCount.textContent = `Showing ${list.length} ${list.length === 1 ? 'article' : 'articles'}`;
}

// Build the HTML for one news card, including its favourite (star) button.
function createCardHTML(article) {
    const title = article.title || 'Untitled';
    const summary = article.summary || 'No description available';
    const imageUrl = safeUrl(article.imageUrl) || NO_IMAGE;
    const url = safeUrl(article.url) || '#';
    const source = article.source || 'Unknown';
    const date = timeAgo(article.publishedAt);
    const isFav = favoriteIds.has(String(article.id));

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card h-100">
                <div class="card-media">
                    <span class="source-badge">${escapeHtml(source)}</span>
                    <button class="fav-btn ${isFav ? 'is-fav' : ''}" data-id="${escapeHtml(article.id)}" title="Save to favourites">${isFav ? '\u2605' : '\u2606'}</button>
                    <img src="${escapeHtml(imageUrl)}" class="card-img-top" alt="${escapeHtml(title)}" onerror="this.src=window.NO_IMAGE">
                </div>
                <div class="card-body d-flex flex-column">
                    <span class="card-date">\u{1F550} ${date}</span>
                    <h5 class="card-title">${escapeHtml(title)}</h5>
                    <p class="card-text">${escapeHtml(summary)}</p>
                    <a href="${escapeHtml(url)}" target="_blank" class="btn btn-outline-info mt-auto">Read More</a>
                </div>
            </div>
        </div>
    `;
}

// Save or remove a favourite when its star is clicked.
async function toggleFavorite(id) {
    id = String(id);
    const article = currentArticles.find(a => String(a.id) === id);

    try {
        if (favoriteIds.has(id)) {
            const res = await fetch('/api/favorites/' + encodeURIComponent(id), { method: 'DELETE' });
            if (!res.ok) throw new Error(`Backend error: ${res.status}`);
            favoriteIds.delete(id);
        } else if (article) {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(article)
            });
            if (!res.ok) throw new Error(`Backend error: ${res.status}`);
            favoriteIds.add(id);
        }
    } catch (error) {
        console.error('Could not update favourite:', error);
        return;
    }

    // Refresh the view: reload favourites if we're in that view, otherwise just
    // re-render so the star updates.
    if (showingFavorites) {
        loadFavorites();
    } else {
        displayNews(currentArticles);
    }
}

// Escape text so article content can't inject HTML. Quotes are escaped too,
// because the values are also used inside HTML attributes.
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Only allow http(s) links; anything else (e.g. javascript:) is dropped.
function safeUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
}

// Turn a date into friendly text like "3 hr ago".
function timeAgo(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hr ago' : ' hrs ago');
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    return date.toLocaleDateString();
}

// Small debounce so typing doesn't call the backend on every keystroke.
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Star clicks are handled here (event delegation) since the cards are
// re-rendered as plain HTML and carry the article id in a data attribute.
container.addEventListener('click', (event) => {
    const btn = event.target.closest('.fav-btn');
    if (btn) toggleFavorite(btn.dataset.id);
});

// Switch between the normal feed and the favourites view.
favBtn.addEventListener('click', () => {
    showingFavorites = !showingFavorites;
    if (showingFavorites) {
        favBtn.classList.add('active');
        favBtn.textContent = '\u2190 Back to all news';
        loadFavorites();
    } else {
        loadArticles();
    }
});

searchInput.addEventListener('input', debounce(loadArticles, 300));
sortDropdown.addEventListener('change', loadArticles);
sourceDropdown.addEventListener('change', loadArticles);

// Start: load favourite ids and sources, then the feed.
(async function init() {
    await loadFavoriteIds();
    await loadSources();
    loadArticles();
})();
