const express = require("express");
const mysql = require("mysql2");
const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
const port = 3000;

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Datenbankverbindung fehlgeschlagen:", err);
    process.exit(1);
  }
  console.log("Mit MySQL verbunden!");
});

app.use(express.json());

// AJV Setup
const ajv = new Ajv();
ajvFormats(ajv);

// Schema für Personen
const personenSchema = {
  type: "object",
  properties: {
    vorname: { type: "string" },
    nachname: { type: "string" },
    plz: { type: "integer" },
    strasse: { type: "string" },
    ort: { type: "string" },
    telefonnummer: { type: "integer" },
    email: { type: "string", format: "email" }
  },
  required: ["vorname", "nachname", "email"],
  additionalProperties: false
};
const validatePerson = ajv.compile(personenSchema);

// Token erstellen
function generateAccessToken(username) {
  return jwt.sign({ username }, TOKEN_SECRET, { expiresIn: "1800s" });
}

// LOGIN Route
app.post("/user/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT username, password FROM user WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler", error: err });
    if (results.length === 0) return res.status(409).json({ message: "Falsche Login-Daten", status: 409 });

    const token = generateAccessToken(username);
    res.status(201).json({ token, status: 201, message: "Erfolgreich eingeloggt" });
  });
});

//ROUTEN

// POST PERSON 
app.post("/person", (req, res) => {
  if (!validatePerson(req.body)) {
    return res.status(400).json({ message: "Ungültige Daten", errors: validatePerson.errors });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  const query = `
    INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Fehler beim Speichern", error: err });
    res.status(201).json({ message: "Person hinzugefügt", id: result.insertId });
  });
});

// GET PERSON 
app.get("/person", (req, res) => {
  db.query("SELECT * FROM personen", (err, results) => {
    if (err) return res.status(500).json({ message: "Fehler beim Abrufen", error: err });
    res.status(200).json(results);
  });
});

// PUT PERSON 
app.put("/person/:id", (req, res) => {
  if (!validatePerson(req.body)) {
    return res.status(400).json({ message: "Ungültige Daten", errors: validatePerson.errors });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  const sql = `
    UPDATE personen SET vorname=?, nachname=?, plz=?, strasse=?, ort=?, telefonnummer=?, email=? WHERE id=?
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email, req.params.id];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: "Fehler beim Aktualisieren", error: err });
    res.status(200).json({ message: "Person aktualisiert" });
  });
});

// DELETE PERSON 
app.delete("/person/:id", (req, res) => {
  const sql = "DELETE FROM personen WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Fehler beim Löschen", error: err });
    res.status(200).json({ message: "Person gelöscht" });
  });
});

// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
