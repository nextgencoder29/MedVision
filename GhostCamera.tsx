"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Alignment, alignmentHint, alignmentLevel, measureAlignment } from "@/lib/alignment";

interface GhostCameraProps {
  ghostSrc: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const MAX_DIM = 640;

export default function GhostCamera({ ghostSrc, onCapture, onClose }: GhostCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.4);
  const [showSlider, setShowSlider] = useState(false);
  // After a capture, the shot is held for review with its framing score before it is handed back.
  const [shot, setShot] = useState<string | null>(null);
  const [alignment, setAlignment] = useState<Alignment | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not supported in this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not open the camera.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const k = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(video.videoWidth * k);
    c.height = Math.round(video.videoHeight * k);
    c.getContext("2d")!.drawImage(video, 0, 0, c.width, c.height);
    const src = c.toDataURL("image/jpeg", 0.85);
    setShot(src);
    setAlignment(null);
    setChecking(true);
    measureAlignment(ghostSrc, src)
      .then(setAlignment)
      .catch(() => setAlignment(null))
      .finally(() => setChecking(false));
  }

  function retake() {
    setShot(null);
    setAlignment(null);
  }

  const level = alignment ? alignmentLevel(alignment) : null;
  const ringColour = level === "good" ? "#16A34A" : level === "fair" ? "#F59E0B" : "#E63946";

  return (
    <div className="absolute inset-0 z-50 bg-dark flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Captured photo" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {ready && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ghostSrc}
            alt="Previous visit, for alignment"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[200px] h-[140px] border-2 border-dashed border-white/60 rounded-[50%]" />
        </div>
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="bg-dark/70 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
            Ghost of previous photo — match its position
          </span>
          <button onClick={onClose} aria-label="Close camera" className="bg-dark/70 text-white p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-dark">{error}</p>
              <p className="text-xs text-muted mt-1">Use &quot;Upload photo&quot; instead.</p>
              <button onClick={onClose} className="mt-3 px-4 py-2 rounded-full bg-dark text-white text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        )}
        {shot && (
          <div className="absolute bottom-3 left-3 right-3 bg-white rounded-2xl p-3 flex items-center gap-3" role="status" aria-live="polite">
            {checking || !alignment ? (
              <p className="text-xs font-semibold text-dark">{checking ? "Checking framing against the last visit..." : "Could not compare with the last visit."}</p>
            ) : (
              <>
                <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0 -rotate-90" aria-hidden="true">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#F0F0F0" strokeWidth="5" />
                  <circle
                    cx="22" cy="22" r="18" fill="none" stroke={ringColour} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18 * alignment.score} ${2 * Math.PI * 18}`}
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-dark">
                    Framing {Math.round(alignment.score * 100)}/100 ·{" "}
                    {level === "good" ? "good match" : level === "fair" ? "usable, could be closer" : "poor match, retake"}
                  </p>
                  <p className="text-[11px] text-muted leading-snug">{alignmentHint(alignment)}</p>
                </div>
              </>
            )}
          </div>
        )}
        {showSlider && ready && !shot && (
          <div className="absolute bottom-24 left-4 right-4 bg-dark/70 rounded-2xl px-4 py-3">
            <p className="text-white text-[11px] font-semibold mb-1">Ghost strength</p>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>
      {shot ? (
        <div className="shrink-0 bg-dark px-4 pt-3 pb-5 flex items-center justify-center gap-3">
          <button onClick={retake} className="flex-1 py-3 rounded-full bg-white/15 text-white text-sm font-bold flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Retake
          </button>
          <button
            onClick={() => onCapture(shot)}
            disabled={checking}
            className="flex-1 py-3 rounded-full bg-white text-dark text-sm font-bold disabled:opacity-50"
          >
            Use photo
          </button>
        </div>
      ) : (
      <div className="shrink-0 bg-dark px-4 pt-3 pb-5 flex items-center justify-center gap-6">
        <button
          onClick={() => setShowSlider((v) => !v)}
          aria-label="Adjust ghost strength"
          className={`p-3 rounded-full ${showSlider ? "bg-white text-dark" : "bg-white/15 text-white"}`}
        >
          <SlidersHorizontal size={18} />
        </button>
        <button
          onClick={capture}
          disabled={!ready}
          aria-label="Capture photo"
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
        >
          <Camera size={26} className="text-dark" />
        </button>
        <div className="w-11" />
      </div>
      )}
    </div>
  );
}
