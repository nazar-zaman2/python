const INVIDIOUS = "https://yewtu.be"; // change if this instance is down

function searchVideos() {
  const q = document.getElementById("query").value.trim();
  if (!q) return;

  fetch(`${INVIDIOUS}/api/v1/search?q=${encodeURIComponent(q)}`)
    .then(res => res.json())
    .then(data => {
      const results = document.getElementById("results");
      results.innerHTML = "";

      data.forEach(item => {
        const id = item.videoId;
        const title = item.title;
        const thumbs = item.videoThumbnails || [];
        const thumb = (thumbs[2] && thumbs[2].url) || (thumbs[0] && thumbs[0].url) || "";

        const div = document.createElement("div");
        div.className = "video";
        div.innerHTML = `
          <img src="${thumb}" alt="${title}" onclick="playVideo('${id}')">
          <p class="title">${title}</p>
          <p class="author">${item.author}</p>
        `;
        results.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById("results").innerHTML = "<p>Something went wrong.</p>";
    });
}

function playVideo(id) {
  document.getElementById("player").innerHTML = `
    <iframe
      width="640"
      height="360"
      src="https://www.youtube.com/embed/${id}"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>
  `;
}
