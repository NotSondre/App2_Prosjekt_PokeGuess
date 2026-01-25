async function testConnection() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        const box = document.getElementById('status');
        if (box) {
            box.innerText = data.message;
            box.style.background = "#d4edda"; // Grønn farge ved suksess
        }
    } catch (err) {
        console.error("Tilkoblingsfeil:", err);
    }
}

async function sendGuess() {
    const input = document.getElementById('pokemonInput');
    const resultDiv = document.getElementById('guessResult');
    
    try {
        const response = await fetch('/api/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess: input.value })
        });
        
        const data = await response.json();
        resultDiv.innerText = "Serveren vasket teksten til: " + data.cleanedData;
    } catch (err) {
        resultDiv.innerText = "Feil: Kunne ikke sende gjetting.";
    }
}

testConnection();