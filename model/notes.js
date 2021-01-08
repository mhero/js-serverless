const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema({  
    title: String,
    content: String,
    created: Date,
    updated: Date
});
module.exports = mongoose.model('Note', NoteSchema);