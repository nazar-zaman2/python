// ===== Theme Management =====
const THEMES = ['default', 'purple', 'green', 'sunset'];
let currentThemeIndex = 0;

const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', toggleTheme);

function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
  const theme = THEMES[currentThemeIndex];
  
  if (theme !== 'default') {
    document.body.className = `theme-${theme}`;
  } else {
    document.body.className = '';
  }
  
  localStorage.setItem('flowplay-theme', theme);
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('flowplay-theme') || 'default';
  const index = THEMES.indexOf(savedTheme);
  if (index !== -1) {
    currentThemeIndex = index;
    if (savedTheme !== 'default') {
      document.body.className = `theme-${savedTheme}`;
    }
  }
}

loadTheme();

// ===== Search Functionality =====
const queryInput = document.getElementById('query');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const playerSection = document.getElementById('playerSection');
const player = document.getElementById('player');
const resultsGrid = document.getElementById('results');
const noResults = document.getElementById('noResults');

searchBtn.addEventListener('click', searchVideos);
queryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchVideos();
});

// Invidious API instances to try
const API_INSTANCES = [
  'https://yewtu.be',
  'https://inv.tux.pizza',
  'https://invidious.io',
  'https://inv.nadeko.net'
];

async function searchVideos() {
  const query = queryInput.value.trim();
  if (!query) return;

  searchStatus.textContent = '🔍 Searching...';
  searchStatus.style.color = 'var(--accent-secondary)';
  resultsGrid.innerHTML = '';
  noResults.classList.add('hidden');
  playerSection.classList.add('hidden');

  let results = null;

  // Try each API instance
  for (const instance of API_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        results = await response.json();
        break;
      }
    } catch (err) {
      console.log(`Instance ${instance} failed, trying next...`);
      continue;
    }
  }

  if (!results || !Array.isArray(results) || results.length === 0) {
    searchStatus.textContent = '❌ No results found. Try another search.';
    searchStatus.style.color = 'var(--error-color)';
    noResults.classList.remove('hidden');
    return;
  }

  displayResults(results);
  searchStatus.textContent = `✅ Found ${results.length} results`;
  searchStatus.style.color = 'var(--success-color)';
}

function displayResults(results) {
  resultsGrid.innerHTML = '';
  
  const videoResults = results.filter(item => item.type === 'video');
  
  if (videoResults.length === 0) {
    noResults.classList.remove('hidden');
    searchStatus.textContent = '❌ No videos found';
    searchStatus.style.color = 'var(--error-color)';
    return;
  }

  videoResults.forEach(video => {
    const card = createVideoCard(video);
    resultsGrid.appendChild(card);
  });
}

function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';

  // Get thumbnail
  const thumbs = video.videoThumbnails || [];
  const thumbnail = (thumbs[1]?.url) || (thumbs[0]?.url) || '';

  // Format duration
  const duration = formatDuration(video.lengthSeconds || 0);

  card.innerHTML = `
    <div class="video-thumb">
      ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}">` : '<div style="height: 100%; background: linear-gradient(135deg, #2d3748, #4a5568);"></div>'}
      <div class="play-overlay">
        <div class="play-icon">▶</div>
      </div>
    </div>
    <div class="video-info">
      <div class="video-title">${escapeHtml(video.title)}</div>
      <div class="video-meta">
        <span class="video-author">${escapeHtml(video.author || 'Unknown')}</span>
        <span class="video-duration">${duration}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => playVideo(video.videoId));
  return card;
}

function playVideo(videoId) {
  playerSection.classList.remove('hidden');
  
  player.innerHTML = `
    <div class="player-container">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen>
      </iframe>
    </div>
  `;

  playerSection.scrollIntoView({ behavior: 'smooth' });
}

function formatDuration(seconds) {
  const sec = parseInt(seconds) || 0;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
