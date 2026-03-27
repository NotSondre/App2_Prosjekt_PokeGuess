// --- 1. KONFIGURASJON & INITIALISERING ---
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
        
        document.getElementById('displayUsername').innerText = username;
        document.getElementById('displayPic').src = data.profilePic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

        const container = document.getElementById('scoreContainer');
        if (data.topScores && data.topScores.length > 0) {
            container.innerHTML = data.topScores.map(s => `
                <div class="score-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                    <span><strong>${s.score}</strong> poeng (${new Date(s.played_at).toLocaleDateString()})</span>
                    <button onclick="deleteScore(${s.id})" class="btn" style="background:#ff4444; padding: 4px 10px; font-size: 0.8rem; color: white; border: none; border-radius: 5px; cursor: pointer;">Slett</button>
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

// --- 2. HÅNDTERING AV POENGSUMMER ---
async function deleteScore(scoreId) {
    const username = localStorage.getItem('pokemon_user');
    if (!username || !confirm("Er du sikker på at du vil slette denne poengsummen?")) return;

    try {
        const response = await fetch(`${API_BASE}/user/score/${scoreId}?username=${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProfile(); 
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Kunne ikke slette: " + (data.error || "Serverfeil"));
        }
    } catch (err) {
        alert("Nettverksfeil: Sjekk internettforbindelsen.");
    }
}

// --- 3. REDIGERING AV PROFIL ---
async function searchPokemon() {
    const input = document.getElementById('pokemonSearchInput').value.trim().toLowerCase();
    const panel = document.getElementById('searchPreview');
    const successMsg = document.getElementById('searchSuccess');
    const nameSpan = document.getElementById('chosenPokemonName');
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

// --- 4. KONTO-ADMINISTRASJON ---
async function deleteAccount() {
    const password = document.getElementById('deleteConfirmPassword').value;
    if (!password) return alert("Skriv passord!");
    if (!confirm("Slette kontoen permanent? Dette kan ikke angres!")) return;

    const res = await fetch(`${API_BASE}/user/delete`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: localStorage.getItem('pokemon_user'), password })
    });

    if (res.ok) {
        localStorage.removeItem('pokemon_user');
        window.location.href = 'login.html';
    } else { 
        const data = await res.json();
        alert("Feil: " + (data.error || "Ugyldig passord")); 
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

// --- 5. EKSPORTERING & OPPSTART ---
window.toggleEdit = toggleEdit;
window.searchPokemon = searchPokemon;
window.saveProfileChanges = saveProfileChanges;
window.deleteAccount = deleteAccount;
window.deleteScore = deleteScore;
window.logout = logout;

document.addEventListener('DOMContentLoaded', loadProfile);