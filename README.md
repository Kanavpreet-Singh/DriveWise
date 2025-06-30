# 🚗 DriveWise – A Full-Stack Marketplace for Buying and Selling Second-Hand Cars

**DriveWise** is a fully responsive, feature-rich **MERN stack** web application that enables seamless interaction between **car dealers** and **potential buyers**. It offers real-time chat, intelligent car price predictions, EMI estimation, and location-based listings — all packed into a clean, intuitive interface.

## 🔑 Key Features

### 🧑‍💼 Dual Profile System
- **Dealer Dashboard**:  
  - Add, update, or remove car listings with images (Cloudinary integration).
  - Manage your inventory directly through the dashboard.

- **Customer Interface**:  
  - Browse second-hand car listings.
  - View detailed profiles of listed cars.
  - Real-time chat with dealers.
  - Adding cars to wishlist(similar to 'add to cart').

### 💬 Real-Time Chat (Socket.IO)
- Customers and dealers can communicate instantly.
- Fully secure, private conversations.

### 📍 Geo-Location Based Car Listings
- Uses **MongoDB geospatial queries** to find and display cars **near the user's current location**.
- Location is accessed via the browser with user consent.

### 🧠 Car Price Prediction (Machine Learning)
- A basic yet functional **machine learning model** predicts the price of an old car based on:
  - Brand
  - Manufacturing Year
  - Kilometers Driven
  - Mileage
- Useful for both **sellers** (to estimate selling price) and **buyers** (to verify fair pricing).

### 💰 EMI Calculator
- Customers can use the **EMI predictor** to:
  - Estimate monthly installments.
  - Filter and find cars that fit within their budget.

### 🔐 Secure Authentication
- **JWT-based authentication** for protected routes.
- **OTP verification** via email using **NodeMailer** for secure account access.
- Password-based login and registration with full validation.

### 💻 Fully Responsive UI
- Built with **Tailwind CSS** for a sleek and modern user experience across all devices.

---

## 🛠️ Tech Stack

| Layer        | Technologies Used                                                  |
|--------------|--------------------------------------------------------------------|
| **Frontend** | React, Tailwind CSS, Vite                                          |
| **Backend**  | Node.js, Express.js                                                |
| **Database** | MongoDB with Mongoose                                              |
| **Auth**     | JWT, NodeMailer (for OTP verification), bcrypt                     |
| **Real-Time**| Socket.IO                                                          |
| **ML**       | Custom Python model integrated through API                         |
| **Cloud**    | Cloudinary (image uploads), Geolocation using MongoDB Geo Queries  |
| **Deployment** | Frontend: Vercel • Backend: Render                               |

---
