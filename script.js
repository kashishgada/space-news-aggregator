
const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=50';
const container = document.getElementById("newsContainer");
const searchInput = document.getElementById("searchInput");
let articles = [];

// Fetch space news
async function fetchNews() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        articles = data.results;
        displayNews(articles);
    } catch (error) {
        container.innerHTML = "<p class='text-danger'>Error loading news. Please try again later.</p>";
        console.error(error);
    }
}

// Display news cards
function displayNews(newsArray) {
    container.innerHTML = "";
    newsArray.forEach(article => {
        container.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${article.image_url}" class="card-img-top" alt="News Image">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${article.title}</h5>
                    <p class="card-text">${article.summary.substring(0, 100)}...</p>
                    <a href="${article.url}" target="_blank" class="btn btn-outline-info mt-auto">Read More</a>
                </div>
            </div>
        </div>
        `;
    });
}

// Search filter
searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(value)
    );
    displayNews(filtered);
});

// Load on start
fetchNews();
    