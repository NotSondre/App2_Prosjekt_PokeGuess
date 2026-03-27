// --- 1. SPRÅK & OVERSETTELSER ---
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

// --- 2. GLOBAL TILSTAND & API-KOMMUNIKASJON ---
const API_BASE = 'https://poke-guessr.onrender.com'; 
let score = 0; 
let currentPokemonName = ""; 
let activeRegion = 'all'; 
let isProcessing = false; 

function updateHeaderButton() {
    const authBtn = document.getElementById('authBtn'); 
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
        return { error: t.network_error };
    }
}

async function saveScore() {
    const username = localStorage.getItem('pokemon_user');
    if (!username || score <= 0) return;

    const finalScore = score; 
    score = 0;              
    updateScoreDisplay();    

    await request('/user/score', 'POST', { 
        username: username, 
        score: finalScore 
    });
}

// --- 3. SPILL-LOGIKK ---
function updateScoreDisplay() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) scoreElement.innerText = score;
}

async function startNewGame(isSkip = false) {
    if (isProcessing) return;

    const img = document.getElementById('pokemonImage');
    const resultDiv = document.getElementById('guessResult');
    const input = document.getElementById('pokemonInput');
    
    if (isSkip && img && !img.classList.contains('revealed')) {
        isProcessing = true;
        await saveScore();
        
        img.classList.add('revealed'); 
        img.style.display = 'block';
        if (resultDiv) {
            resultDiv.innerText = `${t.it_was}${currentPokemonName}!`;
            resultDiv.style.color = "orange";
        }
        
        setTimeout(() => {
            isProcessing = false;
            startNewGame(false);
        }, 2000);
        return;
    }

    if (input) { input.value = ""; input.focus(); }
    if (resultDiv) resultDiv.innerText = "";
    if (img) {
        img.classList.remove('revealed'); 
        img.style.display = 'none'; 
        img.src = "";
    }

    isProcessing = true;
    const data = await request(`/content/pokemon?region=${activeRegion}&t=${Date.now()}`);
    isProcessing = false;
    
    if (data && !data.error) {
        currentPokemonName = data.name || data.pokemon;
        if (img) {
            img.src = data.imageUrl || data.image || data.url;
            img.onload = () => { img.style.display = 'block'; };
        }
    }
}

async function sendGuess() {
    if (isProcessing) return;

    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const img = document.getElementById('pokemonImage');

    if (!input || !input.value.trim() || (img && img.classList.contains('revealed'))) return;

    isProcessing = true;
    const data = await request('/content/guess', 'POST', { 
        guess: input.value.trim(),
        correctAnswer: currentPokemonName
    });

    if (data.success) {
        resultDiv.innerText = `${t.guess_correct}${currentPokemonName}!`; 
        resultDiv.style.color = "green";
        if (img) {
            img.classList.add('revealed');
            img.style.display = 'block';
        }
        score++; 
        updateScoreDisplay();
        
        setTimeout(() => {
            isProcessing = false;
            startNewGame(false);
        }, 1500);
    } else {
        isProcessing = false;
        resultDiv.innerText = t.guess_wrong;
        resultDiv.style.color = "red";
    }
}

// --- 4. OPPSTART & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderButton(); 

    const regionButtons = document.querySelectorAll('.region-btn');
    regionButtons.forEach(btn => {
        btn.onclick = () => {
            if (isProcessing) return;
            regionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeRegion = btn.getAttribute('data-region');
            startNewGame(false);
        };
    });

    const guessBtn = document.getElementById('guessBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pokemonInput = document.getElementById('pokemonInput');

    if (guessBtn) guessBtn.onclick = sendGuess;
    if (nextBtn) nextBtn.onclick = () => startNewGame(true);

    if (pokemonInput) {
        pokemonInput.onkeypress = (e) => {
            if (e.key === 'Enter') sendGuess();
        };
    }

    startNewGame();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}