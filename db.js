const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database.db');
const shouldSeed = !fs.existsSync(dbPath);
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

if (shouldSeed) {
  db.exec(`
    CREATE TABLE Projet (
      nomProj    TEXT PRIMARY KEY,
      mgrProj    TEXT NOT NULL,
      budget     INTEGER NOT NULL,
      dateDebut  TEXT NOT NULL
    );

    CREATE TABLE Departement (
      deptEmp TEXT PRIMARY KEY,
      mgrEmp  TEXT NOT NULL
    );

    CREATE TABLE Employe (
      idEmp    TEXT PRIMARY KEY,
      nomEmp   TEXT NOT NULL,
      salaire  INTEGER NOT NULL,
      deptEmp  TEXT NOT NULL,
      FOREIGN KEY (deptEmp) REFERENCES Departement(deptEmp)
    );

    CREATE TABLE Affectation (
      nomProj  TEXT NOT NULL,
      idEmp    TEXT NOT NULL,
      heures   INTEGER NOT NULL,
      evalEmp  INTEGER,
      PRIMARY KEY (nomProj, idEmp),
      FOREIGN KEY (nomProj) REFERENCES Projet(nomProj),
      FOREIGN KEY (idEmp)   REFERENCES Employe(idEmp)
    );
  `);

  const seed = db.transaction(() => {
    db.prepare('INSERT INTO Departement (deptEmp, mgrEmp) VALUES (?, ?)').run('10', 'Holmes');
    db.prepare('INSERT INTO Departement (deptEmp, mgrEmp) VALUES (?, ?)').run('12', 'Lupin');

    db.prepare('INSERT INTO Employe (idEmp, nomEmp, salaire, deptEmp) VALUES (?, ?, ?, ?)').run('E101', 'Durand', 45000, '10');
    db.prepare('INSERT INTO Employe (idEmp, nomEmp, salaire, deptEmp) VALUES (?, ?, ?, ?)').run('E105', 'Adam', 43000, '12');
    db.prepare('INSERT INTO Employe (idEmp, nomEmp, salaire, deptEmp) VALUES (?, ?, ?, ?)').run('E110', 'Rivera', 41000, '10');

    db.prepare('INSERT INTO Projet (nomProj, mgrProj, budget, dateDebut) VALUES (?, ?, ?, ?)').run('ILO', 'Dupont', 100000, '15/11/2011');
    db.prepare('INSERT INTO Projet (nomProj, mgrProj, budget, dateDebut) VALUES (?, ?, ?, ?)').run('MAXI', 'Jones', 200000, '03/01/2012');

    db.prepare('INSERT INTO Affectation (nomProj, idEmp, heures, evalEmp) VALUES (?, ?, ?, ?)').run('ILO', 'E101', 25, 9);
    db.prepare('INSERT INTO Affectation (nomProj, idEmp, heures, evalEmp) VALUES (?, ?, ?, ?)').run('ILO', 'E105', 39, null);
    db.prepare('INSERT INTO Affectation (nomProj, idEmp, heures, evalEmp) VALUES (?, ?, ?, ?)').run('ILO', 'E110', 10, 8);
    db.prepare('INSERT INTO Affectation (nomProj, idEmp, heures, evalEmp) VALUES (?, ?, ?, ?)').run('MAXI', 'E110', 29, null);
  });

  seed();
}

module.exports = db;