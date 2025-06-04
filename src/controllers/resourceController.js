const db = require('../db/database.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads'); // Adjusted path
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwrites and issues with special characters
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Example: 100MB file size limit
    fileFilter: function (req, file, cb) {
        // Add any specific file type validation here if needed
        cb(null, true); // Accept all files for now
    }
}).single('resourceFile'); // 'resourceFile' is the name of the field in the form

exports.uploadResource = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("Multer error:", err);
            return res.status(400).json({ message: "File upload error: " + err.message });
        } else if (err) {
            console.error("Unknown upload error:", err);
            return res.status(500).json({ message: "Unknown error during file upload: " + err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const { name, description, category } = req.body;
        const uploader_id = req.user ? req.user.userId : null; // Get uploader_id from authenticated user

        if (!name || !category || !uploader_id) {
            // Clean up uploaded file if metadata is missing
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            });
            return res.status(400).json({ message: "Name, category, and uploader ID are required." });
        }

        const allowedCategories = ['直播素材', '直播插件', '直播工具', '电脑软件'];
        if (!allowedCategories.includes(category)) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting file due to invalid category:", unlinkErr);
            });
            return res.status(400).json({ message: "Invalid category provided." });
        }

        const sql = `INSERT INTO resources (name, description, category, filename, original_filename, uploader_id)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [name, description, category, req.file.filename, req.file.originalname, uploader_id];

        db.run(sql, params, function (err) {
            if (err) {
                console.error("Database error saving resource:", err.message);
                // Clean up uploaded file if DB insert fails
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting file after DB error:", unlinkErr);
                });
                return res.status(500).json({ message: "Error saving resource to database.", error: err.message });
            }
            res.status(201).json({
                message: "Resource uploaded successfully.",
                resourceId: this.lastID,
                filePath: `/uploads/${req.file.filename}` // Corrected template literal
            });
        });
    });
};

exports.downloadResource = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM resources WHERE id = ?";

    db.get(sql, [id], (err, resource) => {
        if (err) {
            console.error("Database error fetching resource for download:", err.message);
            return res.status(500).json({ message: "Error fetching resource.", error: err.message });
        }
        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        const filePath = path.join(UPLOAD_DIR, resource.filename);

        if (fs.existsSync(filePath)) {
            // Set Content-Disposition header to suggest original filename for download
            res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(resource.original_filename) + '"');
            res.download(filePath, resource.original_filename, (downloadErr) => {
                if (downloadErr) {
                    console.error("Error during file download:", downloadErr);
                    // Avoid sending another response if headers already sent
                    if (!res.headersSent) {
                        res.status(500).json({ message: "Error downloading file." });
                    }
                }
            });
        } else {
            console.error("File not found on server:", filePath);
            return res.status(404).json({ message: "File not found on server." });
        }
    });
};

exports.getResourcesByCategory = (req, res) => {
    const { category } = req.query;
    if (!category) {
        return res.status(400).json({ message: "Category query parameter is required." });
    }

    const sql = "SELECT id, name, description, category, original_filename, upload_timestamp FROM resources WHERE category = ?";
    db.all(sql, [category], (err, rows) => {
        if (err) {
            console.error("Database error fetching resources by category:", err.message);
            return res.status(500).json({ message: "Error fetching resources.", error: err.message });
        }
        res.status(200).json(rows);
    });
};

exports.getAllResources = (req, res) => {
    const sql = "SELECT id, name, description, category, original_filename, upload_timestamp FROM resources ORDER BY upload_timestamp DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Database error fetching all resources:", err.message);
            return res.status(500).json({ message: "Error fetching all resources.", error: err.message });
        }
        res.status(200).json(rows);
    });
};
