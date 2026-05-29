const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=75';

// DOM elements
const container = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortDropdown');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');

// Store all articles in memory
let articles = [];

// Fetch space news from API
async function fetchNews() {
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

// Display news cards with proper error handling
function displayNews(newsArray) {
    container.innerHTML = '';

    if (newsArray.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Build HTML for all cards at once (better performance than += in loop)
    const htmlCards = newsArray.map(article => createCardHTML(article)).join('');
    container.innerHTML = htmlCards;
}

// Create individual card HTML with fallbacks for missing data
function createCardHTML(article) {
    const title = article.title || 'Untitled';
    const summary = article.summary ? article.summary.substring(0, 100) : 'No description available';
    const imageUrl = article.image_url || 'https://via.placeholder.com/400x200?text=No+Image';
    const url = article.url || '#';

    return `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="Article image" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(title)}</h5>
                    <p class="card-text">${escapeHtml(summary)}...</p>
                    <a href="${url}" target="_blank" class="btn btn-outline-info mt-auto">Read More</a>
                </div>
            </div>
        </div>
    `;
}

// Escape HTML to prevent injection vulnerabilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        article.title.toLowerCase().includes(term) ||
        (article.summary && article.summary.toLowerCase().includes(term))
    );
}

// Apply both search and sort filters
function applyFilters() {
    const searchTerm = searchInput.value;
    const sortType = sortDropdown.value;

    // First filter, then sort
    let filtered = filterArticles(searchTerm);
    let sorted = sortArticles(sortType);

    // Apply both: filter the sorted results
    filtered = filtered.filter(article => sorted.includes(article));
    sorted = sorted.filter(article => filtered.includes(article));

    displayNews(sorted);
}

// Event listeners
searchInput.addEventListener('input', applyFilters);
sortDropdown.addEventListener('change', applyFilters);

// Load articles on page start
fetchNews();
