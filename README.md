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

### 💰 Smart Affordability Tool (EMI Discovery)
- Instead of a traditional manual calculator, DriveWise features a **Reverse-EMI Budget Discovery** system.
- Users input their **ideal monthly EMI** and **available downpayment** using interactive sliders.
- The system instantly calculates their **Total Purchasing Power** (based on standard interest/tenure) and filters the catalogue to show cars that match their financial comfort zone.

### 🔐 Secure Authentication ("Secure Vault" Model)

DriveWise uses a hardened **HTTP-Only Cookie** authentication system, moving away from vulnerable `localStorage` storage to an enterprise-grade security model.

- **Storage Strategy:** JWTs are delivered via the `Set-Cookie` header with the `httpOnly: true` flag. This makes the session token **invisible to JavaScript**, providing a robust defense against **XSS (Cross-Site Scripting)** attacks.
- **CSRF & Transport Security:** 
    - Uses `SameSite: Strict` to mitigate Cross-Site Request Forgery.
    - Uses the `secure: true` flag in production to ensure tokens are only ever transmitted over HTTPS.
- **Stateless Identity Sync:** Since the frontend cannot "read" the cookie, I've implemented a custom **"Silent Re-auth"** flow. On app mount, the frontend calls the `/user/me` endpoint to synchronize the logged-in user's state without exposing the underlying token.
- **Enhanced Verification:** 
    - **bcrypt** (salt rounds: 10) for high-strength password hashing.
    - **OTP verification** via Brevo API for registration and password resets.
    - **12-hour expiration** with automatic browser-side cleanup via the global Axios `withCredentials` configuration.

### 💻 Fully Responsive UI
- Built with **Tailwind CSS** for a sleek and modern user experience across all devices.

### 📦 Background Image Processing with Message Queues (BullMQ + Redis)

I didn't want users staring at a loading spinner while 6–10 high-res car images upload to Cloudinary. So I offloaded the entire image upload pipeline to a **background worker** using **BullMQ** (backed by **Redis/Upstash**).

**How it works:**
- When a dealer adds/edits a car, the API immediately saves the car document (with `imageProcessingStatus: "queued"`) and enqueues a job onto a Redis-backed BullMQ queue. The HTTP response returns instantly — the user isn't blocked.
- A **standalone worker process** (`worker/messagingQueueWorker.js`) picks up the job, connects to MongoDB independently, and uploads each image to Cloudinary **sequentially** — updating per-image status in the DB after every single upload.
- The frontend **polls** `GET /car/image-status/:carId` every 2 seconds to get real-time per-image progress. A **Google Drive–style notification panel** (bottom-right corner) shows each file with a live status: `Queued → Uploading → ✓ Done / ✕ Failed`.

**Resilience & Fallback:**
- Before enqueuing, the backend checks `carImageQueue.getWorkersCount()`. If **no workers are online** (e.g., worker crashed or isn't deployed), it falls back to uploading images directly in the backend process using `setImmediate()` — still non-blocking, still with per-image status tracking.
- BullMQ jobs are configured with `attempts: 2` and a fixed 5-second `backoff`, so transient Cloudinary failures get retried automatically.
- The `CarImageUploadJob` MongoDB document stores a full `imageStatuses` array (one entry per image with `index`, `fileName`, `status`, `error`), which acts as an audit trail and powers the real-time UI.

**Per-image granularity:**
- Uploads are **not atomic** — I intentionally used sequential uploads with individual DB updates per image, so that the user sees each file tick off in real time. If 4 out of 6 images succeed and 2 fail, the car still gets the 4 successful images saved (partial success), and the UI clearly shows which files failed and why.

**Why polling over WebSockets:**
- The worker runs as a **separate process** (different from the Express server and the Socket.IO server). To push real-time events via WebSocket, the worker would need to connect to the Socket.IO server as a client, adding coupling and deployment complexity. Polling the existing REST endpoint every 2 seconds is simpler, stateless, and reliable enough for this use case — the status transitions are infrequent (one per image upload, ~2–5 seconds each).

**Scalability & Queue Management:**
- **Parallel Processing:** The worker is configured with a **concurrency of 5**, meaning it can process up to 5 different car upload jobs simultaneously. Within each job, images are processed one by one to ensure accurate state updates.
- **Auto-Pruning:** To prevent Redis memory bloat, the queue is configured to automatically remove the last 100 successful and 200 failed jobs (`removeOnComplete`, `removeOnFail`).
- **Render Deployment (Free Tier):** Includes a minimal HTTP server (`http.createServer`) to satisfy Render's health checks when deployed as a **Web Service**. This prevents the worker process from being shut down in a free account environment.
- **Safe Redis Interaction:** All Redis operations use the `ioredis` client with appropriate retry logic and connection management.

### 🛡️ Secure Transaction Gateway (Razorpay)

To prevent the "Double Purchase" problem and ensure a seamless financial experience, I implemented a robust payment pipeline with a focus on **concurrency control** and **transactional integrity**.

**Key Technical Pillars:**
- **Atomic Car Reservations**: When a user clicks "Buy", the car's state is atomically flipped to `pending` (locked) for 10 minutes using a MongoDB `findOneAndUpdate` operation. This prevents other users from initiating a checkout for the same car simultaneously.
- **ACID Compliance**: The final verification step (matching the Razorpay signature and marking the car as `sold`) is wrapped in a **MongoDB Session (Transaction)**. This ensures that the car is only marked as sold if the payment is valid, and the payment record is saved exactly once — an all-or-nothing guarantee.
- **Token Booking Model**: Instead of charging the full car price (which exceeds standard gateway limits), the system facilitates a **₹10,000 Reservation Fee**. This acts as a dummy yet functional "intent to buy" that removes the car from the marketplace upon successful payment.
- **Race Condition Resilience**: The frontend uses an internal `paymentProcessed` flag to distinguish between a deliberate modal close and an automatic close triggered by success. This prevents accidental reservation cancellations during the verification window.

### ⚡ Redis Caching (Catalogue Performance)

Car listings are read-heavy, so I added a **Redis cache layer** (Upstash) using a **cache-aside (lazy-loading)** pattern to avoid hitting MongoDB on every request.

- **List queries** (`/car/allcars`) are cached with a composite key built from sorted filter params — e.g., `cars:list:{"brand":"Toyota","fuelType":"Diesel"}`. This means the same filter combination always hits the same cache key, regardless of query param order.
- **Detail queries** (`/car/:id`) are cached individually under `cars:detail:<carId>`.
- On any **write operation** (add, edit, delete, image upload completion), all list caches are invalidated using `SCAN` + `DEL` on the `cars:list:*` prefix, and the specific detail cache is deleted. This ensures users never see stale data after a mutation.
- TTL is configurable via `REDIS_CAR_CACHE_TTL` env var. Setting it to `0` keeps entries alive until explicit invalidation — useful when write frequency is low and I want maximum cache hit rate.

### 🚦 API Rate Limiting (Redis-Backed)

To protect the platform from brute-force attacks, spamming, and API abuse, a tiered rate-limiting system using `express-rate-limit` backed by Redis has been implemented.

- **Centralized State in Redis:** Instead of storing request counts in server memory (which fails in multi-instance deployments), the system uses an Upstash Redis cluster. This guarantees accurate counting across multiple server instances.
- **Risk-Based Tiering:** APIs are categorized into three distinct tiers:
  - **High-Risk (Auth, OTP & Payments):** e.g., login, sending OTPs, payment initialization. Strictly limited (e.g., 10 requests / 15 mins) to prevent credential stuffing, SMS toll fraud, and payment spam.
  - **Medium-Risk (Mutations):** e.g., creating/editing cars. Limited to prevent database spam while accommodating power dealers.
  - **Low-Risk (Reads):** e.g., browsing the catalogue. Generous limits to prevent scraping while allowing smooth UI navigation without false positives.
- **Granular Application:** Limits are applied accurately across application layers, overriding global limits for sensitive routes to ensure strong security.

### 🌸 Bloom Filter (Username & Email Availability)

To provide **instant feedback** during signup without hitting the database on every keystroke, a custom **Bloom Filter** backed by **Redis** is used for username and email availability checks.

**How it works:**
- A Bloom Filter is a **space-efficient probabilistic data structure** that can tell you with certainty if an element is **not** in a set, or if it **might** be in a set. This makes it perfect for quick "is this username taken?" checks — a definitive "available" answer is always correct, while a "might be taken" answer triggers a final database confirmation during the actual signup.
- Two separate bit arrays are stored in Redis (`bf:usernames` and `bf:emails`), each using **1 million bits (~125KB)** — tiny compared to storing all usernames in memory.

**Hashing Strategy (Double Hashing):**
- Instead of maintaining 7 independent hash functions, the system uses a **double hashing** technique with two base hashes (`SHA-256` and `SHA-1`). The 7 bit positions are derived as `h1 + i * h2` for `i = 0..6`, which is mathematically proven to provide the same accuracy as 7 independent hash functions while being significantly simpler and faster.
- All inputs are **normalized** (trimmed + lowercased) before hashing to ensure consistent lookups regardless of user input casing.

**Initialization & Persistence:**
- On server startup, the system checks if the bloom filter already exists in Redis. If it does, it skips the rebuild — making restarts instant. If not (first boot or after a Redis flush), it loads all active users from MongoDB and populates the filter.
- A `forceRebuild` flag is available to clear and re-seed the filter from the database, useful after schema migrations or data corrections.
- When a new user registers successfully, their username and email are added to the bloom filter in real-time, so the next availability check instantly reflects the new registration.

**Performance:**
- Uses **Redis pipelines** (`SETBIT`/`GETBIT`) to batch all 7 bit operations into a single round-trip, minimizing network overhead.
- The entire availability check completes in **sub-millisecond** time on the Redis side, compared to a full MongoDB `findOne` query which would require index lookups and network round-trips.

**Frontend Integration:**
- The signup form fires an availability check `onBlur` (when the user tabs out of the username/email field), calling `GET /user/check-availability?type=username&value=...`.
- Instant visual feedback is shown: green "Available" or yellow "Might be taken" — giving users a smooth, responsive experience without waiting for a full database query.

### ⚖️ Load Shedding (Graceful Degradation)

Because Node.js operates on a **single-threaded event loop**, a sudden spike in heavy traffic or intense computations can block the thread, causing the entire server to slow down or fail. To protect the server, a **Load Shedding** mechanism is implemented.

By continuously measuring the server's **event loop lag**, the system detects when the server is over-stressed and automatically prioritizes traffic to prevent a total crash.

**Key Advantages:**
- **Graceful Degradation:** During heavy load, non-critical requests (e.g., viewing standard car listings) are temporarily rejected, while critical actions (e.g., payments processing or logins) continue smoothly.
- **Improved Reliability:** Prevents total server crashes by shedding excess weight before the system runs out of memory or CPU limits.
- **Consistent User Experience:** High-priority, essential features remain fully available even when the system is under extreme strain.

#### 🧠 How it Works (Simple Breakdown)

The server uses a smart "health check" to decide whether to accept or reject new requests during busy times:

1.  **Measuring "Lag"**: Instead of just checking if the CPU is busy, the server measures how long it takes to respond to a simple internal timer. If the timer takes too long to "ding," the server knows it is starting to lag.
2.  **Recent Health Focus**: The server only cares about how it's performing **right now**. It clears its memory every few seconds so that a spike from an hour ago doesn't affect your experience now.
3.  **Smart Prioritization**:
    *   **Low Priority**: Simple browsing (like viewing the car list) is the first to be restricted to save energy.
    *   **High Priority**: Critical actions like creating a listing or deleting an account are protected longer.
    *   **VIP Access**: Payments and Logins are **never** restricted by this system, ensuring you can always finish a purchase or get into your account.
4.  **Graceful Errors**: Instead of the app just "freezing" or "spinning," the server sends a polite message (HTTP 503) telling the app to try again in a few seconds once things have calmed down.

---

## 🛠️ Tech Stack

| Layer        | Technologies Used                                                  |
|--------------|--------------------------------------------------------------------|
| **Frontend** | React, Tailwind CSS, Vite                                          |
| **Backend**  | Node.js, Express.js                                                |
| **Database** | MongoDB with Mongoose                                              |
| **Queues**   | BullMQ, Redis (Upstash), standalone worker process                 |
| **Auth**     | JWT, Brevo API (for OTP verification), bcrypt                      |
| **Real-Time**| Socket.IO                                                          |
| **ML**       | Custom Python model integrated through API                         |
| **Cloud**    | Cloudinary (image uploads), Geolocation using MongoDB Geo Queries  |
| **Deployment** | Frontend: Vercel • Backend: Render                               |

---
