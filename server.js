const path = require('path');
const express = require('express');

require('./db');

const projetsRouter = require('./routes/projets');
const employesRouter = require('./routes/employes');
const departementsRouter = require('./routes/departements');
const affectationsRouter = require('./routes/affectations');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/projets', projetsRouter);
app.use('/api/employes', employesRouter);
app.use('/api/departements', departementsRouter);
app.use('/api/affectations', affectationsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});