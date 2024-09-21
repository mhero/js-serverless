class Notes {
  constructor(note) {
    this.note = note;
  }

  async create(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      const note = await this.note.create(JSON.parse(event.body));
      return {
        statusCode: 201,
        body: JSON.stringify(note),
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Could not create the note.",
      };
    }
  }

  async getOne(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      const note = await this.note.findById(event.pathParameters.id);

      if (!note) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "text/plain",
          },
          body: "Note not found.",
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(note),
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Could not fetch the note.",
      };
    }
  }

  async getAll(_event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      const notes = await this.note.find();
      return {
        statusCode: 200,
        body: JSON.stringify(notes),
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Could not fetch the notes.",
      };
    }
  }

  async update(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      const note = await this.note.findByIdAndUpdate(
        event.pathParameters.id,
        JSON.parse(event.body),
        { new: true }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(note),
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Could not update the note.",
      };
    }
  }

  async delete(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      const note = await this.note.findByIdAndRemove(event.pathParameters.id);

      if (!note) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "text/plain",
          },
          body: "Note not found.",
        };
      }

      return {
        statusCode: 204,
        body: JSON.stringify({
          message: "Removed note with id: " + note._id,
          note: note,
        }),
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Could not delete the note.",
      };
    }
  }
}

module.exports = Notes;
