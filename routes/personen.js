const express = require("express");
const router = express.Router();

const pool = require("../pool/mysql");
const authenticateToken = require("../middleware/token");
const validatePerson = require("../schema/personenSchema");

// POST
router.post('/', authenticateToken, async (req, res) => {
  // Beispielhafte Validierung – ersetzbar mit AJV oder einfacher Prüfung
  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;

  if (!vorname || !nachname || !plz || !strasse || !ort || !telefonnummer || !email) {
    return res.status(400).json({ status: 400, message: "Fehlende Felder in der Anfrage" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vorname, nachname, plz, strasse, ort, telefonnummer, email]
    );

    res.status(201).json({status: 201,  message: "Person erstellt", id: result.insertId });
  } catch (err) {
    res.status(500).json({ status: 500, message: "Interner Fehler", error: err.message });
  }
});


// GET
router.get('/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id) || id <= 0) {
    return res.status(400).json({ status: 400, message: "Ungültige ID" });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM personen WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(403).json({ status: 403, message: "URL passt nicht" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ status: 500, message: "Interner Fehler", error: err.message });
  }
});


// PUT
router.put("/:id", authenticateToken, async (req, res) => {
  if (!validatePerson(req.body)) {
    return res.status(400).json({ message: "Ungültige Daten", errors: validatePerson.errors });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email, req.params.id];

  try {
    const [result] = await pool.query(
      `UPDATE personen SET vorname=?, nachname=?, plz=?, strasse=?, ort=?, telefonnummer=?, email=? WHERE id=?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({status: 403, message: "URL passt nicht" });
    }

    const [updatedRows] = await pool.query("SELECT * FROM personen WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Person aktualisiert", person: updatedRows[0] });
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Aktualisieren", error: err.message });
  }
});



// DELETE
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);

  // ID-Prüfung inline
  if (!id || isNaN(id) || id <= 0) {
    return res.status(400).json({ status: 400, message: "Ungültige ID" });
  }

  try {
    const [result] = await pool.query('DELETE FROM personen WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(403).json({ status: 403, message: "URL passt nicht" });
    }

    res.status(200).json({ message: "Person gelöscht" });
  } catch (err) {
    res.status(500).json({ status: 500, message: "Interner Fehler", error: err.message });
  }
});


module.exports = router;
