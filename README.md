PokéGuessr Denne applikasjonen lar brukeren gjette Pokémon basert på bilder fra PokéAPI. Den inkluderer et poengsystem for å lagre personlige rekorder og en profilside for administrasjon av brukerdata. En global ledertavle og flere vanskelighetsgrader vil bli lagt til, gitt nok tid.

Remote URL: https://poke-guessr.onrender.com

Feature Map
* Gjetting: Hente tilfeldig Pokémon fra PokéAPI og sjekke svar.
* Brukerkontoer: Registrering og innlogging (BCrypt for passord).
* Statistikk: Lagre poengsummer i PostgreSQL (Render).
* Profil: Tilpasning av profilbilde og administrasjon av brukeropplysninger.
* PWA: Installeres på mobil og fungerer delvis offline via Service Workers.

Teknisk Arkitektur
* Frontend: Vanilla JavaScript, CSS, HTML5.
* Backend: Node.js / Express.
* Database: PostgreSQL (Cloud-hosted).
* API: REST-arkitektur for kommunikasjon mellom klient og server.