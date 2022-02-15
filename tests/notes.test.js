const Note = require("../model/notes");
const mockingoose = require("mockingoose");

it("should find", () => {
  mockingoose(Note).toReturn({
    title: "titulo",
  });

  return Note.find()
    .where("title")
    .in([1])
    .then((result) => {
      expect({ title: result.title }).toEqual({ title: "titulo" });
    });
});
