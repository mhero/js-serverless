const Note = require("../model/notes");
const mockingoose = require("mockingoose").default;
const NotesService = require("../service/note_service");

let dbPromise = Promise.resolve(mockingoose);
let notes = new NotesService(dbPromise, Note);

let initialData = [
  {
    _id: "507f191e810c19729de860aa",
    title: "title",
    content: "content",
  },
  {
    _id: "507f191e810c19729de860ab",
    title: "title too",
    content: "content too",
  },
  {
    _id: "507f191e810c19729de860ac",
    title: "another title",
    content: "another content",
  },
];

describe(`service getOne`, () => {
  test(`returns one note by id`, () => {
    mockingoose.Note.toReturn(initialData);

    const event = {
      pathParameters: "507f191e810c19729de860aa",
    };
    const context = {};
    const callback = (ctx, data) => {
      return () => {
        expect(initialData[0]).toEqual(data.body);
      };
    };

    const result = notes.getAll(event, context, callback);
  });
});

describe(`service getAll`, () => {
  test(`returns all notes`, () => {
    mockingoose.Note.toReturn(initialData);

    const event = {};
    const context = {};
    const callback = (ctx, data) => {
      return () => {
        expect(initialData).toEqual(data.body);
      };
    };

    const result = notes.getAll(event, context, callback);
  });
});
