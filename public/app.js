// --- I18n (Internationalization) ---
const translations = {
    no: {
        network_error: "Nettverksfeil: Kunne ikke kontakte serveren.",
        server_error: "Serverfeil oppstod.",
        fill_fields: "Vennligst fyll ut brukernavn og passord.",
        connecting: "Kobler til backend...",
        offline: "Du er offline. Viser lagret innhold.",
        tos_error: "Du må godta vilkårene for å opprette bruker."
    },
    en: {
        network_error: "Network error: Could not reach the server.",
        server_error: "A server error occurred.",
        fill_fields: "Please fill in both username and password.",
        connecting: "Connecting to backend...",
        offline: "You are offline. Showing cached content.",
        tos_error: "You must accept the terms to create an account."
    }
};

const userLang = navigator.language.startsWith('nb') || navigator.language.startsWith('no') ? 'no' : 'en';
const t = translations[userLang];

// --- DATA & LOGIC ---
const API_BASE = ''; 

async function request(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.error || t.server_error };
        }
        return await response.json();
    } catch (err) {
        return { error: t.network_error };
    }
}

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

        tabLogin.onclick = () => {
            this.mode = 'login';
            tabLogin.classList.add('active');
            tabReg.classList.remove('active');
            mainBtn.innerText = userLang === 'no' ? 'Logg inn' : 'Login';
            tosArea.classList.remove('visible');
        };

        tabReg.onclick = () => {
            this.mode = 'register';
            tabReg.classList.add('active');
            tabLogin.classList.remove('active');
            mainBtn.innerText = userLang === 'no' ? 'Opprett bruker' : 'Create Account';
            tosArea.classList.add('visible');
        };

        mainBtn.onclick = () => {
            const endpoint = this.mode === 'login' ? '/user/login' : '/user/register';
            this.handleAction(endpoint, 'POST');
        };

        delBtn.onclick = () => this.handleAction('/user/delete', 'DELETE');
    }

    async handleAction(endpoint, method) {
        const username = this.shadowRoot.getElementById('uname').value;
        const password = this.shadowRoot.getElementById('psw').value;
        const consent = this.shadowRoot.getElementById('consent').checked;
        const msgBox = this.shadowRoot.getElementById('msg');

        if (!username || !password) {
            msgBox.innerText = t.fill_fields;
            return;
        }

        if (this.mode === 'register' && !consent) {
            msgBox.innerText = t.tos_error;
            return;
        }

        const result = await request(endpoint, method, { username, password, consent });
        msgBox.innerText = result.message || result.error;

        if (result.message && this.mode === 'login') {
            setTimeout(() => {
                this.classList.remove('active');
            }, 1500);
        }
    }
}

customElements.define('user-manager', UserManager);

async function testConnection() {
    const statusBox = document.getElementById('status');
    const result = await request('/status');
    if (result.message) {
        statusBox.innerText = result.message;
        statusBox.classList.add('success');
    }
}

async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const data = await request('/content/guess', 'POST', { 
        username: "testUser", 
        guess: input.value
    });
    if (resultDiv) resultDiv.innerText = data.message || data.error;
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrert'))
            .catch(err => console.error('SW feilet', err));
    });
}

testConnection();