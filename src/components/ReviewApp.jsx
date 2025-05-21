import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function ReviewApp() {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [contact, setContact] = useState("");
  const [social, setSocial] = useState("");
  const [location, setLocation] = useState("");
  const [consent, setConsent] = useState(false);
  const [privateSubmit, setPrivateSubmit] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
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
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setPendingApproval(true);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const discardVideo = () => {
    setVideoBlob(null);
    setVideoUrl("");
    setPendingApproval(false);
  };

  const uploadVideo = async () => {
    if (!videoBlob || !name) return alert("Missing name or video");
    const formData = new FormData();
    formData.append("file", videoBlob);
    formData.append("name", name);
    // TODO: connect to real API
    setPendingApproval(false);
    alert("✅ Video upload simulated");
  };

  const handleSubmit = async () => {
    if (!name || !review || !consent) return alert("Please fill required fields");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("review", review);
    formData.append("contact", contact);
    formData.append("social", social);
    formData.append("location", location);
    formData.append("consent", String(consent));
    formData.append("privateSubmit", String(privateSubmit));
    if (documentFile) formData.append("document", documentFile);
    if (videoUrl) formData.append("videoUrl", videoUrl);
    // TODO: connect to real API
    setSubmitted(true);
    alert("✅ Review submitted (simulated)");
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
        <form
          className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-2xl rounded-xl p-8 space-y-6 border border-gray-200"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        ></form>
      </div>
      <div className="min-h-screen bg-gray-50 flex justify-center items-start px-4 py-10">
        <Card className="w-full max-w-2xl">
          <CardContent>
              <h1 className="text-2xl font-bold text-center mb-6">Leave a Review</h1>

              {submitted ? (
                <p className="text-green-600 text-center">Thank you for your review!</p>
              ) : (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact (optional)" />
                  <Input value={social} onChange={(e) => setSocial(e.target.value)} placeholder="Social / Website (optional)" />
                  <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write your review..." rows={5} required />

                  <div>
                    <label className="block text-sm font-medium mb-1">Video Recording (optional)</label>
                    <video
                      ref={videoRef}
                      src={videoUrl || undefined}
                      autoPlay
                      muted
                      playsInline
                      controls={!!videoUrl}
                      className="w-full rounded border"
                    />
                    <div className="flex gap-4 mt-2">
                      {!recording && !videoBlob && <Button type="button" onClick={startRecording}>🎥 Start Recording</Button>}
                      {recording && <Button type="button" onClick={stopRecording}>⏹️ Stop</Button>}
                      {pendingApproval && (
                        <>
                          <Button type="button" onClick={uploadVideo}>✅ Approve</Button>
                          <Button type="button" onClick={discardVideo}>❌ Discard</Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Document or Photo</label>
                    <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setDocumentFile(e.target.files[0])} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="inline-flex items-center gap-2">
                      <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span className="text-sm">I give permission to share this publicly</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <Checkbox checked={privateSubmit} onChange={(e) => setPrivateSubmit(e.target.checked)} />
                      <span className="text-sm">Only send to Gary</span>
                    </label>
                  </div>

                  <div className="text-xs text-gray-500 italic text-center">{location}</div>

                  <Button type="submit" className="w-full text-lg py-3">
                    Submit Review
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
    </>
  );
}