const Note = require("../model/notes");
const mockingoose = require("mockingoose");
const mongoose = require("mongoose"); 

it("should create a new note", async () => {
  const mockNote = {
    title: "New Note",
    content: "This is a new note",
    created: new Date(),
    updated: new Date(),
  };

  mockingoose(Note).toReturn(mockNote, 'save');

  const newNote = new Note(mockNote);
  const result = await newNote.save();

  expect(result).not.toBeUndefined();
  expect(result.title).toEqual(mockNote.title);
  expect(result.content).toEqual(mockNote.content);
  expect(result.created).toEqual(mockNote.created);
});

it("should update an existing note", async () => {
  const originalNote = {
    title: "Old Note",
    content: "This is an old note",
    updated: new Date(),
  };

  const updatedNote = {
    title: "Updated Note",
    content: "This is an updated note",
    updated: new Date(),
  };

  mockingoose(Note).toReturn(originalNote, 'findOne');
  mockingoose(Note).toReturn(updatedNote, 'save');

  const noteToUpdate = await Note.findOne({ title: "Old Note" });
  noteToUpdate.title = updatedNote.title;
  noteToUpdate.content = updatedNote.content;
  const result = await noteToUpdate.save();

  expect(result).not.toBeUndefined();
  expect(result.title).toEqual(updatedNote.title);
  expect(result.content).toEqual(updatedNote.content);
});

it("should return no results when nothing is found", async () => {
  mockingoose(Note).toReturn([], 'find');

  const result = await Note.find().where("title").in(["Nonexistent"]);

  expect(result).toBeDefined();
  expect(result.length).toEqual(0);
});

it("should find", async () => {
  mockingoose(Note).toReturn([{ title: "titulo" }]); 

  const result = await Note.find().where("title").in([1]);

  expect(result).not.toBeUndefined(); 
  expect(result.length).toBeGreaterThan(0); 
  expect(result[0].title).toEqual("titulo"); 
});

it("should delete a note", async () => {
  const mockNote = {
    _id: "1234567890",
    title: "Note to delete",
    content: "This note will be deleted",
  };

  mockingoose(Note).toReturn(mockNote, 'findOne');

  mockingoose(Note).toReturn(mockNote, 'findOneAndDelete');

  const noteToDelete = await Note.findOne({ _id: mockNote._id });
  expect(noteToDelete).not.toBeUndefined();

  const deletedNote = await Note.findOneAndDelete({ _id: mockNote._id });
  expect(deletedNote).not.toBeUndefined(); 

  mockingoose(Note).toReturn(null, 'findOne');

  const checkDeleted = await Note.findOne({ _id: mockNote._id });
  expect(checkDeleted).toBeNull();
});


it("should find a note by ID", async () => {
  const mockNote = {
    _id: new mongoose.Types.ObjectId(1234567890),
    title: "Note by ID",
    content: "This note was found by ID",
  };

  mockingoose(Note).toReturn(mockNote, 'findOne');

  const result = await Note.findOne({ _id: mockNote._id });

  expect(result).not.toBeUndefined();
  expect(result._id.toString()).toEqual(mockNote._id.toString());
  expect(result.title).toEqual(mockNote.title);
});

