import React, { useRef, useState } from "react";

export function VideoCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const startVideo = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (err: any) {
      setError(err.message || "Could not access camera/microphone.");
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button onClick={startVideo} disabled={streaming} className="px-4 py-2 rounded bg-green-600 text-white">Start Video</button>
        <button onClick={stopVideo} disabled={!streaming} className="px-4 py-2 rounded bg-red-600 text-white">Stop Video</button>
      </div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs rounded border" />
    </div>
  );
}
