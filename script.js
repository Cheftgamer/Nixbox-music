const JIOSAAVN_API = 'https://jiosaavn-api.vercel.app/api/search/songs?query=';

let currentAudio = null;
let playlists = {};
let currentPlaylist = null;
let allSearchResults = [];

function loadPlaylists() {
    const saved = localStorage.getItem('playlists');
    if (saved) {
        playlists = JSON.parse(saved);
        updatePlaylistUI();
    }
}

function savePlaylists() {
    localStorage.setItem('playlists', JSON.stringify(playlists));
}

async function search() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const resultsDiv = document.getElementById('resultsContainer');
    resultsDiv.innerHTML = '<p style="color: #E7E7E7; text-align: center;">Buscando...</p>';

    try {
        const response = await fetch(JIOSAAVN_API + encodeURIComponent(query));
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            allSearchResults = data.results;
            displayResults(data.results);
        } else {
            resultsDiv.innerHTML = '<p style="color: #E7E7E7;">No se encontraron resultados</p>';
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        resultsDiv.innerHTML = '<p style="color: #D10000;">Error al buscar. Intenta de nuevo.</p>';
    }
}

function displayResults(data) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'none';
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data.youtube.length > 0) {
        resultsDiv.innerHTML += '<h3>Resultados de YouTube Music</h3>';
        data.youtube.forEach((song, index) => {
            let controls = '';
            if (song.audio_url) {
                controls = `
                    <audio id="audio-${index}" src="${song.audio_url}" preload="metadata" ontimeupdate="updateProgress(${index})" onloadstart="initProgress(${index})"></audio>
                    <div class="audio-controls">
                        <button onclick="togglePlay(${index})" id="play-btn-${index}">🎵</button>
                        <input type="range" id="progress-${index}" min="0" max="100" value="0" onchange="setProgress(${index})">
                        <span id="time-${index}">0:00 / 0:00</span>
                        <input type="range" id="volume-${index}" min="0" max="1" step="0.1" value="1" onchange="setVolume(${index})">
                        <button onclick="toggleMute(${index})" id="mute-btn-${index}">🔊</button>
                        <button onclick="toggleLoop(${index})" id="loop-btn-${index}">🔁</button>
                    </div>
                `;
            }
            const videoId = song.videoId;
            const isInPlaylist = isInPlaylistCheck(videoId);
            resultsDiv.innerHTML += `
                <div class="track">
                    <div>
                        <p>${song.name} - ${song.artist}</p>
                        ${controls}
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="download-btn" onclick="downloadSong('${videoId}', '${song.name}.mp3')">Descargar MP3</button>
                        <button class="add-to-playlist-btn ${isInPlaylist ? 'added' : ''}" onclick="addToPlaylist('${videoId}', '${song.name}', '${song.artist}')" id="btn-${videoId}" ${isInPlaylist ? 'disabled' : ''}>
                            ${isInPlaylist ? '✓ Agregado' : '➕ Playlist'}
                        </button>
                    </div>
                </div>
            `;
        });
    } else {
        resultsDiv.innerHTML += '<p>No se encontraron resultados.</p>';
    }
}

async function downloadSong(videoId, filename) {
    try {
        const response = await fetch(`/download/${videoId}`);
        if (!response.ok) {
            alert('Error al descargar: ' + response.statusText);
            return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error al descargar: ' + error.message);
    }
}

function togglePlay(index) {
    const audio = document.getElementById(`audio-${index}`);
    const btn = document.getElementById(`play-btn-${index}`);
    if (audio.paused) {
        audio.play();
        btn.textContent = '⏸️';
    } else {
        audio.pause();
        btn.textContent = '🎵';
    }
}

function setVolume(index) {
    const audio = document.getElementById(`audio-${index}`);
    const volume = document.getElementById(`volume-${index}`).value;
    audio.volume = volume;
}

function toggleMute(index) {
    const audio = document.getElementById(`audio-${index}`);
    const btn = document.getElementById(`mute-btn-${index}`);
    audio.muted = !audio.muted;
    btn.textContent = audio.muted ? '🔇' : '🔊';
}

function toggleLoop(index) {
    const audio = document.getElementById(`audio-${index}`);
    const btn = document.getElementById(`loop-btn-${index}`);
    audio.loop = !audio.loop;
    btn.textContent = audio.loop ? '🔂' : '🔁';
}

function initProgress(index) {
    const audio = document.getElementById(`audio-${index}`);
    const progress = document.getElementById(`progress-${index}`);
    if (!audio || !progress) return;
    audio.addEventListener('loadedmetadata', () => {
        progress.max = audio.duration;
    });
}

function updateProgress(index) {
    const audio = document.getElementById(`audio-${index}`);
    const progress = document.getElementById(`progress-${index}`);
    const timeSpan = document.getElementById(`time-${index}`);
    
    if (!audio || !progress || !timeSpan) return;
    
    progress.value = audio.currentTime;
    
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration || 0);
    timeSpan.textContent = `${currentTime} / ${duration}`;
}

function setProgress(index) {
    const audio = document.getElementById(`audio-${index}`);
    const progress = document.getElementById(`progress-${index}`);
    if (!audio || !progress) return;
    audio.currentTime = progress.value;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// {playlistName: [songs]}
let currentPlaylistName = null;
let playlistShuffle = false;
let playlistRepeat = false;
let currentPlayingIndex = -1;

function loadPlaylist() {
    const saved = localStorage.getItem('nixboxPlaylists');
    if (saved) {
        playlists = JSON.parse(saved);
    } else {
        playlists = {};
    }
    const savedShuffle = localStorage.getItem('nixboxShuffle');
    const savedRepeat = localStorage.getItem('nixboxRepeat');
    playlistShuffle = savedShuffle === 'true';
    playlistRepeat = savedRepeat === 'true';
    
    displayPlaylistsList();
    if (currentPlaylistName === null && Object.keys(playlists).length > 0) {
        currentPlaylistName = Object.keys(playlists)[0];
    }
    displayPlaylist();
    updateShuffleRepeatButtons();
}

function savePlaylist() {
    localStorage.setItem('nixboxPlaylists', JSON.stringify(playlists));
}

function saveShuffleRepeatState() {
    localStorage.setItem('nixboxShuffle', playlistShuffle);
    localStorage.setItem('nixboxRepeat', playlistRepeat);
}

function showCreatePlaylistForm() {
    document.getElementById('create-playlist-form').style.display = 'block';
    document.getElementById('new-playlist-name').focus();
}

function hideCreatePlaylistForm() {
    document.getElementById('create-playlist-form').style.display = 'none';
    document.getElementById('new-playlist-name').value = '';
}

function createPlaylist() {
    const name = document.getElementById('new-playlist-name').value.trim();
    if (!name) {
        alert('Por favor escribe un nombre para la playlist');
        return;
    }
    if (playlists[name]) {
        alert('Una playlist con ese nombre ya existe');
        return;
    }
    playlists[name] = [];
    currentPlaylistName = name;
    savePlaylist();
    displayPlaylistsList();
    displayPlaylist();
    hideCreatePlaylistForm();
}

function deleteCurrentPlaylist() {
    if (!currentPlaylistName) return;
    if (confirm(`¿Eliminar la playlist "${currentPlaylistName}"?`)) {
        delete playlists[currentPlaylistName];
        currentPlaylistName = Object.keys(playlists).length > 0 ? Object.keys(playlists)[0] : null;
        savePlaylist();
        displayPlaylistsList();
        displayPlaylist();
        
        const allBtns = document.querySelectorAll('.add-to-playlist-btn');
        allBtns.forEach(btn => {
            btn.classList.remove('added');
            btn.textContent = '➕ Playlist';
            btn.disabled = false;
        });
    }
}

function selectPlaylist(playlistName) {
    currentPlaylistName = playlistName;
    displayPlaylistsList();
    displayPlaylist();
}

function displayPlaylistsList() {
    const list = document.getElementById('playlists-list');
    list.innerHTML = '';
    
    Object.keys(playlists).forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'playlist-select-btn ' + (currentPlaylistName === name ? 'active' : '');
        btn.textContent = name + ` (${playlists[name].length})`;
        btn.onclick = () => selectPlaylist(name);
        list.appendChild(btn);
    });
}

function isInPlaylistCheck(videoId) {
    return Object.values(playlists).some(playlist => 
        playlist.some(song => song.videoId === videoId)
    );
}

function addToPlaylist(videoId, name, artist) {
    if (Object.keys(playlists).length === 0) {
        alert('Por favor crea una playlist primero');
        return;
    }
    
    if (Object.keys(playlists).length === 1) {
        const playlistName = Object.keys(playlists)[0];
        if (!playlists[playlistName].some(song => song.videoId === videoId)) {
            playlists[playlistName].push({ videoId, name, artist });
            savePlaylist();
            displayPlaylist();
            displayPlaylistsList();
            const btn = document.getElementById(`btn-${videoId}`);
            if (btn) {
                btn.classList.add('added');
                btn.textContent = '✓ Agregado';
                btn.disabled = true;
            }
        }
    } else {
        showPlaylistSelector(videoId, name, artist);
    }
}

function showPlaylistSelector(videoId, name, artist) {
    const playlistNames = Object.keys(playlists);
    let html = `<div class="playlist-selector-overlay">
        <div class="playlist-selector-modal">
            <h3>Selecciona una playlist</h3>
            <div class="playlist-selector-list">`;
    
    playlistNames.forEach(playlistName => {
        html += `<button class="playlist-selector-item" onclick="addToSelectedPlaylist('${videoId}', '${name}', '${artist}', '${playlistName}')">${playlistName}</button>`;
    });
    
    html += `</div>
            <button class="playlist-selector-close" onclick="closePlaylistSelector()">Cancelar</button>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function addToSelectedPlaylist(videoId, name, artist, playlistName) {
    if (!playlists[playlistName].some(song => song.videoId === videoId)) {
        playlists[playlistName].push({ videoId, name, artist });
        savePlaylist();
        displayPlaylist();
        displayPlaylistsList();
        
        const btn = document.getElementById(`btn-${videoId}`);
        if (btn) {
            btn.classList.add('added');
            btn.textContent = '✓ Agregado';
            btn.disabled = true;
        }
    }
    closePlaylistSelector();
}

function closePlaylistSelector() {
    const overlay = document.querySelector('.playlist-selector-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function removeFromPlaylist(videoId) {
    if (!currentPlaylistName) return;
    playlists[currentPlaylistName] = playlists[currentPlaylistName].filter(song => song.videoId !== videoId);
    savePlaylist();
    displayPlaylist();
    displayPlaylistsList();
    const btn = document.getElementById(`btn-${videoId}`);
    if (btn) {
        btn.classList.remove('added');
        btn.textContent = '➕ Playlist';
        btn.disabled = false;
    }
}

function clearPlaylist() {
    if (!currentPlaylistName) return;
    if (confirm(`¿Limpiar toda la playlist "${currentPlaylistName}"?`)) {
        playlists[currentPlaylistName] = [];
        savePlaylist();
        displayPlaylist();
        displayPlaylistsList();
        const allBtns = document.querySelectorAll('.add-to-playlist-btn');
        allBtns.forEach(btn => {
            btn.classList.remove('added');
            btn.textContent = '➕ Playlist';
            btn.disabled = false;
        });
    }
}

function displayPlaylist() {
    const playlistDiv = document.getElementById('playlist');
    const playlistNameHeader = document.getElementById('current-playlist-name');
    const deleteBtn = document.getElementById('delete-playlist-btn');
    
    if (!currentPlaylistName) {
        playlistDiv.innerHTML = '<div class="playlist-empty">Crea una playlist para empezar</div>';
        playlistNameHeader.textContent = 'Selecciona una playlist';
        deleteBtn.style.display = 'none';
        return;
    }
    
    playlistNameHeader.textContent = currentPlaylistName;
    deleteBtn.style.display = 'block';
    
    const currentPlaylist = playlists[currentPlaylistName];
    if (!currentPlaylist || currentPlaylist.length === 0) {
        playlistDiv.innerHTML = '<div class="playlist-empty">Esta playlist está vacía</div>';
        return;
    }
    
    playlistDiv.innerHTML = '';
    currentPlaylist.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div class="playlist-item-info">
                <p class="playlist-item-name">${song.name}</p>
                <p class="playlist-item-artist">${song.artist}</p>
            </div>
            <div class="playlist-item-btns">
                <button onclick="playFromPlaylist('${song.videoId}')" title="Reproducir">▶️</button>
                <button onclick="removeFromPlaylist('${song.videoId}')" title="Eliminar">❌</button>
            </div>
        `;
        playlistDiv.appendChild(item);
    });
}

function playFromPlaylist(videoId) {
    if (!currentPlaylistName) {
        alert('Por favor selecciona una playlist');
        return;
    }
    
    const currentPlaylist = playlists[currentPlaylistName];
    currentPlayingIndex = currentPlaylist.findIndex(s => s.videoId === videoId);
    const song = currentPlaylist[currentPlayingIndex];
    if (song) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <h3>Reproduciendo desde: ${currentPlaylistName}</h3>
            <div class="track">
                <div style="width: 100%;">
                    <p>${song.name} - ${song.artist}</p>
                    <audio id="playlist-audio" preload="metadata" ontimeupdate="updatePlaylistProgress()" onloadstart="initPlaylistProgress()" onended="onPlaylistSongEnd()"></audio>
                    <div class="audio-controls">
                        <button onclick="togglePlaylistPlay()" id="playlist-play-btn">🎵</button>
                        <input type="range" id="playlist-progress" min="0" max="100" value="0" onchange="setPlaylistProgress()">
                        <span id="playlist-time">0:00 / 0:00</span>
                        <input type="range" id="playlist-volume" min="0" max="1" step="0.1" value="1" onchange="setPlaylistVolume()">
                        <button onclick="togglePlaylistMute()" id="playlist-mute">🔊</button>
                    </div>
                </div>
                <div>
                    <button class="download-btn" onclick="downloadSong('${videoId}', '${song.name}.mp3')">Descargar MP3</button>
                    <button class="download-btn" onclick="loadPlaylistView()" style="margin-left: 10px;">← Volver</button>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const audioEl = document.getElementById('playlist-audio');
            if (audioEl) {
                fetch(`/download/${videoId}`)
                    .then(r => r.blob())
                    .then(blob => {
                        audioEl.src = URL.createObjectURL(blob);
                    })
                    .catch(() => {
                        resultsDiv.innerHTML += '<p style="color: red; margin-top: 10px;">Error al cargar la canción</p>';
                    });
            }
        }, 100);
    }
}

function togglePlaylistPlay() {
    const audio = document.getElementById('playlist-audio');
    const btn = document.getElementById('playlist-play-btn');
    if (audio) {
        if (audio.paused) {
            audio.play();
            btn.textContent = '⏸️';
        } else {
            audio.pause();
            btn.textContent = '🎵';
        }
    }
}

function initPlaylistProgress() {
    const audio = document.getElementById('playlist-audio');
    const progress = document.getElementById('playlist-progress');
    if (audio && progress) {
        audio.addEventListener('loadedmetadata', () => {
            progress.max = audio.duration;
        });
    }
}

function updatePlaylistProgress() {
    const audio = document.getElementById('playlist-audio');
    const progress = document.getElementById('playlist-progress');
    const timeSpan = document.getElementById('playlist-time');
    
    if (!audio || !progress || !timeSpan) return;
    
    progress.value = audio.currentTime;
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration || 0);
    timeSpan.textContent = `${currentTime} / ${duration}`;
}

function setPlaylistProgress() {
    const audio = document.getElementById('playlist-audio');
    const progress = document.getElementById('playlist-progress');
    if (audio && progress) {
        audio.currentTime = progress.value;
    }
}

function setPlaylistVolume() {
    const audio = document.getElementById('playlist-audio');
    const volume = document.getElementById('playlist-volume').value;
    if (audio) {
        audio.volume = volume;
    }
}

function togglePlaylistMute() {
    const audio = document.getElementById('playlist-audio');
    const btn = document.getElementById('playlist-mute');
    if (audio) {
        audio.muted = !audio.muted;
        btn.textContent = audio.muted ? '🔇' : '🔊';
    }
}

function togglePlaylistShuffle() {
    playlistShuffle = !playlistShuffle;
    saveShuffleRepeatState();
    updateShuffleRepeatButtons();
}

function togglePlaylistRepeat() {
    playlistRepeat = !playlistRepeat;
    saveShuffleRepeatState();
    updateShuffleRepeatButtons();
}

function updateShuffleRepeatButtons() {
    const sidebarShuffle = document.getElementById('sidebar-shuffle-btn');
    const sidebarRepeat = document.getElementById('sidebar-repeat-btn');
    
    if (sidebarShuffle) {
        sidebarShuffle.style.opacity = playlistShuffle ? '1' : '0.5';
        sidebarShuffle.style.fontWeight = playlistShuffle ? 'bold' : 'normal';
    }
    
    if (sidebarRepeat) {
        sidebarRepeat.style.opacity = playlistRepeat ? '1' : '0.5';
        sidebarRepeat.style.fontWeight = playlistRepeat ? 'bold' : 'normal';
    }
}

function onPlaylistSongEnd() {
    const currentPlaylist = playlists[currentPlaylistName];
    if (!currentPlaylist) return;
    
    if (playlistShuffle) {
        const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
        playFromPlaylist(currentPlaylist[randomIndex].videoId);
    } else if (currentPlayingIndex < currentPlaylist.length - 1) {
        const nextSong = currentPlaylist[currentPlayingIndex + 1];
        playFromPlaylist(nextSong.videoId);
    } else if (playlistRepeat) {
        const firstSong = currentPlaylist[0];
        playFromPlaylist(firstSong.videoId);
    }
}

function loadPlaylistView() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    if (!currentPlaylistName) {
        resultsDiv.innerHTML = '<p>Por favor selecciona una playlist</p>';
        return;
    }
    
    const currentPlaylist = playlists[currentPlaylistName];
    if (currentPlaylist && currentPlaylist.length > 0) {
        resultsDiv.innerHTML = `<h3>Playlist: ${currentPlaylistName}</h3>`;
        currentPlaylist.forEach(song => {
            resultsDiv.innerHTML += `
                <div class="track">
                    <div>
                        <p>${song.name} - ${song.artist}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="download-btn" onclick="playFromPlaylist('${song.videoId}')">▶️ Reproducir</button>
                        <button class="download-btn" onclick="downloadSong('${song.videoId}', '${song.name}.mp3')">Descargar MP3</button>
                    </div>
                </div>
            `;
        });
    } else {
        resultsDiv.innerHTML = '<p>Esta playlist está vacía</p>';
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
    
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
});

// ===== FUNCIONES DE BÚSQUEDA Y REPRODUCCIÓN =====
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
        const url = song.url || '';
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
                <button onclick="playSong('${title}', '${artist}', '${url}')">▶ Play</button>
                <button onclick="openPlaylistModal('${title}', '${artist}', '${url}')">+ Playlist</button>
                ${downloadUrl ? `<button onclick="downloadSongUrl('${downloadUrl}', '${title}')">⬇ Descargar</button>` : ''}
            </div>
        `;
        
        resultsDiv.appendChild(trackDiv);
    });
}

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
        alert('No se pudo reproducir la canción. El navegador puede estar bloqueando la reproducción.');
    });

    const resultsDiv = document.getElementById('resultsContainer');
    const playerDiv = document.createElement('div');
    playerDiv.className = 'track';
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

// ===== DESCARGAS =====
async function downloadSongUrl(url, title) {
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
        alert('No se pudo descargar la canción');
    }
}

// ===== PLAYLISTS =====
function openPlaylistModal(title, artist, url) {
    const modal = document.getElementById('playlistModal') || createPlaylistModal();
    const playlistList = document.getElementById('playlistList');
    
    playlistList.innerHTML = '';
    
    Object.keys(playlists).forEach(playlistName => {
        const option = document.createElement('div');
        option.className = 'playlist-option';
        option.textContent = playlistName;
        option.onclick = () => {
            if (!playlists[playlistName].some(s => s.title === title)) {
                playlists[playlistName].push({ title, artist, url });
                savePlaylists();
                modal.style.display = 'none';
                alert(`Agregado a ${playlistName}`);
            } else {
                alert('Esta canción ya está en la playlist');
            }
        };
        playlistList.appendChild(option);
    });

    const newOption = document.createElement('div');
    newOption.className = 'playlist-option';
    newOption.innerHTML = '<strong style="color: #D10000;">+ Nueva Playlist</strong>';
    newOption.onclick = () => {
        const name = prompt('Nombre de la nueva playlist:');
        if (name && name.trim()) {
            const cleanName = name.trim();
            if (!playlists[cleanName]) {
                playlists[cleanName] = [{ title, artist, url }];
                savePlaylists();
                modal.style.display = 'none';
                updatePlaylistUI();
                alert(`Playlist ${cleanName} creada`);
            } else {
                alert('La playlist ya existe');
            }
        }
    };
    playlistList.appendChild(newOption);
    
    modal.style.display = 'flex';
}

function createPlaylistModal() {
    const modal = document.createElement('div');
    modal.id = 'playlistModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Agregar a Playlist</h2>
            <div id="playlistList" style="max-height: 300px; overflow-y: auto; margin: 15px 0;"></div>
            <button onclick="document.getElementById('playlistModal').style.display = 'none'" style="width: 100%; padding: 10px; background: #D10000; color: white; border: none; border-radius: 4px; cursor: pointer;">Cerrar</button>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    document.body.appendChild(modal);
    return modal;
}

function updatePlaylistUI() {
    const sidebarPlaylists = document.getElementById('playlistItems');
    if (!sidebarPlaylists) return;
    
    sidebarPlaylists.innerHTML = '';
    
    Object.keys(playlists).forEach(playlistName => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div onclick="selectPlaylist('${playlistName}')" style="cursor: pointer; flex: 1;">
                <strong>${playlistName}</strong> (${playlists[playlistName].length})
            </div>
            <button onclick="deletePlaylist('${playlistName}')" style="background: #D10000; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
        `;
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
    
    resultsDiv.innerHTML = `<h2 style="color: #D10000; margin-bottom: 15px;">${currentPlaylist}</h2>`;
    
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
                <button onclick="playSong('${track.title}', '${track.artist}', '${track.url}')">▶ Play</button>
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
    if (confirm(`¿Eliminar playlist "${name}"?`)) {
        delete playlists[name];
        savePlaylists();
        updatePlaylistUI();
        if (currentPlaylist === name) {
            currentPlaylist = null;
            document.getElementById('resultsContainer').innerHTML = '';
        }
    }
}
