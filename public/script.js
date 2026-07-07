// Space News Aggregator - frontend
// -------------------------------------------------------------
// I wrote this so my frontend talks ONLY to my own backend (/api/articles), never directly to the external Spaceflight News API. 
// My backend fetches the news, applies the search and sort, and returns the result,
// so when the user searches or sorts, they're really just talking to my own backend.

// I grab all the DOM elements I need up front, once, so I'm not repeatedly looking them up every time I render or handle an event.
const container = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortDropdown');
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

// I use this function to ask my backend for articles, sending the current search term and sort order as query parameters. 
// The backend does the actual filtering and sorting, so here I just pass along what the user picked.
async function loadArticles() {
    try {
        // I show the spinner and clear the old results while I wait, so the user can see something is happening.
        loadingSpinner.style.display = 'block';
        container.innerHTML = '';
        emptyState.style.display = 'none';

        // I build the query string from the search box and the sort dropdown.
        // URLSearchParams handles escaping for me so the values are safe in a URL.
        const params = new URLSearchParams({
            search: searchInput.value,
            sort: sortDropdown.value
        });

        // I call my own backend endpoint with those params.
        const res = await fetch('/api/articles?' + params.toString());
        // If the backend didn't respond OK, I throw so my catch block below can show the error message.
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);

        // I parse the JSON and hand the articles off to be rendered.
        const data = await res.json();
        loadingSpinner.style.display = 'none';
        displayNews(data.articles || []);
    } catch (error) {
        // If anything failed (network or backend), I hide the spinner and show a friendly error message instead of leaving the user with a blank page.
        loadingSpinner.style.display = 'none';
        container.innerHTML = '<p class="text-danger">Error loading news. Please try again later.</p>';
        console.error('Fetch error:', error);
    }
}

// I use this function to show the news cards that the backend returned.
function displayNews(newsArray) {
    // I clear the container first so I'm not appending on top of old results.
    container.innerHTML = '';

    // If there are no articles, I show my empty-state message and clear the count, then stop early - there's nothing to render.
    if (newsArray.length === 0) {
        emptyState.style.display = 'block';
        resultCount.textContent = '';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = newsArray.map(createCardHTML).join('');
    // I update the live count so the user sees how many articles matched.
    resultCount.textContent = `Showing ${newsArray.length} articles`;
}

// I use this function to build the HTML for a single card, with fallbacks in case any field is missing from an article.
function createCardHTML(article) {
    // I set a sensible default for each field so a missing value never shows up as blank or "undefined" on the page.
    const title = article.title || 'Untitled';
    const summary = article.summary || 'No description available';
    const imageUrl = article.imageUrl || NO_IMAGE;
    const url = article.url || '#';
    const source = article.source || 'Unknown';
    const date = timeAgo(article.publishedAt);

    // I return the card markup as a template string. I escape any text that came from the article (title, summary, source) 
    // so nobody can inject HTML through it, and I use onerror on the image to swap in my placeholder if it fails.
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

// I use this helper to escape HTML so article text can't inject markup or scripts into my page. 
// I let the browser do the escaping by setting textContent and then reading back the safely-encoded innerHTML.
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// I use this to turn a date string into friendly relative text like "3 hr ago".
function timeAgo(dateString) {
    const date = new Date(dateString);
    // If the date couldn't be parsed, I return an empty string rather than showing "Invalid Date" to the user.
    if (isNaN(date)) return '';
    // I work out how many minutes ago it was, then step up through the units (minutes -> hours -> days) and return as soon as one fits.
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hr ago' : ' hrs ago');
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    // Once it's older than about a month, I just show the plain date instead.
    return date.toLocaleDateString();
}

// I added this debounce helper so that while the user is typing, I don't fire a backend request on every single keystroke. 
// It waits until they've paused for a moment, then runs the function once.
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        // Each keystroke clears the previous pending timer and starts a new one,
        // so only the last one in a burst actually runs.
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// I wire up my event listeners here. Every search or sort triggers a new backend request. 
// I debounce the search by 300ms so typing feels smooth, but I let the sort dropdown fire immediately since it only changes on a deliberate click.
searchInput.addEventListener('input', debounce(loadArticles, 300));
sortDropdown.addEventListener('change', loadArticles);

// I call this once on page load so the news is fetched and shown right away, before the user does anything.
loadArticles();
