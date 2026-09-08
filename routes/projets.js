const express = require('express');
const { db, sendError, getJsonBody, requireFields, getById, list, withTransaction } = require('./helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(list('Projet', 'nomProj'));
});

router.get('/:nomProj', (req, res) => {
  const row = getById('Projet', 'nomProj = ?', [req.params.nomProj]);
  if (!row) {
    return sendError(res, 404, 'Projet introuvable');
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const body = getJsonBody(req);
  if (!requireFields(res, body, ['nomProj', 'mgrProj', 'budget', 'dateDebut'])) {
    return;
  }

  const budget = Number(body.budget);
  if (!Number.isInteger(budget)) {
    return sendError(res, 400, 'budget doit etre un entier');
  }

  if (getById('Projet', 'nomProj = ?', [body.nomProj])) {
    return sendError(res, 409, 'La clé primaire nomProj existe déjà');
  }

  db.prepare('INSERT INTO Projet (nomProj, mgrProj, budget, dateDebut) VALUES (?, ?, ?, ?)').run(body.nomProj, body.mgrProj, budget, body.dateDebut);
  res.status(201).json(getById('Projet', 'nomProj = ?', [body.nomProj]));
});

router.put('/:nomProj', (req, res) => {
  const oldNomProj = req.params.nomProj;
  const body = getJsonBody(req);
  const newNomProj = body.nomProj ?? oldNomProj;

  if (!requireFields(res, { nomProj: newNomProj, mgrProj: body.mgrProj, budget: body.budget, dateDebut: body.dateDebut }, ['nomProj', 'mgrProj', 'budget', 'dateDebut'])) {
    return;
  }

  const budget = Number(body.budget);
  if (!Number.isInteger(budget)) {
    return sendError(res, 400, 'budget doit etre un entier');
  }

  const existing = getById('Projet', 'nomProj = ?', [oldNomProj]);
  if (!existing) {
    return sendError(res, 404, 'Projet introuvable');
  }

  if (newNomProj !== oldNomProj && getById('Projet', 'nomProj = ?', [newNomProj])) {
    return sendError(res, 409, 'La clé primaire nomProj existe déjà');
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM Affectation WHERE nomProj = ?').get(oldNomProj).count;
  if (newNomProj !== oldNomProj && count > 0) {
    return sendError(res, 409, 'Impossible de modifier projet: il est encore référencé par des affectations');
  }

  withTransaction(() => {
    db.prepare('UPDATE Projet SET nomProj = ?, mgrProj = ?, budget = ?, dateDebut = ? WHERE nomProj = ?').run(newNomProj, body.mgrProj, budget, body.dateDebut, oldNomProj);
  });

  res.json(getById('Projet', 'nomProj = ?', [newNomProj]));
});

router.delete('/:nomProj', (req, res) => {
  const nomProj = req.params.nomProj;
  const existing = getById('Projet', 'nomProj = ?', [nomProj]);
  if (!existing) {
    return sendError(res, 404, 'Projet introuvable');
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM Affectation WHERE nomProj = ?').get(nomProj).count;
  if (count > 0) {
    return sendError(res, 409, 'Suppression impossible: ce projet est encore référencé par des affectations');
  }

  db.prepare('DELETE FROM Projet WHERE nomProj = ?').run(nomProj);
  res.status(204).end();
});

module.exports = router;