const API_BASE = 'https://poke-guessr.onrender.com';
let mode = 'login';

function switchTab(newMode) {
    mode = newMode;
    document.getElementById('loginTab').classList.toggle('active', mode === 'login');
    document.getElementById('registerTab').classList.toggle('active', mode === 'register');
    document.getElementById('registerOnly').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('submitBtn').innerText = mode === 'login' ? 'Logg inn' : 'Opprett konto';
    document.getElementById('errorMessage').innerText = '';
}

async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const consent = document.getElementById('consent').checked;
    const errorMsg = document.getElementById('errorMessage');

    if (!username || !password) {
        errorMsg.innerText = "Fyll inn alle felt!";
        return;
    }

    const endpoint = mode === 'login' ? '/user/login' : '/user/register';
    const body = { username, password };
    
    if (mode === 'register') {
        if (!consent) {
            errorMsg.innerText = "Du må godta lagring av data.";
            return;
        }
        body.consent = true;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            if (mode === 'login') {
                localStorage.setItem('pokemon_user', data.user.name);
                window.location.href = 'index.html';
            } else {
                alert("Bruker opprettet! Du kan nå logge inn.");
                switchTab('login');
            }
        } else {
            errorMsg.innerText = data.error || "Noe gikk galt.";
        }
    } catch (err) {
        errorMsg.innerText = "Kunne ikke koble til serveren.";
    }
}