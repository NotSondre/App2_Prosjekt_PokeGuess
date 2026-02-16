// --- DATA & LOGIC ---
const API_BASE = './api';

async function request(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (err) {
        return { error: "Network error" };
    }
}

class UserManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('user-manager-template');
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.shadowRoot.getElementById('regBtn').onclick = () => this.handleAction('/users/register', 'POST');
        this.shadowRoot.getElementById('delBtn').onclick = () => this.handleAction('/users/delete', 'DELETE');
    }

    async handleAction(endpoint, method) {
        const username = this.shadowRoot.getElementById('uname').value;
        const password = this.shadowRoot.getElementById('psw').value;
        const consent = this.shadowRoot.getElementById('consent').checked;

        const result = await request(endpoint, method, { username, password, consent });
        this.shadowRoot.getElementById('msg').innerText = result.message || result.error;
    }
}

customElements.define('user-manager', UserManager);

async function testConnection() {
    const data = await request('/status');
    const box = document.getElementById('status');
    if (box && data.message) box.innerText = data.message;
}

async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const data = await request('/guess', 'POST', { guess: input?.value });
    if (resultDiv) resultDiv.innerText = data.cleanedData || "Error";
}

testConnection();