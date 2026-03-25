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

        document.getElementById('displayUsername').innerText = username;
        document.getElementById('displayPic').src = data.profilePic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

        const container = document.getElementById('scoreContainer');
        if (data.topScores && data.topScores.length > 0) {
            container.innerHTML = data.topScores.map(s => `
                <div class="score-item">
                    <span><strong>${s.score}</strong> (${new Date(s.played_at).toLocaleDateString()})</span>
                    <button class="btn" style="background:#ff4444; padding:2px 8px;" onclick="deleteScore(${s.id})">X</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p>Ingen scores ennå.</p>";
        }
    } catch (err) { console.error("Lasting feilet:", err); }
}

async function searchPokemon() {
    const input = document.getElementById('pokemonSearchInput').value.trim().toLowerCase();
    const status = document.getElementById('searchStatus');
    const preview = document.getElementById('previewPic');
    const nameLabel = document.getElementById('previewName');
    const panel = document.getElementById('searchPreview');

    if (!input) return;
    panel.style.display = "flex";
    status.innerText = "Søker...";
    preview.style.display = "none";

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
        const data = await res.json();
        selectedImageUrl = data.sprites.front_default;
        status.style.display = "none";
        preview.src = selectedImageUrl;
        preview.style.display = "block";
        nameLabel.innerText = data.name;
    } catch (err) {
        status.innerText = "Fant ikke Pokémon.";
        selectedImageUrl = null;
    }
}

async function saveProfileChanges() {
    const newName = document.getElementById('newNameInput').value.trim();
    const oldPass = document.getElementById('oldPasswordInput').value;
    const newPass = document.getElementById('newPasswordInput').value;
    const oldName = localStorage.getItem('pokemon_user');

    // 1. Navn
    if (newName && newName !== oldName) {
        const res = await fetch(`${API_BASE}/user/update-username`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ oldName, newName })
        });
        if ((await res.json()).message) localStorage.setItem('pokemon_user', newName);
    }

    // 2. Bilde
    if (selectedImageUrl) {
        await fetch(`${API_BASE}/user/update-pic`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), imageUrl: selectedImageUrl })
        });
    }

    // 3. Passord
    if (oldPass && newPass) {
        const res = await fetch(`${API_BASE}/user/update-password`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), oldPassword: oldPass, newPassword: newPass })
        });
        const data = await res.json();
        if (!data.message) return alert("Passordfeil: " + data.error);
    }

    location.reload();
}

async function deleteAccount() {
    const password = document.getElementById('deleteConfirmPassword').value;
    if (!password) return alert("Skriv passord!");
    if (!confirm("Slette kontoen permanent?")) return;

    const res = await fetch(`${API_BASE}/user/delete`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), password })
    });

    if (res.ok) {
        localStorage.removeItem('pokemon_user');
        window.location.href = 'login.html';
    } else {
        alert("Feil passord.");
    }
}

function toggleEdit() {
    const p = document.getElementById('editPanel');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

function logout() {
    localStorage.removeItem('pokemon_user');
    window.location.href = 'login.html';
}

window.toggleEdit = toggleEdit;
window.searchPokemon = searchPokemon;
window.saveProfileChanges = saveProfileChanges;
window.deleteAccount = deleteAccount;
window.logout = logout;
document.addEventListener('DOMContentLoaded', loadProfile);