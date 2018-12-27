const Note = require('../models/notes');
const mockingoose = require('mockingoose').default;

it('should find', () => {
    mockingoose.Note.toReturn({
        title: "titulo"
    });

    return Note.find().where('title').in([1])
        .then(result => {
            expect(
                {title: result.title}
            ).toEqual(
                {title: "titulo"}
            );
        })
});