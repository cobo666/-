const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database.
// If the file doesn't exist, it will be created.
const DB_SOURCE = "src/db/resources.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message);
      throw err;
    } else {
        console.log('Connected to the SQLite database.');
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(() => {
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT CHECK(role IN ('admin', 'uploader')) DEFAULT 'uploader',
            CONSTRAINT username_unique UNIQUE (username)
        )`, (err) => {
            if (err) {
                console.error("Error creating users table:", err.message);
            } else {
                console.log("Users table created or already exists.");
                // Example: Add a default admin user (for testing purposes)
                // IMPORTANT: In a real application, handle this more securely and perhaps as a separate script or UI interaction.
                const insertAdmin = 'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?,?,?)';
                // Password 'admin123' - In a real scenario, hash this properly with bcrypt before insertion
                // For now, this is a placeholder. Actual hashing will be done in authController.
                db.run(insertAdmin, ["admin", "placeholder_hash", "admin"], (err) => {
                    if (err) {
                        console.error("Error inserting default admin:", err.message);
                    } else {
                        console.log("Default admin user ensured.");
                    }
                });
            }
        });

        // Create resources table
        db.run(`CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            category TEXT CHECK(category IN ('直播素材', '直播插件', '直播工具', '电脑软件')),
            filename TEXT,
            original_filename TEXT,
            uploader_id INTEGER,
            upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploader_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating resources table:", err.message);
            } else {
                console.log("Resources table created or already exists.");
            }
        });
    });
}

module.exports = db;
