"use strict";

require('dotenv').config();
const connectToDatabase = require("./db");
const Note = require("./model/notes");
const NotesService = require("./service/note_service");

connectToDatabase();
const notesService = new NotesService(Note);

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "text/plain" },
  body
});

module.exports.ok = (_event, _context, callback) => 
  callback(null, response(200, "Ok."));

module.exports.create = (event, context, callback) => 
  notesService.create(event, context, callback);

module.exports.getOne = (event, context, callback) => 
  notesService.getOne(event, context, callback);

module.exports.getAll = (event, context, callback) => 
  notesService.getAll(event, context, callback);

module.exports.update = (event, context, callback) => 
  notesService.update(event, context, callback);

module.exports.delete = (event, context, callback) => 
  notesService.delete(event, context, callback);
