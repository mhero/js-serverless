class Notes {
    constructor(connectToDatabase, note) {
      this.Note = note;
      this.connectToDatabase = connectToDatabase;
    }
    
    create(event, context, callback) {
        context.callbackWaitsForEmptyEventLoop = false;
        return this.connectToDatabase
            .then(() =>
                this.Note.create(JSON.parse(event.body))
            )
            .then(note => callback(null, {
                statusCode: 200,
                body: JSON.stringify(note)
            }))
            .catch(err => callback(null, {
                statusCode: err.statusCode || 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Could not create the note.'
            }));
    }
    
    getOne(event, context, callback) {
        context.callbackWaitsForEmptyEventLoop = false;
        return this.connectToDatabase
            .then(() =>
                this.Note.findById(event.pathParameters.id)
            )
            .then(note => callback(null, {
                statusCode: 200,
                body: JSON.stringify(note)
            }))
            .catch(err => callback(null, {
                statusCode: err.statusCode || 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Could not fetch the note.'
            }));
    };
    
    getAll(event, context, callback) {
        context.callbackWaitsForEmptyEventLoop = false;
        return this.connectToDatabase
            .then(() =>
                this.Note.find()
            )
            .then(notes => callback(null, {
                statusCode: 200,
                body: JSON.stringify(notes)
            }))
            .catch(err => callback(null, {
                statusCode: err.statusCode || 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Could not fetch the notes.'
            }));
    };
    
    update(event, context, callback) {
        context.callbackWaitsForEmptyEventLoop = false;
        return this.connectToDatabase
            .then(() =>
                this.Note.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), {
                    new: true
                })
            )
            .then(note => callback(null, {
                statusCode: 200,
                body: JSON.stringify(note)
            }))
            .catch(err => callback(null, {
                statusCode: err.statusCode || 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Could not fetch the notes.'
            }));
    };
    
    delete(event, context, callback) {
        context.callbackWaitsForEmptyEventLoop = false;
        return this.connectToDatabase
            .then(() =>
                this.Note.findByIdAndRemove(event.pathParameters.id)
            )
            .then(note => callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Removed note with id: ' + note._id,
                    note: note
                })
            }))
            .catch(err => callback(null, {
                statusCode: err.statusCode || 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Could not fetch the notes.'
            }));
    };
  }
  
  module.exports = Notes;