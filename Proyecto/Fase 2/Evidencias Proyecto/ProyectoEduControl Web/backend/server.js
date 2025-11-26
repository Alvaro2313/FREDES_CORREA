const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir archivos estáticos
app.use('/educontrol', express.static(__dirname));

// Redirigir raíz a educontrol
app.get('/', (req, res) => {
    res.redirect('/educontrol/index.html');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}/educontrol/index.html`);
});