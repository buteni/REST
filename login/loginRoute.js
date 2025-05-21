const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../pool/mysql");
const dotenv = require("dotenv");
dotenv.config();

const TOKEN_SECRET = process.env.TOKEN_SECRET;

function generateAccessToken(username) {
  return jwt.sign({ username }, TOKEN_SECRET, { expiresIn: "1800s" });
}

// LOGIN
router.post("/login", async (req, res) => {
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

module.exports = router;
