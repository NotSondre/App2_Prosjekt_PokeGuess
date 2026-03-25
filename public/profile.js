const API_BASE = 'https://poke-guessr.onrender.com';
const medals = ['🥇', '🥈', '🥉'];

async function loadProfile() {
    const username = localStorage.getItem('pokemon_user');
    const notLoggedIn = document.getElementById('notLoggedIn');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const scoreList = document.getElementById('scoreList');
    const noScoresMsg = document.getElementById('noScoresMsg');

    if (!username) {
        if (notLoggedIn) notLoggedIn.style.display = 'block';
        return;
    }

    if (usernameDisplay) usernameDisplay.innerText = username;

    try {
        const res = await fetch(`${API_BASE}/user/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (!data.topScores || data.topScores.length === 0) {
            if (noScoresMsg) noScoresMsg.style.display = 'block';
            return;
        }

        scoreList.innerHTML = ''; // Tømmer listen før vi legger til nye
        data.topScores.forEach((entry, i) => {
            const date = new Date(entry.played_at).toLocaleDateString('no-NO');
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="rank">${medals[i] || ''}</span>
                <span class="points">${entry.score} poeng</span>
                <span class="date">${date}</span>
            `;
            scoreList.appendChild(li);
        });
    } catch (err) {
        console.error("Feil ved henting av profil:", err);
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem('pokemon_user');
        window.location.href = 'index.html';
    };
}

document.addEventListener('DOMContentLoaded', loadProfile);