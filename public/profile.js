const API_BASE = 'https://poke-guessr.onrender.com';
let username = localStorage.getItem('pokemon_user');
let selectedImageUrl = null;

async function loadProfile() {
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/profile?username=${username}`);
        const data = await response.json();

        if (data.error) {
            console.error("Kunne ikke laste profil");
            return;
        }

        document.getElementById('displayUsername').innerText = username;
        document.getElementById('displayPic').src = data.profilePic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

        const container = document.getElementById('scoreContainer');
        if (data.topScores && data.topScores.length > 0) {
            container.innerHTML = data.topScores.map(s => `
                <div class="score-item">
                    <span><strong>${s.score}</strong> poeng (${new Date(s.played_at).toLocaleDateString()})</span>
                    <button class="delete-score-btn" data-id="${s.id}">Slett</button>
                </div>
            `).join('');

            document.querySelectorAll('.delete-score-btn').forEach(btn => {
                btn.addEventListener('click', (e) => deleteScore(e.target.dataset.id));
            });
        } else {
            container.innerHTML = "<p>Ingen lagrede poengsummer ennå.</p>";
        }
    } catch (err) {
        console.error("Profilfeil:", err);
    }
}

async function searchPokemon() {
    const input = document.getElementById('pokemonSearchInput').value.trim().toLowerCase();
    const status = document.getElementById('searchStatus');
    const preview = document.getElementById('previewPic');
    const nameLabel = document.getElementById('previewName');

    if (!input) return;

    status.innerText = "Søker...";
    preview.style.display = "none";
    nameLabel.innerText = "";

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        
        selectedImageUrl = data.sprites.front_default;
        
        status.style.display = "none";
        preview.src = selectedImageUrl;
        preview.style.display = "block";
        nameLabel.innerText = data.name;
    } catch (err) {
        status.innerText = "Fant ikke Pokémon. Prøv navn eller ID.";
        status.style.display = "block";
        selectedImageUrl = null;
    }
}

async function saveProfileChanges() {
    const newName = document.getElementById('newNameInput').value.trim();
    const oldName = localStorage.getItem('pokemon_user');

    if (newName && newName !== oldName) {
        try {
            const res = await fetch(`${API_BASE}/user/update-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName })
            });
            const data = await res.json();
            if (data.message) {
                localStorage.setItem('pokemon_user', newName);
                username = newName; // Oppdaterer lokal variabel
            } else {
                alert(data.error);
                return;
            }
        } catch (err) {
            console.error("Navnebytte feilet:", err);
        }
    }

    if (selectedImageUrl) {
        try {
            await fetch(`${API_BASE}/user/update-pic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), imageUrl: selectedImageUrl })
            });
        } catch (err) {
            console.error("Bildeoppdatering feilet:", err);
        }
    }

    location.reload();
}

async function deleteScore(scoreId) {
    if (!confirm("Vil du slette denne rekorden?")) return;

    try {
        const response = await fetch(`${API_BASE}/user/score/${scoreId}?username=${username}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.message) {
            loadProfile();
        }
    } catch (err) {
        console.error("Sletting feilet:", err);
    }
}

function toggleEdit() {
    const panel = document.getElementById('editPanel');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function logout() {
    localStorage.removeItem('pokemon_user');
    window.location.href = 'login.html';
}

window.toggleEdit = toggleEdit;
window.searchPokemon = searchPokemon;
window.saveProfileChanges = saveProfileChanges;
window.logout = logout;

document.addEventListener('DOMContentLoaded', loadProfile);