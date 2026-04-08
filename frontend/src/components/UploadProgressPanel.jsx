import { useState } from "react";
import { useUploadTracker } from "../context/UploadTrackerContext";
import {
  X,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Loader,
  ImageIcon,
} from "lucide-react";

const UploadProgressPanel = () => {
  const { uploads, dismissJob, clearAllDone } = useUploadTracker();
  const [collapsed, setCollapsed] = useState(false);

  if (uploads.length === 0) return null;

  const totalImages = uploads.reduce((sum, u) => sum + u.images.length, 0);
  const completedImages = uploads.reduce(
    (sum, u) => sum + u.images.filter((img) => img.status === "completed").length,
    0
  );
  const activeUploads = uploads.filter(
    (u) => u.status === "queued" || u.status === "processing"
  );
  const doneCount = uploads.length - activeUploads.length;

  const headerText =
    activeUploads.length > 0
      ? `Uploading ${completedImages}/${totalImages} images…`
      : `${totalImages} image${totalImages > 1 ? "s" : ""} done`;

  return (
    <>
      <style>{`
        .upload-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 370px;
          max-height: 480px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          background: linear-gradient(
            135deg,
            rgba(20, 33, 61, 0.94) 0%,
            rgba(20, 33, 61, 0.98) 100%
          );
          font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
          animation: uploadPanelSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes uploadPanelSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .upload-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(252, 163, 17, 0.12);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }

        .upload-panel-header:hover {
          background: rgba(252, 163, 17, 0.18);
        }

        .upload-panel-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upload-panel-header-title {
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .upload-panel-header-badge {
          background: #fca311;
          color: #14213d;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          min-width: 20px;
          text-align: center;
        }

        .upload-panel-header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .upload-panel-icon-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .upload-panel-icon-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        .upload-panel-body {
          overflow-y: auto;
          max-height: 380px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
        }

        .upload-panel-body::-webkit-scrollbar { width: 4px; }
        .upload-panel-body::-webkit-scrollbar-track { background: transparent; }
        .upload-panel-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }

        /* ── car group ── */

        .upload-car-group {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .upload-car-group:last-child {
          border-bottom: none;
        }

        .upload-car-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px 4px;
        }

        .upload-car-name {
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        .upload-car-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .upload-car-dismiss:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        /* ── image row ── */

        .upload-img-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 16px 7px 28px;
          animation: uploadRowFadeIn 0.2s ease forwards;
        }

        @keyframes uploadRowFadeIn {
          from { opacity: 0; transform: translateX(6px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .upload-img-icon {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .upload-img-icon--queued {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.35);
        }

        .upload-img-icon--uploading {
          background: rgba(252, 163, 17, 0.15);
          color: #fca311;
        }

        .upload-img-icon--completed {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .upload-img-icon--failed {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .upload-img-info {
          flex: 1;
          min-width: 0;
        }

        .upload-img-name {
          color: rgba(255, 255, 255, 0.85);
          font-size: 12.5px;
          font-weight: 450;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .upload-img-error {
          color: rgba(239, 68, 68, 0.75);
          font-size: 10.5px;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .upload-img-status-label {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 500;
        }

        .upload-img-status-label--queued { color: rgba(255,255,255,0.3); }
        .upload-img-status-label--uploading { color: rgba(252,163,17,0.8); }
        .upload-img-status-label--completed { color: rgba(34,197,94,0.8); }
        .upload-img-status-label--failed { color: rgba(239,68,68,0.8); }

        @keyframes uploadSpinnerRotate {
          to { transform: rotate(360deg); }
        }

        .upload-spinner {
          animation: uploadSpinnerRotate 1s linear infinite;
        }

        .upload-panel-footer {
          padding: 8px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: flex-end;
        }

        .upload-panel-clear-btn {
          background: none;
          border: none;
          color: rgba(252, 163, 17, 0.7);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .upload-panel-clear-btn:hover {
          color: #fca311;
          background: rgba(252, 163, 17, 0.1);
        }

        @media (max-width: 480px) {
          .upload-panel {
            left: 12px;
            right: 12px;
            bottom: 12px;
            width: auto;
          }
        }
      `}</style>

      <div className="upload-panel" role="region" aria-label="Upload progress">
        {/* header */}
        <div
          className="upload-panel-header"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="upload-panel-header-left">
            <span className="upload-panel-header-title">{headerText}</span>
            <span className="upload-panel-header-badge">{totalImages}</span>
          </div>

          <div className="upload-panel-header-actions">
            <button
              className="upload-panel-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((c) => !c);
              }}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* body */}
        {!collapsed && (
          <>
            <div className="upload-panel-body">
              {uploads.map((upload) => (
                <div className="upload-car-group" key={upload.id}>
                  {/* car name header */}
                  <div className="upload-car-header">
                    <span className="upload-car-name" title={upload.carName}>
                      {upload.carName}
                    </span>
                    <button
                      className="upload-car-dismiss"
                      onClick={() => dismissJob(upload.id)}
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* per-image rows */}
                  {upload.images.map((img) => (
                    <div className="upload-img-row" key={`${upload.id}-${img.index}`}>
                      {/* status icon */}
                      <div
                        className={`upload-img-icon upload-img-icon--${img.status}`}
                      >
                        {img.status === "queued" && (
                          <ImageIcon size={13} />
                        )}
                        {img.status === "uploading" && (
                          <Loader size={13} className="upload-spinner" />
                        )}
                        {img.status === "completed" && <Check size={13} />}
                        {img.status === "failed" && <AlertCircle size={13} />}
                      </div>

                      {/* file name + error */}
                      <div className="upload-img-info">
                        <div className="upload-img-name" title={img.fileName}>
                          {img.fileName}
                        </div>
                        {img.status === "failed" && img.error && (
                          <div
                            className="upload-img-error"
                            title={img.error}
                          >
                            {img.error}
                          </div>
                        )}
                      </div>

                      {/* status text */}
                      <span
                        className={`upload-img-status-label upload-img-status-label--${img.status}`}
                      >
                        {img.status === "queued" && "Queued"}
                        {img.status === "uploading" && "Uploading"}
                        {img.status === "completed" && "✓ Done"}
                        {img.status === "failed" && "✕ Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* footer */}
            {doneCount > 0 && (
              <div className="upload-panel-footer">
                <button
                  className="upload-panel-clear-btn"
                  onClick={clearAllDone}
                >
                  Clear finished
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default UploadProgressPanel;
