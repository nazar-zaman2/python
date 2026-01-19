// Multiple Invidious instances for fallback
const INVIDIOUS_APIS = [
  "https://inv.nadeko.net",
  "https://invidious.io",
  "https://yewtu.be",
  "https://inv.tux.pizza"
];
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function searchVideos() {
  const q = document.getElementById("query").value.trim();
  if (!q) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Searching...</p>";

  // Try multiple instances in sequence
  searchWithFallback(q, 0, resultsDiv);
}

function searchWithFallback(query, apiIndex, resultsDiv) {
  if (apiIndex >= INVIDIOUS_APIS.length) {
    // All direct requests failed, try CORS proxy
    searchWithCorsProxy(query, resultsDiv);
    return;
  }

  const searchUrl = `${INVIDIOUS_APIS[apiIndex]}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
  
  fetch(searchUrl, { timeout: 5000 })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        performSearch(data);
      } else {
        throw new Error("No data");
      }
    })
    .catch(err => {
      console.warn(`API ${apiIndex} failed:`, err.message);
      // Try next instance
      searchWithFallback(query, apiIndex + 1, resultsDiv);
    });
}

function searchWithCorsProxy(query, resultsDiv) {
  const searchUrl = `${INVIDIOUS_APIS[0]}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
  
  fetch(CORS_PROXY + encodeURIComponent(searchUrl))
    .then(res => res.text())
    .then(data => {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          performSearch(parsed);
        } else {
          resultsDiv.innerHTML = "<p>No results found.</p>";
        }
      } catch (e) {
        throw new Error("Parse error");
      }
    })
    .catch(err => {
      console.error("All search methods failed:", err);
      resultsDiv.innerHTML = "<p style='color: #ff6b6b;'>Unable to search videos. Please try again or check your internet connection.</p>";
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
