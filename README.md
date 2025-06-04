# Resource Management System

A simple Node.js and SQLite based system for managing resource uploads and downloads, with category-based organization and user authentication for uploads.

## Features

- User registration and login (JWT based).
- Role-based access control for uploads (admin, uploader).
- Resource uploading with metadata (name, description, category).
- Resources organized into four categories:
    - 直播素材 (Live Streaming Materials)
    - 直播插件 (Live Streaming Plugins)
    - 直播工具 (Live Streaming Tools)
    - 电脑软件 (Computer Software)
- Publicly accessible resource downloads.
- Minimalist web interface for interaction.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **File Uploads:** Multer
- **Authentication:** bcrypt (password hashing), jsonwebtoken (JWT)
- **Frontend:** HTML, CSS, Vanilla JavaScript

## Project Structure

\`\`\`
.
├── src/
│   ├── controllers/    # Request handlers (business logic)
│   │   ├── authController.js
│   │   └── resourceController.js
│   ├── db/             # Database schema and connection
│   │   ├── database.js
│   │   └── resources.db    # SQLite database file (created on run)
│   ├── middleware/     # Custom Express middleware
│   │   └── authMiddleware.js
│   ├── public/         # Static frontend files (HTML, CSS, JS)
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── upload.html
│   │   ├── style.css
│   │   └── script.js
│   ├── routes/         # API route definitions
│   │   ├── authRoutes.js
│   │   └── resourceRoutes.js
│   └── app.js          # Main Express application setup
├── uploads/            # Directory for storing uploaded files (gitignored)
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
\`\`\`

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Setup and Installation

1.  **Clone the repository (if applicable):**
    \`\`\`bash
    # git clone <repository-url>
    # cd <repository-directory>
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`
    This will install all necessary packages listed in `package.json`.

## Running the Application

1.  **Start the server:**
    \`\`\`bash
    npm start
    \`\`\`
    The server will typically start on `http://localhost:3000`.
    You should see console messages indicating the server is running and the database is connected.

2.  **Access the application:**
    Open your web browser and navigate to `http://localhost:3000`.

## API Endpoints Overview

### Authentication (`/auth`)

-   `POST /auth/register`: Register a new user.
    -   Body: `{ "username": "user", "password": "password", "role": "uploader" }` (role is optional, defaults to 'uploader')
-   `POST /auth/login`: Log in an existing user.
    -   Body: `{ "username": "user", "password": "password" }`
    -   Returns a JWT token upon success.

### Resources (`/resources`)

-   `POST /resources/upload`: Upload a new resource.
    -   Requires Authentication (Bearer Token).
    -   Requires 'uploader' or 'admin' role.
    -   Form-data: `name`, `description`, `category`, `resourceFile` (file)
-   `GET /resources/download/:id`: Download a resource by its ID.
-   `GET /resources?category=<category_name>`: Get resources filtered by category.
    -   Example: `/resources?category=直播素材`
-   `GET /resources/all`: Get all resources.

## Default Admin User (for testing)

During the initial database setup, a default user with `username: admin` and `password_hash: placeholder_hash` (role: admin) is inserted if it doesn't exist.
**Important:** The password 'admin123' is NOT automatically hashed to this placeholder in the DB script. You need to register the 'admin' user through the registration UI/API first to set a proper hashed password for login. The placeholder is just to satisfy the DB schema on init. For a production setup, manage initial admin user creation more securely.
