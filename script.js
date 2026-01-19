const INVIDIOUS_API = "https://inv.nadeko.net"; // Invidious instance for searching
const CORS_PROXY = "https://api.allorigins.win/raw?url="; // CORS proxy for GitHub Pages

function searchVideos() {
  const q = document.getElementById("query").value.trim();
  if (!q) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Searching...</p>";

  const searchUrl = `${INVIDIOUS_API}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
  
  // Try direct request first, then fallback to CORS proxy
  fetch(searchUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(performSearch)
    .catch(err => {
      console.warn("Direct request failed, trying CORS proxy...");
      return fetch(CORS_PROXY + encodeURIComponent(searchUrl))
        .then(res => res.json())
        .then(data => {
          if (typeof data === 'string') return JSON.parse(data);
          return data;
        })
        .then(performSearch)
        .catch(corsErr => {
          console.error("Both requests failed:", corsErr);
          resultsDiv.innerHTML = "<p>Error searching videos. Check console for details.</p>";
        });
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
