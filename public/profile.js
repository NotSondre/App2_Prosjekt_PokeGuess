const API_BASE = 'https://poke-guessr.onrender.com';
let username = localStorage.getItem('pokemon_user');
let selectedImageUrl = null;

async function loadProfile() {
    console.log("Forsøker å laste profil for:", username);
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/profile?username=${username}`);
        if (!response.ok) throw new Error("Kunne ikke hente data fra server");
        
        const data = await response.json();
        console.log("Data mottatt:", data);

        document.getElementById('displayUsername').innerText = username;
        document.getElementById('displayPic').src = data.profilePic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

        const container = document.getElementById('scoreContainer');
        if (data.topScores && data.topScores.length > 0) {
            container.innerHTML = data.topScores.map(s => `
                <div class="score-item">
                    <span><strong>${s.score}</strong> poeng (${new Date(s.played_at).toLocaleDateString()})</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p>Ingen poengsummer lagret ennå.</p>";
        }
    } catch (err) {
        console.error("Profilfeil:", err);
        document.getElementById('displayUsername').innerText = "Feil ved lasting";
        document.getElementById('scoreContainer').innerText = "Kunne ikke hente poeng.";
    }
}

async function searchPokemon() {
    const input = document.getElementById('pokemonSearchInput').value.trim().toLowerCase();
    const panel = document.getElementById('searchPreview');
    const successMsg = document.getElementById('searchSuccess');
    const nameSpan = document.getElementById('chosenPokemonName'); // Nytt felt for navnet
    const status = document.getElementById('searchStatus');
    const preview = document.getElementById('previewPic');

    if (!input) return;
    
    panel.style.display = "flex";
    status.style.display = "block";
    status.innerText = "Søker...";
    preview.style.display = "none";
    successMsg.style.display = "none";

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
        if (!res.ok) throw new Error();
        
        const data = await res.json();
        selectedImageUrl = data.sprites.front_default;
        
        status.style.display = "none";
        preview.src = selectedImageUrl;
        preview.style.display = "block";
        
        nameSpan.innerText = data.name; 
        successMsg.style.display = "block"; 
        
    } catch (e) {
        status.innerText = "Fant ikke Pokémon. Prøv igjen.";
        successMsg.style.display = "none";
        preview.style.display = "none";
    }
}

async function saveProfileChanges() {
    const newName = document.getElementById('newNameInput').value.trim();
    const oldPass = document.getElementById('oldPasswordInput').value;
    const newPass = document.getElementById('newPasswordInput').value;
    const oldName = localStorage.getItem('pokemon_user');

    try {
        if (newName && newName !== oldName) {
            await fetch(`${API_BASE}/user/update-username`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ oldName, newName })
            });
            localStorage.setItem('pokemon_user', newName);
        }
        if (selectedImageUrl) {
            await fetch(`${API_BASE}/user/update-pic`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), imageUrl: selectedImageUrl })
            });
        }
        if (oldPass && newPass) {
            const res = await fetch(`${API_BASE}/user/update-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), oldPassword: oldPass, newPassword: newPass })
            });
            const d = await res.json();
            if (!d.message) return alert("Passordfeil: " + d.error);
        }
        location.reload();
    } catch (e) { alert("Kunne ikke lagre endringer."); }
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
    } else { alert("Feil passord."); }
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