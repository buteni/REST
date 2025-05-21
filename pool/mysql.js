const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL Verbindung erfolgreich");
  } catch (err) {
    console.error("Fehler bei der MySQL-Verbindung:", err);
    process.exit(1);
  }
})();

module.exports = pool;
