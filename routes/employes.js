const express = require('express');
const { db, sendError, getJsonBody, requireFields, getById, list, withTransaction } = require('./helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(list('Employe', 'idEmp'));
});

router.get('/:idEmp', (req, res) => {
  const row = getById('Employe', 'idEmp = ?', [req.params.idEmp]);
  if (!row) {
    return sendError(res, 404, 'Employe introuvable');
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const body = getJsonBody(req);
  if (!requireFields(res, body, ['idEmp', 'nomEmp', 'salaire', 'deptEmp'])) {
    return;
  }

  const salaire = Number(body.salaire);
  if (!Number.isInteger(salaire)) {
    return sendError(res, 400, 'salaire doit etre un entier');
  }

  if (getById('Employe', 'idEmp = ?', [body.idEmp])) {
    return sendError(res, 409, 'La clé primaire idEmp existe déjà');
  }

  if (!getById('Departement', 'deptEmp = ?', [body.deptEmp])) {
    return sendError(res, 400, 'Le departement reference n existe pas');
  }

  db.prepare('INSERT INTO Employe (idEmp, nomEmp, salaire, deptEmp) VALUES (?, ?, ?, ?)').run(body.idEmp, body.nomEmp, salaire, body.deptEmp);
  res.status(201).json(getById('Employe', 'idEmp = ?', [body.idEmp]));
});

router.put('/:idEmp', (req, res) => {
  const oldIdEmp = req.params.idEmp;
  const body = getJsonBody(req);
  const newIdEmp = body.idEmp ?? oldIdEmp;

  if (!requireFields(res, { idEmp: newIdEmp, nomEmp: body.nomEmp, salaire: body.salaire, deptEmp: body.deptEmp }, ['idEmp', 'nomEmp', 'salaire', 'deptEmp'])) {
    return;
  }

  const salaire = Number(body.salaire);
  if (!Number.isInteger(salaire)) {
    return sendError(res, 400, 'salaire doit etre un entier');
  }

  const existing = getById('Employe', 'idEmp = ?', [oldIdEmp]);
  if (!existing) {
    return sendError(res, 404, 'Employe introuvable');
  }

  if (newIdEmp !== oldIdEmp && getById('Employe', 'idEmp = ?', [newIdEmp])) {
    return sendError(res, 409, 'La clé primaire idEmp existe déjà');
  }

  if (!getById('Departement', 'deptEmp = ?', [body.deptEmp])) {
    return sendError(res, 400, 'Le departement reference n existe pas');
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM Affectation WHERE idEmp = ?').get(oldIdEmp).count;
  if (newIdEmp !== oldIdEmp && count > 0) {
    return sendError(res, 409, 'Impossible de modifier employe: il est encore référencé par des affectations');
  }

  withTransaction(() => {
    db.prepare('UPDATE Employe SET idEmp = ?, nomEmp = ?, salaire = ?, deptEmp = ? WHERE idEmp = ?').run(newIdEmp, body.nomEmp, salaire, body.deptEmp, oldIdEmp);
  });

  res.json(getById('Employe', 'idEmp = ?', [newIdEmp]));
});

router.delete('/:idEmp', (req, res) => {
  const idEmp = req.params.idEmp;
  const existing = getById('Employe', 'idEmp = ?', [idEmp]);
  if (!existing) {
    return sendError(res, 404, 'Employe introuvable');
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM Affectation WHERE idEmp = ?').get(idEmp).count;
  if (count > 0) {
    return sendError(res, 409, 'Suppression impossible: cet employe est encore référencé par des affectations');
  }

  db.prepare('DELETE FROM Employe WHERE idEmp = ?').run(idEmp);
  res.status(204).end();
});

module.exports = router;