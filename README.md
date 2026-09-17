# Job Portal Backend

A RESTful backend for a Job Portal application built with **Node.js, Express.js, and MongoDB**.

The backend provides user authentication, job management, job applications, saved jobs, resume/profile uploads, admin functionality, and external job listings through the **Adzuna API**.

## Features

* User registration and login
* JWT-based authentication
* Password hashing with bcrypt
* User profile management
* Resume upload and profile picture upload
* Cloudinary integration for file storage
* Create, view, update, and delete jobs
* Job ownership protection
* Job expiry and active/inactive handling
* Apply to internal jobs
* Apply to external Adzuna jobs
* Resume snapshot when applying
* Application status management
* Save and remove jobs
* Support for internal and external saved jobs
* Adzuna external job integration
* External job caching using MongoDB TTL
* Admin access for application management
* Input validation and error handling

## Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT**
* **bcrypt**
* **Multer**
* **Cloudinary**
* **Axios**
* **Adzuna API**

## Project Structure

```text
Job_Portal/
├── app.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── config/
│   ├── .env
│   └── .env.sample
├── controllers/
│   ├── applyController.js
│   ├── authControllers.js
│   ├── externalJobController.js
│   ├── jobController.js
│   └── savedJobController.js
├── middlewares/
│   ├── adminMiddleware.js
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── models/
│   ├── ApplicationModel.js
│   ├── ExternalJob.js
│   ├── JobModel.js
│   └── UserModel.js
├── routes/
│   ├── applyRoutes.js
│   ├── authRoutes.js
│   └── jobRoutes.js
└── services/
    └── adzunaService.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Jaskaran-6Singh/Job_Portal.git
cd Job_Portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
config/.env
```

Use `config/.env.sample` as a template.

Required variables:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

JWT_SECRET=your_jwt_secret

ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

> Never commit the real `.env` file or any API credentials to GitHub.

### 4. Start the server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

## API Routes

### Authentication

| Method | Endpoint                    | Description         | Auth |
| ------ | --------------------------- | ------------------- | ---- |
| POST   | `/api/auth/register`        | Register a new user | No   |
| POST   | `/api/auth/login`           | Login               | No   |
| GET    | `/api/auth/profile`         | Get user profile    | Yes  |
| PUT    | `/api/auth/profile`         | Update profile      | Yes  |
| PUT    | `/api/auth/change-password` | Change password     | Yes  |

### Jobs

| Method | Endpoint              | Description              | Auth |
| ------ | --------------------- | ------------------------ | ---- |
| GET    | `/api/jobs`           | Get available jobs       | No   |
| GET    | `/api/jobs/:id`       | Get a specific job       | No   |
| POST   | `/api/jobs`           | Create a job             | Yes  |
| PUT    | `/api/jobs/:id`       | Update own job           | Yes  |
| DELETE | `/api/jobs/:id`       | Delete own job           | Yes  |
| GET    | `/api/jobs/external`  | Get external Adzuna jobs | No   |
| GET    | `/api/jobs/saved`     | Get saved jobs           | Yes  |
| POST   | `/api/jobs/saved`     | Save a job               | Yes  |
| DELETE | `/api/jobs/saved/:id` | Remove a saved job       | Yes  |

### Applications

| Method | Endpoint                     | Description                | Auth  |
| ------ | ---------------------------- | -------------------------- | ----- |
| POST   | `/api/apply/:jobId`          | Apply to an internal job   | Yes   |
| POST   | `/api/apply/external`        | Apply to an external job   | Yes   |
| GET    | `/api/apply/my-applications` | Get own applications       | Yes   |
| GET    | `/api/apply/:id`             | Get a specific application | Yes   |
| GET    | `/api/apply/admin/all`       | Get all applications       | Admin |
| PATCH  | `/api/apply/:id/status`      | Update application status  | Admin |

## Authentication

Protected routes use JWT authentication.

Include the token in the request header:

```text
Authorization: Bearer <your_jwt_token>
```

## Application Status

Applications support the following statuses:

* `Applied`
* `Shortlisted`
* `Selected`
* `Rejected`

## External Jobs

The backend integrates with the **Adzuna Jobs API** to provide external job listings.

External jobs are cached in MongoDB to reduce unnecessary API requests. Cached jobs automatically expire using MongoDB's TTL index.

When a user applies to an external job, relevant job information is stored locally with the application so the application remains associated with the job even after the external listing changes or expires.

## File Uploads

The backend supports:

* **Resume:** PDF only
* **Profile picture:** JPG, PNG, or WEBP
* Maximum file size: **5 MB**

Files are uploaded to Cloudinary.

## Security

* Passwords are hashed using bcrypt.
* JWT authentication protects private routes.
* User ownership is checked before modifying or deleting resources.
* Admin-only routes are protected by role-based authorization.
* Environment secrets are excluded from Git using `.gitignore`.
* Duplicate applications and saved jobs are prevented.

## Development

The backend uses **Nodemon** for development:

```bash
npm run dev
```

Any changes to the server-side code will automatically restart the development server.

## License

This project is currently for educational and portfolio purposes.
