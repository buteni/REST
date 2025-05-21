const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");

const ajv = new Ajv();
ajvFormats(ajv);

const personenSchema = {
  type: "object",
  properties: {
    vorname: { type: "string" },
    nachname: { type: "string" },
    plz: { type: "integer" },
    strasse: { type: "string" },
    ort: { type: "string" },
    telefonnummer: { type: "integer" },
    email: { type: "string", format: "email" },
  },
  required: ["vorname", "nachname", "email"],
  additionalProperties: false,
};

const validatePerson = ajv.compile(personenSchema);

module.exports = validatePerson;
