// ===== CONFIGURACIÓN =====
const JIOSAAVN_API = 'https://jiosaavn-api.vercel.app/api/search/songs?query=';
const CORS_PROXY = 'https://corsproxy.io/?';

let currentAudio = null;
let playlists = {};
let currentPlaylist = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
    setupEventListeners();
});

function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', search);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') search();
        });
    }
}

// ===== BÚSQUEDA Y RESULTADOS =====
async function search() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const resultsDiv = document.getElementById('resultsContainer');
    showLoading(true);

    try {
        const searchUrl = JIOSAAVN_API + encodeURIComponent(query);
        const proxiedUrl = CORS_PROXY + encodeURIComponent(searchUrl);
        
        const response = await fetch(proxiedUrl);
        const data = await response.json();
        
        showLoading(false);
        
        if (data.results && data.results.length > 0) {
            displayResults(data.results);
        } else {
            resultsDiv.innerHTML = '<p style="color: #E7E7E7; text-align: center;">No se encontraron resultados</p>';
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showLoading(false);
        resultsDiv.innerHTML = '<p style="color: #D10000; text-align: center;">Error al buscar. Verifica tu conexión e intenta de nuevo.</p>';
    }
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'flex' : 'none';
    }
}

function displayResults(results) {
    const resultsDiv = document.getElementById('resultsContainer');
    resultsDiv.innerHTML = '';

    results.forEach((song) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track';
        
        const title = song.title || 'Desconocida';
        const artist = song.artists && song.artists.primary 
            ? song.artists.primary[0].name 
            : 'Artista desconocido';
        const image = song.image && song.image.length > 0 ? song.image[0].url : '';
        const streamUrl = song.url || '';
        const downloadUrl = song.downloadUrl && song.downloadUrl.length > 0 
            ? song.downloadUrl[song.downloadUrl.length - 1].url 
            : null;

        trackDiv.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                ${image ? `<img src="${image}" alt="${title}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;">` : ''}
                <div style="flex: 1;">
                    <h4 style="margin: 0; color: #D10000;">${title}</h4>
                    <p style="margin: 5px 0 0 0; color: #E7E7E7; font-size: 0.9em;">${artist}</p>
                </div>
            </div>
            <div class="audio-controls">
                <button onclick="playSong('${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}', '${streamUrl}')">▶ Play</button>
                <button onclick="addToPlaylistClick('${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}', '${streamUrl}')">+ Playlist</button>
                ${downloadUrl ? `<button onclick="downloadSong('${downloadUrl}', '${title}')">⬇ Descargar</button>` : ''}
            </div>
        `;
        
        resultsDiv.appendChild(trackDiv);
    });
}

// ===== REPRODUCCIÓN =====
function playSong(title, artist, url) {
    if (!url) {
        alert('Enlace de reproducción no disponible');
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
    }

    currentAudio = new Audio(url);
    currentAudio.crossOrigin = 'anonymous';
    currentAudio.play().catch(e => {
        console.error('Error al reproducir:', e);
        alert('No se pudo reproducir. Intenta con otra canción.');
    });

    const resultsDiv = document.getElementById('resultsContainer');
    const playerDiv = document.createElement('div');
    playerDiv.className = 'track';
    playerDiv.style.backgroundColor = '#9E9E9E';
    playerDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            <h3 style="margin: 0; color: #D10000;">${title}</h3>
            <p style="margin: 5px 0 0 0; color: #E7E7E7; font-size: 0.9em;">${artist}</p>
        </div>
        <div class="audio-controls">
            <button onclick="pauseSong()">⏸ Pausar</button>
            <button onclick="resumeSong()">▶ Reanudar</button>
            <button onclick="stopSong()">⏹ Detener</button>
        </div>
    `;
    
    resultsDiv.insertBefore(playerDiv, resultsDiv.firstChild);
}

function pauseSong() {
    if (currentAudio) currentAudio.pause();
}

function resumeSong() {
    if (currentAudio) currentAudio.play();
}

function stopSong() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
}

// ===== DESCARGA =====
async function downloadSong(url, title) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${title}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error al descargar:', error);
        alert('No se pudo descargar. Intenta de nuevo.');
    }
}

// ===== PLAYLISTS =====
function loadPlaylists() {
    const saved = localStorage.getItem('nixboxPlaylists');
    if (saved) {
        try {
            playlists = JSON.parse(saved);
        } catch (e) {
            playlists = {};
        }
    }
    updatePlaylistUI();
}

function savePlaylists() {
    localStorage.setItem('nixboxPlaylists', JSON.stringify(playlists));
}

function addToPlaylistClick(title, artist, url) {
    if (!title) return;
    
    const playlistNames = Object.keys(playlists);
    
    if (playlistNames.length === 0) {
        createNewPlaylist(title, artist, url);
    } else {
        showPlaylistSelector(title, artist, url);
    }
}

function createNewPlaylist(title, artist, url) {
    const name = prompt('Nombre de la nueva playlist:');
    if (name && name.trim()) {
        const cleanName = name.trim();
        if (!playlists[cleanName]) {
            playlists[cleanName] = [{ title, artist, url }];
            savePlaylists();
            updatePlaylistUI();
            alert(`Creada: ${cleanName}`);
        } else {
            alert('La playlist ya existe');
        }
    }
}

function showPlaylistSelector(title, artist, url) {
    const playlistNames = Object.keys(playlists);
    let html = `<div class="modal-overlay" id="playlistSelectorModal">
        <div class="modal-content">
            <h2>Agregar a Playlist</h2>
            <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">`;
    
    playlistNames.forEach(playlistName => {
        html += `<button onclick="addToExistingPlaylist('${playlistName}', '${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}', '${url}')" style="display: block; width: 100%; padding: 10px; margin: 5px 0; background: #D10000; color: white; border: none; border-radius: 4px; cursor: pointer;">${playlistName}</button>`;
    });
    
    html += `<button onclick="createNewPlaylist('${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}', '${url}')" style="display: block; width: 100%; padding: 10px; margin: 15px 0 5px 0; background: #00a8ff; color: white; border: none; border-radius: 4px; cursor: pointer;">+ Nueva Playlist</button>`;
    
    html += `</div>
            <button onclick="closePlaylistSelector()" style="width: 100%; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cerrar</button>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('playlistSelectorModal').addEventListener('click', (e) => {
        if (e.target.id === 'playlistSelectorModal') {
            closePlaylistSelector();
        }
    });
}

function closePlaylistSelector() {
    const modal = document.getElementById('playlistSelectorModal');
    if (modal) modal.remove();
}

function addToExistingPlaylist(playlistName, title, artist, url) {
    if (!playlists[playlistName].some(s => s.title === title)) {
        playlists[playlistName].push({ title, artist, url });
        savePlaylists();
        alert(`Agregado a ${playlistName}`);
    } else {
        alert('Ya está en la playlist');
    }
    closePlaylistSelector();
}

function updatePlaylistUI() {
    const sidebarPlaylists = document.getElementById('playlistItems');
    if (!sidebarPlaylists) return;
    
    sidebarPlaylists.innerHTML = '';
    
    Object.keys(playlists).forEach(playlistName => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '10px';
        item.style.backgroundColor = '#2a2a2a';
        item.style.borderRadius = '4px';
        item.style.marginBottom = '5px';
        item.style.cursor = 'pointer';
        
        const nameDiv = document.createElement('div');
        nameDiv.style.flex = '1';
        nameDiv.style.cursor = 'pointer';
        nameDiv.innerHTML = `<strong>${playlistName}</strong> (${playlists[playlistName].length})`;
        nameDiv.onclick = () => selectPlaylist(playlistName);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.style.background = '#D10000';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'white';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = () => deletePlaylist(playlistName);
        
        item.appendChild(nameDiv);
        item.appendChild(deleteBtn);
        sidebarPlaylists.appendChild(item);
    });
}

function selectPlaylist(name) {
    currentPlaylist = name;
    displayPlaylistTracks();
}

function displayPlaylistTracks() {
    if (!currentPlaylist) return;

    const resultsDiv = document.getElementById('resultsContainer');
    const tracks = playlists[currentPlaylist];
    
    resultsDiv.innerHTML = `<h2 style="color: #D10000; margin-bottom: 15px;">📋 ${currentPlaylist} (${tracks.length})</h2>`;
    
    if (tracks.length === 0) {
        resultsDiv.innerHTML += '<p style="color: #E7E7E7;">La playlist está vacía</p>';
        return;
    }
    
    tracks.forEach((track, index) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track';
        trackDiv.innerHTML = `
            <div style="flex: 1;">
                <h4 style="margin: 0; color: #D10000;">${track.title}</h4>
                <p style="margin: 5px 0 0 0; color: #E7E7E7; font-size: 0.9em;">${track.artist}</p>
            </div>
            <div class="audio-controls">
                <button onclick="playSong('${track.title.replace(/'/g, "\\'")}', '${track.artist.replace(/'/g, "\\'")}', '${track.url}')">▶ Play</button>
                <button onclick="removeFromPlaylist('${currentPlaylist}', ${index})">✕ Quitar</button>
            </div>
        `;
        resultsDiv.appendChild(trackDiv);
    });
}

function removeFromPlaylist(playlistName, index) {
    playlists[playlistName].splice(index, 1);
    savePlaylists();
    displayPlaylistTracks();
    updatePlaylistUI();
}

function deletePlaylist(name) {
    if (confirm(`¿Eliminar "${name}"?`)) {
        delete playlists[name];
        savePlaylists();
        updatePlaylistUI();
        if (currentPlaylist === name) {
            currentPlaylist = null;
            document.getElementById('resultsContainer').innerHTML = '';
        }
    }
}


