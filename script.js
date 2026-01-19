// ===== Theme Management =====
const THEMES = ['default', 'purple', 'green', 'sunset'];
let currentThemeIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
  setupEventListeners();
});

function setupEventListeners() {
  const themeBtn = document.getElementById('themeBtn');
  const searchBtn = document.getElementById('searchBtn');
  const queryInput = document.getElementById('query');

  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  if (searchBtn) searchBtn.addEventListener('click', searchVideos);
  if (queryInput) queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVideos();
  });
}

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

// ===== Search Functionality =====
const API_INSTANCES = [
  'https://yewtu.be',
  'https://inv.tux.pizza'
];

function searchVideos() {
  const queryInput = document.getElementById('query');
  const searchStatus = document.getElementById('searchStatus');
  const resultsGrid = document.getElementById('results');
  const noResults = document.getElementById('noResults');
  
  const query = queryInput.value.trim();
  if (!query) {
    searchStatus.textContent = 'Please enter a search term';
    return;
  }

  searchStatus.textContent = '🔍 Searching...';
  searchStatus.style.color = '#00aaff';
  resultsGrid.innerHTML = '';
  if (noResults) noResults.classList.add('hidden');

  // Try first instance
  const url = `${API_INSTANCES[0]}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
  
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    })
    .then(results => {
      displayResults(results);
      searchStatus.textContent = `✅ Found ${results.length} results`;
      searchStatus.style.color = '#10b981';
    })
    .catch(err => {
      console.log('First instance failed, trying backup...');
      // Try second instance
      const backupUrl = `${API_INSTANCES[1]}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      
      fetch(backupUrl)
        .then(res => {
          if (!res.ok) throw new Error('Backup search failed');
          return res.json();
        })
        .then(results => {
          displayResults(results);
          searchStatus.textContent = `✅ Found ${results.length} results`;
          searchStatus.style.color = '#10b981';
        })
        .catch(err2 => {
          console.error('Both searches failed:', err2);
          searchStatus.textContent = '❌ Could not search videos. Try again.';
          searchStatus.style.color = '#ef4444';
          if (noResults) {
            noResults.classList.remove('hidden');
          }
        });
    });
}

function displayResults(results) {
  const resultsGrid = document.getElementById('results');
  const noResults = document.getElementById('noResults');
  const searchStatus = document.getElementById('searchStatus');
  
  resultsGrid.innerHTML = '';
  
  if (!Array.isArray(results) || results.length === 0) {
    searchStatus.textContent = '❌ No results found';
    searchStatus.style.color = '#ef4444';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }

  const videoResults = results.filter(item => item.type === 'video');
  
  if (videoResults.length === 0) {
    searchStatus.textContent = '❌ No videos found';
    searchStatus.style.color = '#ef4444';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }

  videoResults.forEach(video => {
    const card = createVideoCard(video);
    resultsGrid.appendChild(card);
  });
  
  if (noResults) noResults.classList.add('hidden');
}

function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';

  // Get thumbnail
  const thumbs = video.videoThumbnails || [];
  const thumbnail = (thumbs[1] && thumbs[1].url) || (thumbs[0] && thumbs[0].url) || '';

  // Format duration
  const duration = formatDuration(video.lengthSeconds || 0);

  const title = escapeHtml(video.title || 'Unknown');
  const author = escapeHtml(video.author || 'Unknown');

  card.innerHTML = `
    <div class="video-thumb">
      ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : '<div style="height: 100%; background: linear-gradient(135deg, #2d3748, #4a5568);"></div>'}
      <div class="play-overlay">
        <div class="play-icon">▶</div>
      </div>
    </div>
    <div class="video-info">
      <div class="video-title">${title}</div>
      <div class="video-meta">
        <span class="video-author">${author}</span>
        <span class="video-duration">${duration}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => playVideo(video.videoId));
  return card;
}

function playVideo(videoId) {
  const playerSection = document.getElementById('playerSection');
  const player = document.getElementById('player');
  
  if (!playerSection || !player) return;
  
  playerSection.classList.remove('hidden');
  
  player.innerHTML = `
    <div class="player-container">
      <iframe
        width="100%"
        height="500"
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
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
