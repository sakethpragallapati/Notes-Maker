const mongoose = require("mongoose");

const NotesSchema = new mongoose.Schema({
  username: { type: String, required: true },
  title: { type: [String], default: [] },
  notes: { type: [String], default: [] }
});

const Notesmodel = mongoose.model("notescollection", NotesSchema);

module.exports = Notesmodel;