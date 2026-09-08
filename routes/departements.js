const express = require('express');
const { db, sendError, getJsonBody, requireFields, getById, list, withTransaction } = require('./helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(list('Departement', 'deptEmp'));
});

router.get('/:deptEmp', (req, res) => {
  const row = getById('Departement', 'deptEmp = ?', [req.params.deptEmp]);
  if (!row) {
    return sendError(res, 404, 'Departement introuvable');
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const body = getJsonBody(req);
  if (!requireFields(res, body, ['deptEmp', 'mgrEmp'])) {
    return;
  }

  if (getById('Departement', 'deptEmp = ?', [body.deptEmp])) {
    return sendError(res, 409, 'La clé primaire deptEmp existe déjà');
  }

  db.prepare('INSERT INTO Departement (deptEmp, mgrEmp) VALUES (?, ?)').run(body.deptEmp, body.mgrEmp);
  res.status(201).json(getById('Departement', 'deptEmp = ?', [body.deptEmp]));
});

router.put('/:deptEmp', (req, res) => {
  const oldDeptEmp = req.params.deptEmp;
  const body = getJsonBody(req);
  const newDeptEmp = body.deptEmp ?? oldDeptEmp;

  if (!requireFields(res, { deptEmp: newDeptEmp, mgrEmp: body.mgrEmp }, ['deptEmp', 'mgrEmp'])) {
    return;
  }

  const existing = getById('Departement', 'deptEmp = ?', [oldDeptEmp]);
  if (!existing) {
    return sendError(res, 404, 'Departement introuvable');
  }

  if (newDeptEmp !== oldDeptEmp && getById('Departement', 'deptEmp = ?', [newDeptEmp])) {
    return sendError(res, 409, 'La clé primaire deptEmp existe déjà');
  }

  const employeeCount = db.prepare('SELECT COUNT(*) AS count FROM Employe WHERE deptEmp = ?').get(oldDeptEmp).count;
  if (newDeptEmp !== oldDeptEmp && employeeCount > 0) {
    return sendError(res, 409, 'Impossible de modifier departement: il est encore référencé par des employes');
  }

  withTransaction(() => {
    db.prepare('UPDATE Departement SET deptEmp = ?, mgrEmp = ? WHERE deptEmp = ?').run(newDeptEmp, body.mgrEmp, oldDeptEmp);
  });

  res.json(getById('Departement', 'deptEmp = ?', [newDeptEmp]));
});

router.delete('/:deptEmp', (req, res) => {
  const deptEmp = req.params.deptEmp;
  const existing = getById('Departement', 'deptEmp = ?', [deptEmp]);
  if (!existing) {
    return sendError(res, 404, 'Departement introuvable');
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM Employe WHERE deptEmp = ?').get(deptEmp).count;
  if (count > 0) {
    return sendError(res, 409, 'Suppression impossible: ce departement est encore référencé par des employes');
  }

  db.prepare('DELETE FROM Departement WHERE deptEmp = ?').run(deptEmp);
  res.status(204).end();
});

module.exports = router;