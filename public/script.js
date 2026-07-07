const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=50';

// DOM elements
const container = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortDropdown');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const resultCount = document.getElementById('resultCount');

// Store all articles in memory
let articles = [];

// Placeholder image used when an article has no picture (or its image fails to load).
// It's an inline SVG encoded as a data-URI, so the graphic lives entirely in this file:
// no request to an external placeholder service, no extra network dependency, and no
// broken-image icon if the app is offline.
const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">' +
    '<rect width="400" height="200" fill="#1f2833"/>' +
    '<text x="200" y="105" font-family="Arial" font-size="16" fill="#9aa7b2" text-anchor="middle">No image</text>' +
    '</svg>');
// Exposed on window so the inline onerror handler in the card markup can reach it.
window.NO_IMAGE = NO_IMAGE;

// Fetch space news from the API and hand the results to displayNews.
async function fetchNews() {
    // Any network or non-2xx response is caught below and turned into a visible
    // message rather than a silent failure. The spinner is hidden in BOTH the success
    // and catch branches on purpose, so it never keeps spinning after a failed request.
    try {
        loadingSpinner.style.display = 'block';
        container.innerHTML = '';
        emptyState.style.display = 'none';

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        articles = data.results || [];

        loadingSpinner.style.display = 'none';
        displayNews(articles);
    } catch (error) {
        loadingSpinner.style.display = 'none';
        container.innerHTML = '<p class="text-danger">Error loading news. Please try again later.</p>';
        console.error('Fetch error:', error);
    }
}

// Render the given articles into the grid, or show the empty state if there are none.
function displayNews(newsArray) {
    container.innerHTML = '';

    if (newsArray.length === 0) {
        emptyState.style.display = 'block';
        resultCount.textContent = '';
        return;
    }

    emptyState.style.display = 'none';

    // Build every card into one big string and assign innerHTML a single time. This lets
    // the browser parse and lay out the whole grid in one pass, instead of triggering a
    // reflow on each iteration the way appending cards one-by-one in a loop would.
    const htmlCards = newsArray.map(article => createCardHTML(article)).join('');
    container.innerHTML = htmlCards;
    resultCount.textContent = `Showing ${newsArray.length} articles`;
}

// Create individual card HTML with fallbacks for missing data
function createCardHTML(article) {
    const title = article.title || 'Untitled';
    const summary = article.summary || 'No description available';
    const imageUrl = article.image_url || NO_IMAGE;
    const url = article.url || '#';
    const source = article.news_site || 'Unknown';
    const date = timeAgo(article.published_at);

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card h-100">
                <div class="card-media">
                    <span class="source-badge">${escapeHtml(source)}</span>
                    <img src="${imageUrl}" class="card-img-top" alt="${escapeHtml(title)}" onerror="this.src=window.NO_IMAGE">
                </div>
                <div class="card-body d-flex flex-column">
                    <span class="card-date">🕒 ${date}</span>
                    <h5 class="card-title">${escapeHtml(title)}</h5>
                    <p class="card-text">${escapeHtml(summary)}</p>
                    <a href="${url}" target="_blank" class="btn btn-outline-info mt-auto">Read More</a>
                </div>
            </div>
        </div>
    `;
}

// Escape user/API text so it can't inject markup when placed inside the card template.
function escapeHtml(text) {
    // Relies on the browser's own text-to-HTML encoding: setting textContent and reading
    // innerHTML back escapes <, >, & etc. — safer and simpler than a manual replace table.
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Turn a date into friendly text like "3 hr ago"
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

// Sort articles by date
function sortArticles(sortType) {
    let sorted = [...articles]; // Create a copy to avoid mutating original

    if (sortType === 'newest') {
        sorted.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } else if (sortType === 'oldest') {
        sorted.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
    }

    return sorted;
}

// Filter articles by search term
function filterArticles(searchTerm) {
    const term = searchTerm.toLowerCase();
    return articles.filter(article =>
        (article.title || '').toLowerCase().includes(term) ||
        (article.summary || '').toLowerCase().includes(term)
    );
}

// Apply both search and sort filters
function applyFilters() {
    const searchTerm = searchInput.value;
    const sortType = sortDropdown.value;

    // First filter, then sort
    let filtered = filterArticles(searchTerm);
    let sorted = sortArticles(sortType);

    // filterArticles and sortArticles each run against the full list independently, so we
    // intersect them: keep only articles present in both. The final `sorted` list is what
    // we render, since it preserves the chosen sort order while dropping non-matches.
    filtered = filtered.filter(article => sorted.includes(article));
    sorted = sorted.filter(article => filtered.includes(article));

    displayNews(sorted);
}

// Event listeners
searchInput.addEventListener('input', applyFilters);
sortDropdown.addEventListener('change', applyFilters);

// Load articles on page start
fetchNews();
