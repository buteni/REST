const express = require("express");
const mysql = require("mysql2");
const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const dotenv = require("dotenv");

dotenv.config(); // Lädt die Umgebungsvariablen aus der .env-Datei

const app = express();
const port = 3000;

// Datenbankverbindung mit mysql.createConnection() (wie in Code 2)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verbindung testen
db.connect((err) => {
  if (err) {
    console.error("Datenbankverbindung fehlgeschlagen:", err);
    process.exit(1); // Beendet den Server, wenn die Verbindung fehlschlägt
  }
  console.log("Mit MySQL verbunden!");
});

// AJV Schema-Validator mit Formaten
const ajv = new Ajv();
ajvFormats(ajv);  // Aktiviert alle Formate wie 'email', 'uri', etc.

const schema = {
  type: "object",
  properties: {
    vorname: { type: "string" },
    nachname: { type: "string" },
    plz: { type: "integer" },
    strasse: { type: "string" },
    ort: { type: "string" },
    telefonnummer: { type: "integer" },
    email: { type: "string", format: "email" }  // Aktiviert die E-Mail-Validierung
  },
  required: ["vorname", "nachname", "email"], // Vorname, Nachname und Email sind erforderlich
  additionalProperties: false
};

const validate = ajv.compile(schema);

app.use(express.json());

// Route: Teste das JSON-Format mit AJV
app.post("/validate", (req, res) => {
  const data = req.body;

  const valid = validate(data);
  if (!valid) {
    console.log(validate.errors);
    return res.status(400).send({ message: "Ungültige Daten", errors: validate.errors });
  }

  return res.status(200).send({ message: "Daten sind gültig!" });
});

// Route: POST /person für das Hinzufügen einer Person
app.post("/person", (req, res) => {
  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;

  // Validierung des Datenformats
  const valid = validate(req.body);
  if (!valid) {
    return res.status(400).send({ message: "Ungültige Daten", errors: validate.errors });
  }

  if (!vorname || !nachname || !email) {
    return res.status(400).send("Vorname, Nachname und E-Mail sind erforderlich");
  }

  const query = `
    INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email];

  db.execute(query, values, (err, result) => {
    if (err) {
      console.error("Fehler beim Einfügen der Person:", err);
      return res.status(500).send("Fehler beim Speichern der Person");
    }
    res.status(201).send({ message: "Person hinzugefügt", id: result.insertId });
  });
});

// Route: GET /person für das Abrufen aller Personen
app.get("/person", (req, res) => {
  const query = "SELECT * FROM personen";

  db.query(query, (err, rows) => {
    if (err) {
      console.error("Fehler beim Abrufen der Personen:", err);
      return res.status(500).send("Fehler beim Abrufen der Personen");
    }
    res.status(200).json(rows);
  });
});

// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
