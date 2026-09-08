const db = require('../db');

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function getJsonBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function requireFields(res, body, fields) {
  const missing = fields.filter((field) => !hasValue(body[field]));
  if (missing.length > 0) {
    sendError(res, 400, `Champs obligatoires manquants: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

function toInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number)) {
    return null;
  }
  return number;
}

function exists(table, whereClause, params) {
  const row = db.prepare(`SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`).get(...params);
  return Boolean(row);
}

function getById(table, whereClause, params) {
  return db.prepare(`SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`).get(...params);
}

function list(table, orderBy) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
}

function withTransaction(handler) {
  const transaction = db.transaction(handler);
  return transaction();
}

module.exports = {
  db,
  sendError,
  getJsonBody,
  hasValue,
  requireFields,
  toInteger,
  exists,
  getById,
  list,
  withTransaction,
};