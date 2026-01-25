POKÉMON GUESSER API
POST ("/api/start") brukes for å initialisere et nytt spill; den nullstiller poengsummen og velger en hemmelig Pokémon som spilleren skal gjette

POST ("/api/guess") tar imot en gjetning fra brukeren. Den sender dataene gjennom middlewaren som vasker teksten for mellomrom og store bokstaver før den sjekker om svaret er korrekt

GET ("/api/status") returnerer nåværende status for spillet, inkludert spillerens poengsum, antall forsøk igjen og hvilken runde man er på

GET ("/api/hint") gir brukeren et hint om den hemmelige Pokémonen, for eksempel hvilken "type" (Electric, Fire, Water) den tilhører 