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
        it_was: "Det var "
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
        it_was: "It was "
    }
};

const userLang = navigator.language.startsWith('nb') || navigator.language.startsWith('no') ? 'no' : 'en';
const t = translations[userLang];

// --- DATA & LOGIC ---
const API_BASE = 'https://poke-guessr.onrender.com/'; 
let score = 0; 
let currentPokemonName = ""; 

/**
 * Generisk funksjon for API-kall med feilhåndtering
 */
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

// --- USER MANAGER COMPONENT ---
class UserManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('user-manager-template');
        if (template) {
            this.shadowRoot.appendChild(template.content.cloneNode(true));
        }
        this.mode = 'login'; 
    }

    connectedCallback() {
        const tabLogin = this.shadowRoot.getElementById('tabLogin');
        const tabReg = this.shadowRoot.getElementById('tabReg');
        const mainBtn = this.shadowRoot.getElementById('mainActionBtn');
        const tosArea = this.shadowRoot.getElementById('tosArea');
        const delBtn = this.shadowRoot.getElementById('delBtn');

        if(tabLogin) tabLogin.onclick = () => {
            this.mode = 'login';
            tabLogin.classList.add('active');
            tabReg.classList.remove('active');
            mainBtn.innerText = userLang === 'no' ? 'Logg inn' : 'Login';
            tosArea.classList.remove('visible');
        };

        if(tabReg) tabReg.onclick = () => {
            this.mode = 'register';
            tabReg.classList.add('active');
            tabLogin.classList.remove('active');
            mainBtn.innerText = userLang === 'no' ? 'Opprett bruker' : 'Create Account';
            tosArea.classList.add('visible');
        };

        if(mainBtn) mainBtn.onclick = () => {
            const endpoint = this.mode === 'login' ? '/user/login' : '/user/register';
            this.handleAction(endpoint, 'POST');
        };

        if(delBtn) delBtn.onclick = () => this.handleAction('/user/delete', 'DELETE');
    }

    async handleAction(endpoint, method) {
        const username = this.shadowRoot.getElementById('uname').value;
        const password = this.shadowRoot.getElementById('psw').value;
        const consent = this.shadowRoot.getElementById('consent').checked;
        const msgBox = this.shadowRoot.getElementById('msg');

        if (!username || !password) {
            msgBox.innerText = t.fill_fields;
            msgBox.style.color = "red";
            return;
        }

        if (this.mode === 'register' && !consent) {
            msgBox.innerText = t.tos_error;
            msgBox.style.color = "red";
            return;
        }

        const result = await request(endpoint, method, { username, password, consent });
        
        if (result.error) {
            msgBox.innerText = result.error;
            msgBox.style.color = "red";
        } else {
            msgBox.innerText = result.message;
            msgBox.style.color = "green";
            
            if (this.mode === 'login') {
                localStorage.setItem('pokemon_user', username);
                setTimeout(() => {
                    this.parentElement.classList.remove('active');
                }, 1500);
            }
        }
    }
}

customElements.define('user-manager', UserManager);

// --- GAME LOGIC ---

function updateScoreDisplay() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) scoreElement.innerText = score;
}

/**
 * Henter ny Pokémon og styrer visning av bilder
 */
async function startNewGame(isSkip = false) {
    const img = document.getElementById('pokemonImage');
    const resultDiv = document.getElementById('guessResult');
    const input = document.getElementById('pokemonInput');
    const regionSelect = document.getElementById('regionSelect');
    
    // Håndter "Vet Ikke" (Skip)
    if (isSkip && img && !img.classList.contains('revealed')) {
        score = 0; 
        updateScoreDisplay();
        
        img.classList.add('revealed'); 
        img.style.visibility = 'visible';
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
        img.style.visibility = 'hidden'; 
        img.src = "";
    }

    // --- NY LOGIKK FOR REGION ---
    const selectedRegion = regionSelect ? regionSelect.value : 'all';
    
    const data = await request(`/content/pokemon?region=${selectedRegion}&t=${Date.now()}`);
    
    console.log("Pokémon data mottatt for region:", selectedRegion, data);

    if (data && !data.error) {
        const bildeUrl = data.imageUrl || data.image || data.url;
        
        if (img && bildeUrl) {
            img.src = bildeUrl;
            currentPokemonName = data.name || data.pokemon || "Ukjent";
            
            img.onload = () => {
                img.style.visibility = 'visible';
            };
        }
    } else {
        console.error("Kunne ikke hente Pokémon-data:", data.error);
    }
}

/**
 Sender gjett til serveren
 */
async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const img = document.getElementById('pokemonImage');

    if (!input || !input.value || (img && img.classList.contains('revealed'))) return;

    const data = await request('/content/guess', 'POST', { 
        guess: input.value
    });

    if (!resultDiv) return;

    if (data.success) {
        resultDiv.innerText = data.message || `${t.guess_correct}${currentPokemonName}!`; 
        resultDiv.style.color = "green";
        if (img) {
            img.classList.add('revealed');
            img.style.visibility = 'visible';
        }
        
        score++; 
        updateScoreDisplay();

        setTimeout(() => startNewGame(false), 1500);
    } else {
        resultDiv.innerText = data.message || t.guess_wrong;
        resultDiv.style.color = "red";
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    const guessBtn = document.getElementById('guessBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pokemonInput = document.getElementById('pokemonInput');
    const regionSelect = document.getElementById('regionSelect');

    if (guessBtn) guessBtn.onclick = sendGuess;
    if (nextBtn) nextBtn.onclick = () => startNewGame(true);

    if (regionSelect) {
        regionSelect.onchange = () => startNewGame(false);
    }

    if (pokemonInput) {
        pokemonInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendGuess();
        });
    }

    testConnection();
    startNewGame();
});

async function testConnection() {
    const statusBox = document.getElementById('status');
    const result = await request('/status');
    if (result && result.message && statusBox) {
        statusBox.innerText = result.message;
        statusBox.classList.add('success');
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrert'))
        .catch(err => console.error('SW feilet', err));
}