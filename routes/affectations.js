const express = require('express');
const { db, sendError, getJsonBody, requireFields, getById, list, withTransaction } = require('./helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(list('Affectation', 'nomProj, idEmp'));
});

router.get('/:nomProj/:idEmp', (req, res) => {
  const row = getById('Affectation', 'nomProj = ? AND idEmp = ?', [req.params.nomProj, req.params.idEmp]);
  if (!row) {
    return sendError(res, 404, 'Affectation introuvable');
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const body = getJsonBody(req);
  if (!requireFields(res, body, ['nomProj', 'idEmp', 'heures'])) {
    return;
  }

  const heures = Number(body.heures);
  if (!Number.isInteger(heures)) {
    return sendError(res, 400, 'heures doit etre un entier');
  }

  const evalEmp = body.evalEmp === '' || body.evalEmp === undefined || body.evalEmp === null ? null : Number(body.evalEmp);
  if (evalEmp !== null && !Number.isInteger(evalEmp)) {
    return sendError(res, 400, 'evalEmp doit etre un entier ou etre vide');
  }

  if (getById('Affectation', 'nomProj = ? AND idEmp = ?', [body.nomProj, body.idEmp])) {
    return sendError(res, 409, 'La clé primaire (nomProj, idEmp) existe déjà');
  }

  if (!getById('Projet', 'nomProj = ?', [body.nomProj])) {
    return sendError(res, 400, 'Le projet reference n existe pas');
  }

  if (!getById('Employe', 'idEmp = ?', [body.idEmp])) {
    return sendError(res, 400, 'L employe reference n existe pas');
  }

  db.prepare('INSERT INTO Affectation (nomProj, idEmp, heures, evalEmp) VALUES (?, ?, ?, ?)').run(body.nomProj, body.idEmp, heures, evalEmp);
  res.status(201).json(getById('Affectation', 'nomProj = ? AND idEmp = ?', [body.nomProj, body.idEmp]));
});

router.put('/:nomProj/:idEmp', (req, res) => {
  const oldNomProj = req.params.nomProj;
  const oldIdEmp = req.params.idEmp;
  const body = getJsonBody(req);
  const newNomProj = body.nomProj ?? oldNomProj;
  const newIdEmp = body.idEmp ?? oldIdEmp;

  if (!requireFields(res, { nomProj: newNomProj, idEmp: newIdEmp, heures: body.heures }, ['nomProj', 'idEmp', 'heures'])) {
    return;
  }

  const heures = Number(body.heures);
  if (!Number.isInteger(heures)) {
    return sendError(res, 400, 'heures doit etre un entier');
  }

  const evalEmp = body.evalEmp === '' || body.evalEmp === undefined || body.evalEmp === null ? null : Number(body.evalEmp);
  if (evalEmp !== null && !Number.isInteger(evalEmp)) {
    return sendError(res, 400, 'evalEmp doit etre un entier ou etre vide');
  }

  const existing = getById('Affectation', 'nomProj = ? AND idEmp = ?', [oldNomProj, oldIdEmp]);
  if (!existing) {
    return sendError(res, 404, 'Affectation introuvable');
  }

  if ((newNomProj !== oldNomProj || newIdEmp !== oldIdEmp) && getById('Affectation', 'nomProj = ? AND idEmp = ?', [newNomProj, newIdEmp])) {
    return sendError(res, 409, 'La clé primaire (nomProj, idEmp) existe déjà');
  }

  if (!getById('Projet', 'nomProj = ?', [newNomProj])) {
    return sendError(res, 400, 'Le projet reference n existe pas');
  }

  if (!getById('Employe', 'idEmp = ?', [newIdEmp])) {
    return sendError(res, 400, 'L employe reference n existe pas');
  }

  withTransaction(() => {
    db.prepare('UPDATE Affectation SET nomProj = ?, idEmp = ?, heures = ?, evalEmp = ? WHERE nomProj = ? AND idEmp = ?').run(newNomProj, newIdEmp, heures, evalEmp, oldNomProj, oldIdEmp);
  });

  res.json(getById('Affectation', 'nomProj = ? AND idEmp = ?', [newNomProj, newIdEmp]));
});

router.delete('/:nomProj/:idEmp', (req, res) => {
  const { nomProj, idEmp } = req.params;
  const existing = getById('Affectation', 'nomProj = ? AND idEmp = ?', [nomProj, idEmp]);
  if (!existing) {
    return sendError(res, 404, 'Affectation introuvable');
  }

  db.prepare('DELETE FROM Affectation WHERE nomProj = ? AND idEmp = ?').run(nomProj, idEmp);
  res.status(204).end();
});

module.exports = router;