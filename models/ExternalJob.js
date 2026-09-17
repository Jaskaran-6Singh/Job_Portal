const mongoose = require("mongoose");

const externalJobSchema = new mongoose.Schema(
  {
    externalJobId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    applicationUrl: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: null,
    },

    contractType: {
      type: String,
      default: null,
    },

    createdAtExternal: {
      type: Date,
      default: null,
    },

    cachedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  }
);

externalJobSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("ExternalJob", externalJobSchema);