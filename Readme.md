# 🎥 Full-Stack YouTube-Like Video Platform (Backend)

<p align="left">

![NodeJS](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-darkgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Auth-blueviolet?logo=jsonwebtokens)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20Storage-blue?logo=cloudinary)
![Postman](https://img.shields.io/badge/Postman-API%20Testing-orange?logo=postman)
![Multer](https://img.shields.io/badge/Multer-File%20Upload-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![MadeWithLove](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red)

</p>

---

A production-grade Node.js + Express + MongoDB backend for a complete video platform:

* User Authentication (Access + Refresh Tokens)
* Video Upload (Cloudinary)
* Likes, Comments, Subscriptions
* Playlists
* Dashboard Analytics (Aggregation Pipelines)
* Views Tracking
* Secure Cookie-based auth
* MVC architecture with reusable utilities
* Centralized error handling & async handling

---

## 🚀 Tech Stack

| Layer           | Tech                         |
| --------------- | ---------------------------- |
| Runtime         | Node.js                      |
| Framework       | Express.js                   |
| Database        | MongoDB + Mongoose           |
| Auth            | JWT (Access + Refresh Token) |
| Hashing         | bcrypt                       |
| Media Storage   | Cloudinary                   |
| ODM             | Mongoose                     |
| Aggregations    | MongoDB Pipelines            |
| Upload Handling | Multer                       |
| Security        | HTTP-Only Cookies            |
| Validation      | Mongoose Validators          |

---

## 🔐 Authentication Flow (Production Ready)

### ✔ Access Token

* short-lived
* stored in HTTP-Only cookie
* used for protected routes

### ✔ Refresh Token

* long-lived
* stored in DB + cookie
* regenerates access token

### 🔁 Token Rotation

* refresh token replaces previous
* logout clears cookies
* compromised tokens invalidated

---

## 🔑 Security Features

* bcrypt password hashing
* httpOnly & secure cookies
* JWT verification middleware
* role / ownership checks
* input validation
* expiry based token rules

---

## 📁 Project Structure (Clean MVC)

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middlewares/
 ├── utils/
 ├── db/
 └── app.js
```

Centralized utilities include:

| Utility         | Purpose          |
| --------------- | ---------------- |
| asyncHandler    | avoids try–catch |
| ApiError        | standard error   |
| ApiResponse     | consistent JSON  |
| cloudinary      | uploads/deletes  |
| auth middleware | JWT verify       |

---

## 📊 Dashboard & Analytics (Aggregation Pipelines)

Provides:

* total channel videos
* total views
* total likes
* total subscribers

Powered by:

* `$lookup`
* `$group`
* `$size`
* `$sum`
* `$match`

---

## 🎬 Video Module

* upload to Cloudinary
* update / delete
* like count
* comment count
* owner details
* pagination
* view increment system

---

## 📂 Playlist Module

* create playlist
* rename
* delete
* add/remove video
* get playlist with full details

---

## 🔔 Subscription Module

* toggle subscribe / unsubscribe
* subscriber list
* subscribed channel list
* count subscribers

---

## 👤 User Module

* register / login / logout
* refresh token
* change password
* update profile
* avatar & cover pic update

---

## ⚙ Environment Variables

```
MONGO_URI=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_ORIGIN=
```

---

## 🧭 API Route Overview

### 🔐 Auth

* `/api/v1/users/register`
* `/api/v1/users/login`
* `/api/v1/users/logout`
* `/api/v1/users/refresh-token`

### 🎬 Video

* `POST /videos`
* `GET /videos/:videoId`
* `PATCH /videos/:videoId`
* `DELETE /videos/:videoId`
* `PATCH /videos/:videoId/toggle-publish`

### 👍 Likes

* `POST /likes/toggle/v/:videoId`

### 💬 Comments

* `POST /comments/:videoId`
* `DELETE /comments/:commentId`

### 📂 Playlist

* `POST /playlist`
* `PATCH /playlist/:id`
* `DELETE /playlist/:id`
* `PATCH /playlist/add/:videoId/:playlistId`
* `PATCH /playlist/remove/:videoId/:playlistId`

### 🔔 Subscription

* `POST /subscription/c/:channelId`
* `GET /subscription/c/:channelId`
* `GET /subscription/u/:userId`

### 📊 Dashboard

* `/dashboard/stats`
* `/dashboard/videos`

### ❤️ Health Check

* `/healthcheck`

---

## ✅ Healthcheck Example

```json
{
  "service": "API server",
  "status": "ok",
  "database": { "status": "connected" }
}
```

---

## 🏁 Final Note

This backend is ready for:

* React / Next.js frontend
* Mobile apps
* Production deployment
