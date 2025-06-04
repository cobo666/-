const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database.js'); // Assuming db is exported from database.js

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key'; // Use environment variable in production!
const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    // Role validation (optional, can be stricter based on requirements)
    const allowedRoles = ['uploader', 'admin'];
    const userRole = (role && allowedRoles.includes(role)) ? role : 'uploader';

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)";

        db.run(sql, [username, hashedPassword, userRole], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed: users.username")) {
                    return res.status(409).json({ message: "Username already exists." });
                }
                console.error("Database error during registration:", err.message);
                return res.status(500).json({ message: "Error registering user.", error: err.message });
            }
            res.status(201).json({ message: "User registered successfully.", userId: this.lastID });
        });
    } catch (error) {
        console.error("Server error during registration:", error);
        res.status(500).json({ message: "Server error registering user.", error: error.message });
    }
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], async (err, user) => {
        if (err) {
            console.error("Database error during login:", err.message);
            return res.status(500).json({ message: "Error logging in.", error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password." });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid username or password." });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            res.status(200).json({ message: "Login successful.", token: token, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error("Server error during password comparison or token generation:", error);
            res.status(500).json({ message: "Server error logging in.", error: error.message });
        }
    });
};
