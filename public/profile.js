const API_BASE = 'https://poke-guessr.onrender.com';
let selectedImageUrl = "";

async function loadProfile() {
    const username = localStorage.getItem('pokemon_user');
    if (!username) return window.location.href = 'index.html';

    document.getElementById('usernameDisplay').innerText = username;

    try {
        const res = await fetch(`${API_BASE}/user/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (data.profilePic) document.getElementById('currentPic').src = data.profilePic;

        const list = document.getElementById('scoreList');
        if (data.topScores && data.topScores.length > 0) {
            list.innerHTML = data.topScores.map(s => `<li><span>${s.score} poeng</span> <small>${new Date(s.played_at).toLocaleDateString()}</small></li>`).join('');
        } else {
            document.getElementById('noScoresMsg').style.display = 'block';
        }
    } catch (err) { console.error(err); }
}

document.getElementById('editProfileBtn').onclick = () => {
    const section = document.getElementById('editSection');
    const isHidden = section.style.display === 'none' || section.style.display === '';
    section.style.display = isHidden ? 'block' : 'none';
};

document.getElementById('searchBtn').onclick = async () => {
    const name = document.getElementById('pokeSearch').value.toLowerCase().trim();
    if (!name) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        const data = await res.json();
        selectedImageUrl = data.sprites.front_default;
        document.getElementById('previewImg').src = selectedImageUrl;
        document.getElementById('searchPreview').style.display = 'block';
    } catch { alert("Fant ikke Pokémon."); }
};

document.getElementById('confirmPicBtn').onclick = async () => {
    const username = localStorage.getItem('pokemon_user');
    await fetch(`${API_BASE}/user/update-pic`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, imageUrl: selectedImageUrl })
    });
    document.getElementById('currentPic').src = selectedImageUrl;
    document.getElementById('searchPreview').style.display = 'none';
};

document.getElementById('changeUsernameBtn').onclick = async () => {
    const oldName = localStorage.getItem('pokemon_user');
    const newName = document.getElementById('newUsernameInput').value.trim();
    if (!newName || oldName === newName) return;

    const res = await fetch(`${API_BASE}/user/update-username`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ oldName, newName })
    });

    if (res.ok) {
        localStorage.setItem('pokemon_user', newName);
        location.reload();
    } else {
        alert("Navnet er opptatt eller feil oppstod.");
    }
};

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('pokemon_user');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', loadProfile);