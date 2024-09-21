const Note = require("../model/notes");
const mockingoose = require("mockingoose");
const NotesService = require("../service/note_service");

Promise.resolve(mockingoose);
const notes = new NotesService(Note);

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

describe('service getOne', () => {
  test('returns one note by id', async () => {
    const mockNote = initialData[0];
    mockingoose(Note).toReturn(mockNote, 'findOne');

    const event = {
      pathParameters: { id: "507f191e810c19729de860aa" },
    };
    const context = {};

    const result = await notes.getOne(event, context);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockNote);
  });

  test('returns 404 if note not found', async () => {
    mockingoose(Note).toReturn(null, 'findOne');

    const event = {
      pathParameters: { id: "507f191e810c19729de860zz" },
    };
    const context = {};

    const result = await notes.getOne(event, context);
    expect(result.statusCode).toBe(404);
    expect(result.body).toBe("Note not found.");
  });
});

describe('service getAll', () => {
  test('returns all notes', async () => {
    mockingoose(Note).toReturn(initialData, 'find');

    const event = {};
    const context = {};

    const result = await notes.getAll(event, context);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(initialData);
  });

  test('handles error when fetching all notes', async () => {
    mockingoose(Note).toReturn(new Error("Error fetching notes"), 'find');

    const event = {};
    const context = {};

    const result = await notes.getAll(event, context);
    expect(result.statusCode).toBe(500);
    expect(result.body).toBe("Could not fetch the notes.");
  });
});

describe('service create', () => {
  test('creates a new note and returns 201 status', async () => {
    const newNote = {
      title: "new note",
      content: "new content",
    };

    const savedNote = { ...newNote, _id: "507f191e810c19729de860ad" };

    mockingoose(Note).toReturn(savedNote, 'save');

    const event = {
      body: JSON.stringify(newNote),
    };
    const context = {};

    const result = await notes.create(event, context);
    expect(result.statusCode).toBe(201);
    const parsedResult = JSON.parse(result.body);

    expect(parsedResult.title).toBe(newNote.title);
    expect(parsedResult.content).toBe(newNote.content);
  });
});

describe('service update', () => {
  test('updates a note and returns 200 status', async () => {
    const updatedNote = {
      _id: "507f191e810c19729de860aa",
      title: "updated title",
      content: "updated content",
    };

    mockingoose(Note).toReturn(updatedNote, 'findOneAndUpdate');

    const event = {
      pathParameters: { id: "507f191e810c19729de860aa" },
      body: JSON.stringify({ title: "updated title", content: "updated content" }),
    };
    const context = {};

    const result = await notes.update(event, context);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(updatedNote);
  });
});
