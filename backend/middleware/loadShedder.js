const { monitorEventLoopDelay } = require('perf_hooks');

// monitorEventLoopDelay returns a histogram object.
// The resolution parameter tells it how often to sample in milliseconds.
const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

let currentLagMs = 0;

// Update current lag every 500ms and reset histogram to keep it "fresh"
setInterval(() => {
    // Using the 99th percentile (p99) is much more reactive than the mean
    // because it catches the "spikes" that block the loop.
    currentLagMs = Math.round(histogram.percentile(99) / 1_000_000);
    histogram.reset();
}, 500);

const LAG_THRESHOLD_NORMAL_MS = 50; // 50ms (p99) is a good sign of stress
const LAG_THRESHOLD_HIGH_MS = 100;

/**
 * Helper to get current lag in milliseconds for logging/debugging
 */
const getCurrentLagMs = () => {
    return currentLagMs;
};

/**
 * Middleware for shedding NORMAL priority traffic (e.g., browsing catalogue)
 */
const shedNormalPriority = (req, res, next) => {
    if (currentLagMs > LAG_THRESHOLD_NORMAL_MS) {
        console.warn(`[Load Shedding] Dropped NORMAL request to ${req.method} ${req.originalUrl}. Current p99 Lag: ${currentLagMs}ms`);
        res.set('Retry-After', '5');
        return res.status(503).json({
            success: false,
            message: "Server is currently experiencing high load. Please try again in a few moments.",
            errorType: "server_overload"
        });
    }
    next();
};

/**
 * Middleware for shedding HIGH priority traffic (e.g., creating/editing items)
 * CRITICAL paths (like Payments/Login) shouldn't use shedding middlewares at all.
 */
const shedHighPriority = (req, res, next) => {
    if (currentLagMs > LAG_THRESHOLD_HIGH_MS) {
        console.warn(`[Load Shedding] Dropped HIGH request to ${req.method} ${req.originalUrl}. Current p99 Lag: ${currentLagMs}ms`);
        res.set('Retry-After', '10');
        return res.status(503).json({
            success: false,
            message: "Service unavailable due to extreme load. Please try again later.",
            errorType: "server_overload"
        });
    }
    next();
};

/**
 * A testing/admin route middleware to manually block the event loop heavily.
 * NEVER exposed without auth, but for demonstration we can expose it via a specific admin route.
 */
const simulateStress = (req, res) => {
    const stressDurationMs = parseInt(req.query.ms) || 5000;
    console.warn(`[Stress Test] Blocking Event Loop for ${stressDurationMs}ms...`);
    
    const start = Date.now();
    // Synchronous while loop to completely block the single thread
    while (Date.now() - start < stressDurationMs) {
        // block
    }
    
    console.warn(`[Stress Test] Finished Blocking. Current Lag: ${getCurrentLagMs()}ms`);
    res.json({ success: true, message: `Event loop blocked for ${stressDurationMs}ms`, currentLagMs: getCurrentLagMs() });
};

module.exports = {
    shedNormalPriority,
    shedHighPriority,
    getCurrentLagMs,
    simulateStress
};
