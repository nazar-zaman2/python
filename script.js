// Use a reliable CORS proxy service
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const INVIDIOUS_API = "https://yewtu.be/api/v1/search";

function searchVideos() {
  const q = document.getElementById("query").value.trim();
  if (!q) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Searching...</p>";

  // Build search URL with parameters
  const searchParams = new URLSearchParams({
    q: q,
    type: "video"
  });
  
  const searchUrl = `${INVIDIOUS_API}?${searchParams}`;

  // Try direct fetch first
  fetch(searchUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(performSearch)
    .catch(err => {
      console.log("Direct request failed, trying alternative method...");
      // If direct fails, try with a different instance
      searchWithBackup(q, resultsDiv);
    });
}

function searchWithBackup(query, resultsDiv) {
  // Alternative: Use a different Invidious instance
  const altUrl = `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
  
  fetch(altUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(performSearch)
    .catch(err => {
      console.error("Search failed:", err);
      resultsDiv.innerHTML = "<p style='color: #ff6b6b;'><strong>Error:</strong> Could not fetch videos. Try a different search term or check your connection.</p>";
    });
}

function performSearch(data) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    return;
  }

  data.forEach(item => {
    if (item.type !== "video") return; // Skip non-video results
    
    const id = item.videoId;
    const title = item.title;
    const thumbs = item.videoThumbnails || [];
    const thumb = (thumbs[2] && thumbs[2].url) || (thumbs[0] && thumbs[0].url) || "";
    const author = item.author || "Unknown";
    const duration = item.lengthSeconds || "0";

    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <img src="${thumb}" alt="${title}" onclick="playVideo('${id}')">
      <p class="title">${title}</p>
      <p class="author">${author}</p>
      <p class="duration">${formatDuration(duration)}</p>
    `;
    resultsDiv.appendChild(div);
  });
}

function formatDuration(seconds) {
  const sec = parseInt(seconds);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function playVideo(id) {
  const playerDiv = document.getElementById("player");
  playerDiv.innerHTML = `
    <div class="video-player">
      <iframe
        width="100%"
        height="480"
        src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1"
        frameborder="0"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen>
      </iframe>
    </div>
  `;
  
  // Scroll to player
  playerDiv.scrollIntoView({ behavior: 'smooth' });
}
