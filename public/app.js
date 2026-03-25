// --- I18n (Internationalization) ---
const translations = {
    no: {
        network_error: "Nettverksfeil: Kunne ikke kontakte serveren.",
        server_error: "Serverfeil oppstod.",
        fill_fields: "Vennligst fyll ut brukernavn og passord.",
        connecting: "Kobler til backend...",
        offline: "Du er offline. Viser lagret innhold.",
        tos_error: "Du må godta vilkårene for å opprette bruker.",
        guess_correct: "Riktig! Det var ",
        guess_wrong: "Feil Pokémon, prøv igjen!",
        it_was: "Det var ",
        login_btn: "Logg inn",
        profile_btn: "Profil: "
    },
    en: {
        network_error: "Network error: Could not reach the server.",
        server_error: "A server error occurred.",
        fill_fields: "Please fill in both username and password.",
        connecting: "Connecting to backend...",
        offline: "You are offline. Showing cached content.",
        tos_error: "You must accept the terms to create an account.",
        guess_correct: "Correct! It was ",
        guess_wrong: "Wrong Pokémon, try again!",
        it_was: "It was ",
        login_btn: "Login",
        profile_btn: "Profile: "
    }
};

const userLang = navigator.language.startsWith('nb') || navigator.language.startsWith('no') ? 'no' : 'en';
const t = translations[userLang];

// --- DATA & LOGIC ---
const API_BASE = 'https://poke-guessr.onrender.com'; 
let score = 0; 
let currentPokemonName = ""; 
let activeRegion = 'all'; // Holder styr på valgt region fra sidebaren

// Oppdaterer knappen i headeren basert på innloggingsstatus
function updateHeaderButton() {
    const authBtn = document.getElementById('authBtn'); // Samsvarer med index.html
    const username = localStorage.getItem('pokemon_user');

    if (username && authBtn) {
        authBtn.innerText = `${t.profile_btn}${username}`;
        authBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        };
    } else if (authBtn) {
        authBtn.innerText = t.login_btn;
        authBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        };
    }
}

async function request(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.error || t.server_error };
        }
        return await response.json();
    } catch (err) {
        console.error("Fetch-feil:", err);
        return { error: t.network_error };
    }
}

async function saveScore() {
    const username = localStorage.getItem('pokemon_user');
    if (!username || score <= 0) return;
    await request('/user/score', 'POST', { username, score });
}

// --- GAME LOGIC ---

function updateScoreDisplay() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) scoreElement.innerText = score;
}

async function startNewGame(isSkip = false) {
    const img = document.getElementById('pokemonImage');
    const resultDiv = document.getElementById('guessResult');
    const input = document.getElementById('pokemonInput');
    
    // Hvis brukeren trykker "Neste" uten å ha gjettet riktig
    if (isSkip && img && !img.classList.contains('revealed')) {
        await saveScore();
        score = 0; 
        updateScoreDisplay();
        
        img.classList.add('revealed'); 
        img.style.display = 'block';
        const nameToShow = currentPokemonName || "denne Pokémonen";
        if (resultDiv) {
            resultDiv.innerText = `${t.it_was}${nameToShow}!`;
            resultDiv.style.color = "orange";
        }

        setTimeout(() => startNewGame(false), 2000);
        return;
    }

    // Nullstill UI for ny runde
    if (input) { input.value = ""; input.focus(); }
    if (resultDiv) resultDiv.innerText = "";
    if (img) {
        img.classList.remove('revealed'); 
        img.style.display = 'none'; 
        img.src = "";
    }

    // Hent ny Pokémon basert på aktiv region
    const data = await request(`/content/pokemon?region=${activeRegion}&t=${Date.now()}`);
    
    if (data && !data.error) {
        const bildeUrl = data.imageUrl || data.image || data.url;
        if (img && bildeUrl) {
            img.src = bildeUrl;
            currentPokemonName = data.name || data.pokemon || "Ukjent";
            img.onload = () => { 
                img.style.display = 'block'; 
            };
        }
    }
}

async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const img = document.getElementById('pokemonImage');

    if (!input || !input.value || (img && img.classList.contains('revealed'))) return;

    // Send gjetting til backend
    const data = await request('/content/guess', 'POST', { 
        guess: input.value.trim(),
        correctAnswer: currentPokemonName
    });

    if (!resultDiv) return;

    if (data.success) {
        resultDiv.innerText = `${t.guess_correct}${currentPokemonName}!`; 
        resultDiv.style.color = "green";
        if (img) img.classList.add('revealed');
        
        score++; 
        updateScoreDisplay();
        saveScore(); 

        setTimeout(() => startNewGame(false), 1500);
    } else {
        resultDiv.innerText = t.guess_wrong;
        resultDiv.style.color = "red";
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderButton(); 

    const guessBtn = document.getElementById('guessBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pokemonInput = document.getElementById('pokemonInput');
    
    // Logikk for region-knapper i sidebaren
    const regionButtons = document.querySelectorAll('.region-btn');
    regionButtons.forEach(btn => {
        btn.onclick = () => {
            // UI-oppdatering av knapper
            regionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Oppdater valgt region og start på nytt
            activeRegion = btn.getAttribute('data-region');
            startNewGame(false);
        };
    });

    if (guessBtn) guessBtn.onclick = sendGuess;
    if (nextBtn) nextBtn.onclick = () => startNewGame(true);

    if (pokemonInput) {
        pokemonInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendGuess();
        });
    }

    startNewGame();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrert'))
        .catch(err => console.error('SW feilet', err));
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrert'))
        .catch(err => console.error('SW feilet', err));
}