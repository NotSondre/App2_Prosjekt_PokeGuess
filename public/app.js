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
            return { error: errorData.error || "Server error" };
        }
        return await response.json();
    } catch (err) {
        console.error("Fetch error:", err);
        return { error: "Network error" };
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
    }

    connectedCallback() {
        const regBtn = this.shadowRoot.getElementById('regBtn');
        const delBtn = this.shadowRoot.getElementById('delBtn');

        if (regBtn) regBtn.onclick = () => this.handleAction('/user/register', 'POST');
        if (delBtn) delBtn.onclick = () => this.handleAction('/user/delete', 'DELETE');
    }

    async handleAction(endpoint, method) {
        const username = this.shadowRoot.getElementById('uname').value;
        const password = this.shadowRoot.getElementById('psw').value;
        const consent = this.shadowRoot.getElementById('consent').checked;
        const msgBox = this.shadowRoot.getElementById('msg');

        if (!username || !password) {
            msgBox.innerText = "Vennligst fyll ut brukernavn og passord.";
            return;
        }

        const result = await request(endpoint, method, { username, password, consent });
        msgBox.innerText = result.message || result.error;
    }
}

customElements.define('user-manager', UserManager);

async function testConnection() {
    console.log("Tester tilkobling til server...");
}

async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    const data = await request('/content/guess', 'POST', { 
        username: "testUser", 
    });
    if (resultDiv) resultDiv.innerText = data.message || data.error;
}

testConnection();