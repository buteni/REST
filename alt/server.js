const express = require("express");
const mysql = require("mysql2/promise");
const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
const port = 3000;
const TOKEN_SECRET = process.env.TOKEN_SECRET;

app.use(express.json());

// MySQL Pool erstellen
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verbindung testen
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Mit MySQL verbunden!");
  } catch (err) {
    console.error("Fehler bei Verbindung zu MySQL:", err);
    process.exit(1);
  }
})();

// AJV Setup
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

// Token prüfen
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Kein Token", status: 401 });

  jwt.verify(token, TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Ungültiger Token", status: 403 });
    req.user = user;
    next();
  });
}

// LOGIN-Route
app.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT username, password FROM user WHERE username = ? AND password = ?";

  try {
    const [results] = await pool.query(sql, [username, password]);
    if (results.length === 0) {
      return res.status(409).json({ message: "Falsche Login-Daten", status: 409 });
    }

    const token = generateAccessToken(username);
    res.status(201).json({ token, status: 201, message: "Erfolgreich eingeloggt" });
  } catch (err) {
    res.status(500).json({ message: "Datenbankfehler", error: err });
  }
});

// POST PERSON
app.post("/person", authenticateToken, async (req, res) => {
  if (!validatePerson(req.body)) {
    return res.status(400).json({ message: "Ungültige Daten", errors: validatePerson.errors });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  const sql = `
    INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email];

  try {
    const [result] = await pool.query(sql, values);
    res.status(201).json({ message: "Person hinzugefügt", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Speichern", error: err });
  }
});

// GET PERSON
app.get("/person", authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM personen");
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Abrufen", error: err });
  }
});

// PUT PERSON
app.put("/person/:id", authenticateToken, async (req, res) => {
  if (!validatePerson(req.body)) {
    return res.status(400).json({ message: "Ungültige Daten", errors: validatePerson.errors });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  const sql = `
    UPDATE personen SET vorname=?, nachname=?, plz=?, strasse=?, ort=?, telefonnummer=?, email=? WHERE id=?
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email, req.params.id];

  try {
    await pool.query(sql, values);
    res.status(200).json({ message: "Person aktualisiert" });
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Aktualisieren", error: err });
  }
});

// DELETE PERSON
app.delete("/person/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM personen WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Person gelöscht" });
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Löschen", error: err });
  }
});

// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
