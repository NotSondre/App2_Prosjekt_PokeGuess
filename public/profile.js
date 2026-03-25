const API_BASE = 'https://poke-guessr.onrender.com';
const username = localStorage.getItem('pokemon_user');

async function loadProfile() {
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/profile?username=${username}`);
        const data = await response.json();

        if (data.error) {
            alert("Kunne ikke laste profil");
            return;
        }

        document.getElementById('displayUsername').innerText = username;
        document.getElementById('displayPic').src = data.profilePic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

        const container = document.getElementById('scoreContainer');
        if (data.topScores && data.topScores.length > 0) {
            container.innerHTML = data.topScores.map(s => `
                <div class="score-item">
                    <span><strong>${s.score}</strong> poeng (${new Date(s.played_at).toLocaleDateString()})</span>
                    <button class="delete-score-btn" onclick="deleteScore(${s.id})">Slett</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p>Ingen poengsummer lagret ennå.</p>";
        }

    } catch (err) {
        console.error("Feil:", err);
    }
}

// --- NYE FUNKSJONER FOR REDIGERING ---

function toggleEdit() {
    const panel = document.getElementById('editPanel');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

async function saveProfileChanges() {
    const newName = document.getElementById('newNameInput').value.trim();
    const newPic = document.getElementById('newPicInput').value.trim();
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
                window.location.reload(); 
                return; 
            } else {
                alert(data.error || "Kunne ikke endre navn");
                return;
            }
        } catch (err) {
            console.error("Navnebytte feilet:", err);
        }
    }

    if (newPic) {
        try {
            const res = await fetch(`${API_BASE}/user/update-pic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: oldName, imageUrl: newPic })
            });
            const data = await res.json();
            if (!data.message) {
                alert(data.error || "Kunne ikke endre bilde");
            }
        } catch (err) {
            console.error("Bildeoppdatering feilet:", err);
        }
    }
    location.reload();
}

async function deleteScore(scoreId) {
    if (!confirm("Vil du slette denne poengsummen permanent?")) return;

    try {
        const response = await fetch(`${API_BASE}/user/score/${scoreId}?username=${username}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.message) {
            loadProfile();
        } else {
            alert(result.error || "Kunne ikke slette");
        }
    } catch (err) {
        console.error("Sletting feilet:", err);
    }
}

function logout() {
    localStorage.removeItem('pokemon_user');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', loadProfile);