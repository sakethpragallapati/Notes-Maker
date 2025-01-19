# Express Notes Application

This is a simple Notes application built using **Node.js**, **Express**, **MongoDB**, and **EJS** for templating. The app includes user authentication, note creation, and note deletion functionalities.

---

## Features

1. User Registration and Login.
2. Secure Password Storage with bcrypt.
3. JWT-based Authentication for session management.
4. Create, View, and Delete Notes.

---

## Requirements

- Node.js (v14 or above)
- MongoDB (v5 or above)

---

## Installation Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies
Run the following command to install the required dependencies:
```bash
npm install
```

### 3. Setup MongoDB
- Make sure MongoDB is installed and running on your system.
- Update the `MONGOURL` variable in the code if your MongoDB instance is not running locally.

### 4. Start the Application
Run the server using:
```bash
node app.js
```

The app will be available at `http://localhost:8000/home`.

---

## Folder Structure
```
.
|-- app.js                # Main server file
|-- models/               # Folder containing MongoDB models
|   |-- users.js          # User schema
|   |-- notes.js          # Notes schema
|-- public/               # Public folder for static files
|-- views/                # EJS templates
|   |-- home.ejs
|   |-- login.ejs
|   |-- register.ejs
|   |-- accountpage.ejs
|   |-- notesform.ejs
|-- package.json          # Project dependencies
```

---

## Usage

### 1. Home Page
- Navigate to `/home`.
- This is the entry point of the application.

### 2. Registration
- Navigate to `/register`.
- Enter a unique username and a password to create an account.

### 3. Login
- Navigate to `/login`.
- Use your credentials to log in.
- Upon successful login, you will be redirected to your account page.

### 4. Creating Notes
- Navigate to `/create` after logging in.
- Enter a title and optional note content.
- Submit to save your note.

### 5. Deleting Notes
- Navigate to `/account`.
- Click the delete button next to the note you wish to delete.

### 6. Logout
- Navigate to `/logout` to end your session and clear cookies.

---

## Security Features

1. **Password Security**: Passwords are hashed using bcrypt before being stored in the database.
2. **Session Management**: Authentication is managed using JWT and Express sessions.
3. **Input Validation**: User input is validated with express-validator to ensure data integrity.

---

## Troubleshooting

- **Database Connection Issues**: Ensure MongoDB is running and the `MONGOURL` is correct.
- **Port Conflicts**: If port 8000 is in use, change the `PORT` variable in the code.

---

## Contributing
Feel free to fork this repository, raise issues, or submit pull requests to enhance functionality.

---
