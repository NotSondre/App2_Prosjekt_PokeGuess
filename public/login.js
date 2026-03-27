// --- Konfigurasjon og Tilstand ---
const API_BASE = 'https://poke-guessr.onrender.com';
let mode = 'login'; 

// --- Grensesnitt-logikk ---
function switchTab(newMode) {
    mode = newMode;
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const registerOnly = document.getElementById('registerOnly');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMessage');

    if (loginTab) loginTab.classList.toggle('active', mode === 'login');
    if (registerTab) registerTab.classList.toggle('active', mode === 'register');
    if (registerOnly) registerOnly.style.display = mode === 'register' ? 'block' : 'none';
    if (submitBtn) submitBtn.innerText = mode === 'login' ? 'Logg inn' : 'Opprett konto';
     
    errorMsg.innerText = ''; 
}

// --- Autentiserings-logikk ---
async function handleAuth() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const consentInput = document.getElementById('consent');
    const errorMsg = document.getElementById('errorMessage');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        errorMsg.innerText = "Fyll inn alle felt!";
        return;
    }

    const endpoint = mode === 'login' ? '/user/login' : '/user/register';
    const body = { username, password };
    
    if (mode === 'register') {
        if (!consentInput.checked) {
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
                window.location.href = 'profile.html'; 
            } else {
                alert("Bruker opprettet! Du kan nå logge inn.");
                switchTab('login');
            }
        } else {
            errorMsg.innerText = data.error || "Noe gikk galt.";
        }
    } catch (err) {
        errorMsg.innerText = "Kunne ikke koble til serveren.";
        console.error(err);
    }
}

window.switchTab = switchTab;
window.handleAuth = handleAuth;

// --- Oppstart ---
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleAuth);
    }
});