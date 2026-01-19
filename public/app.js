async function testConnection() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        const box = document.getElementById('status');
        
        if (box) {
            box.innerText = data.message;
            box.classList.add('success');
        }
    } catch (err) {
        const box = document.getElementById('status');
        if (box) {
            box.innerText = "Feil: Ingen kontakt med serveren.";
        }
    }
}

// Start testen med en gang siden er klar
testConnection();