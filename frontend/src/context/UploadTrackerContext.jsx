import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";

const UploadTrackerContext = createContext();

const POLL_INTERVAL_MS = 2000;
const AUTO_DISMISS_MS = 8000;

export const UploadTrackerProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);
  const pollTimerRef = useRef(null);
  const dismissTimersRef = useRef({});

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const genId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // ── public API ───────────────────────────────────────────────────

  const addUploadJob = useCallback((carId, carName, fileNames = []) => {
    const entry = {
      id: genId(),
      carId,
      carName: carName || "Car",
      status: "queued",
      error: null,
      images: fileNames.map((name, i) => ({
        index: i,
        fileName: name || `Image ${i + 1}`,
        status: "queued",
        error: null,
      })),
      startedAt: Date.now(),
    };
    setUploads((prev) => [entry, ...prev]);
  }, []);

  const dismissJob = useCallback((id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    if (dismissTimersRef.current[id]) {
      clearTimeout(dismissTimersRef.current[id]);
      delete dismissTimersRef.current[id];
    }
  }, []);

  const clearAllDone = useCallback(() => {
    setUploads((prev) =>
      prev.filter((u) => u.status !== "completed" && u.status !== "failed")
    );
  }, []);

  // ── polling ──────────────────────────────────────────────────────

  useEffect(() => {
    const activeJobs = uploads.filter(
      (u) => u.status === "queued" || u.status === "processing"
    );

    if (activeJobs.length === 0) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const poll = async () => {
      for (const job of activeJobs) {
        try {
          const res = await axios.get(
            `${backendUrl}/car/image-status/${job.carId}`
          );

          const { status, error, imageCount, imageStatuses } = res.data;

          setUploads((prev) =>
            prev.map((u) => {
              if (u.id !== job.id) return u;

              // Update per-image statuses from server
              const updatedImages = u.images.map((img) => {
                const serverImg = Array.isArray(imageStatuses)
                  ? imageStatuses.find((s) => s.index === img.index)
                  : null;
                return serverImg
                  ? {
                      ...img,
                      status: serverImg.status,
                      error: serverImg.error || null,
                    }
                  : img;
              });

              return {
                ...u,
                status,
                error: error || null,
                images: updatedImages,
              };
            })
          );

          // schedule auto-dismiss when terminal
          if (
            (status === "completed" || status === "failed") &&
            !dismissTimersRef.current[job.id]
          ) {
            dismissTimersRef.current[job.id] = setTimeout(() => {
              dismissJob(job.id);
            }, AUTO_DISMISS_MS);

            // If this was a completion and it's the last active job, trigger a page refresh
            if (status === "completed") {
              const remainingActive = uploads.filter(
                (u) => u.id !== job.id && (u.status === "processing" || u.status === "queued")
              );
              if (remainingActive.length === 0) {
                console.log("All image processing complete. Refreshing page in 3s...");
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            }
          }
        } catch {
          // network glitch — silently retry on next poll
        }
      }
    };

    poll();

    if (!pollTimerRef.current) {
      pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, backendUrl]);

  useEffect(() => {
    return () => {
      Object.values(dismissTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <UploadTrackerContext.Provider
      value={{ uploads, addUploadJob, dismissJob, clearAllDone }}
    >
      {children}
    </UploadTrackerContext.Provider>
  );
};

export const useUploadTracker = () => useContext(UploadTrackerContext);
