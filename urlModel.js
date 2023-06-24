const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  click: {
    type: Number,
    default: 0
  }
});

const Url = mongoose.model("Url", urlSchema);

module.exports = Url;
