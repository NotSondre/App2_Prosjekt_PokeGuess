const API_BASE = 'https://poke-guessr.onrender.com';
const medals = ['🥇', '🥈', '🥉'];
let selectedImageUrl = "";

async function loadProfile() {
    const username = localStorage.getItem('pokemon_user');
    if (!username) {
        document.getElementById('notLoggedIn').style.display = 'block';
        return;
    }

    document.getElementById('usernameDisplay').innerText = username;

    try {
        const res = await fetch(`${API_BASE}/user/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (data.profilePic) {
            document.getElementById('currentPic').src = data.profilePic;
        }

        const scoreList = document.getElementById('scoreList');
        if (data.topScores && data.topScores.length > 0) {
            scoreList.innerHTML = '';
            data.topScores.forEach((entry, i) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${medals[i] || (i + 1 + ".")}</span>
                    <strong>${entry.score} poeng</strong>
                    <span style="font-size: 0.8rem; color: #888;">${new Date(entry.played_at).toLocaleDateString('no-NO')}</span>
                `;
                scoreList.appendChild(li);
            });
        } else {
            document.getElementById('noScoresMsg').style.display = 'block';
        }
    } catch (err) {
        console.error("Feil ved lasting:", err);
    }
}

async function searchPokemon() {
    const name = document.getElementById('pokeSearch').value.toLowerCase().trim();
    if (!name) return;

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if (!res.ok) throw new Error();
        
        const data = await res.json();
        selectedImageUrl = data.sprites.front_default; // Dette er piksel-spriten
        
        const previewImg = document.getElementById('previewImg');
        previewImg.src = selectedImageUrl;
        document.getElementById('searchPreview').style.display = 'block';
    } catch (err) {
        alert("Fant ikke Pokémonen. Husk engelsk navn!");
    }
}

async function saveProfilePic() {
    const username = localStorage.getItem('pokemon_user');
    if (!username || !selectedImageUrl) return;

    const res = await fetch(`${API_BASE}/user/update-pic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, imageUrl: selectedImageUrl })
    });

    if (res.ok) {
        document.getElementById('currentPic').src = selectedImageUrl;
        document.getElementById('searchPreview').style.display = 'none';
        document.getElementById('pokeSearch').value = "";
    }
}

document.getElementById('searchBtn').onclick = searchPokemon;
document.getElementById('confirmPicBtn').onclick = saveProfilePic;
document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('pokemon_user');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', loadProfile);