import { useState, useRef } from "react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";

export default function ReviewApp() {
  const [videoUrl, setVideoUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [social, setSocial] = useState("");

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        videoRef.current.srcObject = null;
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("❌ Media error: " + err.message);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setRecording(false);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !review || !videoUrl) {
      alert("❗ Please complete all fields and record a video.");
      return;
    }

    const response = await fetch("/api/submit-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, review, social, videoUrl }),
    });

    if (response.ok) {
      alert("✅ Review submitted!");
      setName("");
      setReview("");
      setSocial("");
      setVideoUrl("");
    } else {
      alert("❌ Submission failed. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-2">Leave a Review</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Your Review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
        <Input
          placeholder="Instagram, TikTok, or Twitter link"
          value={social}
          onChange={(e) => setSocial(e.target.value)}
        />
        <Button type="submit">Submit Review</Button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Record a Video</h2>
        {!recording ? (
          <Button onClick={startRecording}>🎥 Start Recording</Button>
        ) : (
          <Button variant="destructive" onClick={stopRecording}>⏹ Stop</Button>
        )}
        {recording && (
          <div className="text-red-600 font-mono text-sm">⏱ {elapsed}s</div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 border rounded bg-black"
        />
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            className="w-full h-64 border rounded mt-2"
          />
        )}
      </div>
    </div>
  );
}