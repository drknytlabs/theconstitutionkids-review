import { useState, useRef } from "react";

export default function ReviewApp() {
  const [videoUrl, setVideoUrl] = useState("");
  const videoRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000); // short 3-second test
    } catch (err) {
      alert("❌ Media error: " + err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Video Test</h1>
      <button onClick={startRecording} className="bg-blue-500 text-white px-4 py-2 rounded">
        🎥 Start Test Recording
      </button>
      {videoUrl && (
        <video
          src={videoUrl}
          controls
          autoPlay
          muted
          className="mt-4 w-full h-64 object-contain"
        />
      )}
    </div>
  );
}