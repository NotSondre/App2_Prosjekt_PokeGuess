import express from 'express';
const router = express.Router();

const Users = {}; 

export function storeUser(user) {
    if (user && user.id) {
        Users[user.id] = user;
        return true;
    }
    return false;
}

export function deleteUser(name, password) {
    for (const id in Users) {
        if (Users[id].name === name && Users[id].psw === password) {
            delete Users[id];
            return true;
        }
    }
    return false;
}

router.post('/register', (req, res) => {
    const { username, password, consent } = req.body;
    if (!consent) {
        return res.status(400).json({ error: "Mangler samtykke (ToS)." });
    }
    
    const newUser = { 
        id: Math.random().toString(16), 
        name: username, 
        psw: password, 
        consented: consent 
    };
    
    storeUser(newUser);
    res.status(201).json({ message: "Bruker opprettet!", user: { name: username } });
});

router.delete('/delete', (req, res) => {
    const { username, password } = req.body;
    if (deleteUser(username, password)) {
        res.json({ message: "Bruker slettet." }); 
    } else {
        res.status(404).json({ error: "Bruker ikke funnet." });
    }
});

export default router;