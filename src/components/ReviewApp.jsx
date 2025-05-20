import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

export default function ReviewApp() {
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [social, setSocial] = useState("");
  const [location, setLocation] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [privateSubmit, setPrivateSubmit] = useState(false);
  const [consent, setConsent] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [, setMediaStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
      },
      (error) => console.warn("Geolocation error:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      setMediaStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("name", name);
        const response = await fetch("/api/upload-video", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setVideoUrl(data.url);
        setMediaStream(null);
        toast.success("Video uploaded");
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (error) {
      console.error("Camera/mic access failed:", error);
      toast.error("Camera/mic access failed");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleSubmit = async () => {
    if (!review || !name || !consent) {
      toast.error("Please complete all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("review", review);
    formData.append("videoUrl", videoUrl);
    formData.append("consent", consent);
    formData.append("contact", contact);
    formData.append("social", social);
    formData.append("location", location);
    formData.append("privateSubmit", privateSubmit);
    if (documentFile) formData.append("document", documentFile);

    try {
      await fetch("/api/review", {
        method: "POST",
        body: formData,
      });
      setSubmitted(true);
      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit review.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <Card className="w-full max-w-2xl shadow-lg border border-gray-200">
        <CardContent className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">Leave a Review</h1>
          {submitted ? (
            <p className="text-green-600 text-center">Thank you for your review!</p>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="space-y-4">
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input placeholder="Contact info (email or phone, optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
                <Input placeholder="Social media or website (optional)" value={social} onChange={(e) => setSocial(e.target.value)} />
              </div>

              <Textarea placeholder="Write your review here... (max 500 chars)" rows={6} maxLength={500} value={review} onChange={(e) => setReview(e.target.value)} required />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Record a short video (optional):</label>
                <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-64 border rounded" />
                {!recording ? (
                  <Button type="button" onClick={startRecording}>🎥 Start Recording</Button>
                ) : (
                  <Button type="button" onClick={stopRecording}>⏹️ Stop Recording</Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload a document (PDF/DOC):</label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDocumentFile(e.target.files[0])} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="consent" checked={consent} onCheckedChange={() => setConsent(!consent)} />
                  <label htmlFor="consent" className="text-sm text-gray-700">I give permission to share this review (including video)</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="privateSubmit" checked={privateSubmit} onCheckedChange={() => setPrivateSubmit(!privateSubmit)} />
                  <label htmlFor="privateSubmit" className="text-sm text-gray-700">Only send to Gary (keep private)</label>
                </div>
              </div>

              <div className="text-xs text-gray-500">{location}</div>

              <Button className="w-full" type="submit" disabled={!review || !name || !consent}>
                Submit Review
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}