'use strict';

require('dotenv').config({path: './variables.env'});
const connectToDatabase = require('./db');
const Note = require('./model/notes');
const NotesService = require('./service/note_service');

let notes = new NotesService(connectToDatabase(), Note);

module.exports.ok = (event, context, callback) => {
    return callback(null, {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/plain'
        },
        body: 'Ok.'
    });
};

module.exports.create = (event, context, callback) => {
    return notes.create(event, context, callback);
};

module.exports.getOne = (event, context, callback) => {
    return notes.getOne(event, context, callback);
};

module.exports.getAll = (event, context, callback) => {
    return notes.getAll(event, context, callback);
};

module.exports.update = (event, context, callback) => {
    return notes.update(event, context, callback);
};

module.exports.delete = (event, context, callback) => {
    return notes.delete(event, context, callback);
};