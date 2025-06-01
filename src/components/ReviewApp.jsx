import { useState, useRef, useEffect } from "react";
import { FaYoutube, FaFacebook, FaInstagram } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewApp() {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [socialLinks, setSocialLinks] = useState({});
  const [location, setLocation] = useState("");
  const [consent, setConsent] = useState(false);
  const [privateSubmit, setPrivateSubmit] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ✅ Safely defined after useState
  const handlePasteFromContactCard = () => {
    const raw = prompt("Paste your contact info or vCard text below:");
    if (!raw) return;

    const nameMatch = raw.match(/FN:(.+)/i);
    const phoneMatch = raw.match(/TEL[^:]*:(.+)/i);
    const emailMatch = raw.match(/EMAIL[^:]*:(.+)/i);

    if (nameMatch?.[1]) setName(nameMatch[1].trim());
    if (phoneMatch?.[1]) setPhone(phoneMatch[1].trim());
    if (emailMatch?.[1]) setEmail(emailMatch[1].trim());
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

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

  const toggleSocial = (platform) => {
    setSocialLinks((prev) =>
      prev[platform] !== undefined
        ? Object.fromEntries(Object.entries(prev).filter(([key]) => key !== platform))
        : { ...prev, [platform]: "" }
    );
  };

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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
      }
      setVideoBlob(blob);
      setVideoUrl(url);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        setRecording(false);
      }
    }, 300000); // 5 minutes
    setRecording(true);
  };


  const uploadVideo = async () => {
    if (!videoBlob || !name) return null;

    const formData = new FormData();
    const safeFilename = `${name.replace(/\s+/g, "-")}-${Date.now()}.webm`;
    formData.append("file", videoBlob, safeFilename);
    formData.append("name", name);

    try {
      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const data = await response.json();
      return data.url; // ✅ return video URL
    } catch (error) {
      console.error("Video upload error:", error);
      return null;
    }
  };

  const formatUrl = (platform, handle) => {
    const base = {
      youtube: "https://youtube.com/",
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
    };
    if (!handle) return null;
    const cleaned = handle.startsWith("@") || handle.startsWith("/") ? handle.slice(1) : handle;
    return `${base[platform] || "https://"}${cleaned}`;
  };

  const handleSubmit = async () => {
    if (!name || !review || (!consent && !privateSubmit)) {
      alert("Please fill all required fields and select how to share your review.");
      return;
    }
    const phoneRegex = /^[0-9\-+()\s]{7,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (phone && !phoneRegex.test(phone)) {
      alert("Please enter a valid phone number.");
      return;
    }

    if (email && !emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("review", review);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("jobTitle", jobTitle);
    formData.append("organization", organization);
    Object.entries(socialLinks).forEach(([platform, value]) => {
      const url = formatUrl(platform, value);
      if (url) formData.append(`social_${platform}`, url);
    });
    formData.append("location", location);
    formData.append("consent", consent);
    formData.append("privateSubmit", privateSubmit);
    if (documentFile) formData.append("document", documentFile);

    let finalVideoUrl = videoUrl;

    if (videoBlob) {
      const uploadedUrl = await uploadVideo();
      if (uploadedUrl) {
        finalVideoUrl = uploadedUrl;
        setVideoUrl(uploadedUrl);
      }
    }

    if (finalVideoUrl) {
      formData.append("videoUrl", finalVideoUrl);
    }

    const response = await fetch('/api/review', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      return alert("❌ Failed to submit review");
    }
    setSubmitted(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center items-start px-4 py-10">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <div className="p-4 md:p-6">
              {!submitted && (
                <><h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Leave a Review</h1><div className="bg-fuchsia-700 text-white text-3xl p-8 rounded-xl shadow-lg">
                  Tailwind is watching.
                </div></>
              )}

              {submitted ? (
                <div className="text-green-600 text-center space-y-4">
                  <p className="font-semibold text-xl">✅ Thank you for your review!</p>
                  <div className="text-left bg-white rounded p-4 shadow max-w-xl mx-auto text-black">
                    <p><strong>Name:</strong> {name}</p>
                    {jobTitle && <p><strong>Job Title:</strong> {jobTitle}</p>}
                    {organization && <p><strong>Publication/Organization:</strong> {organization}</p>}
                    <p><strong>Review:</strong> {review}</p>
                    {phone && <p><strong>Phone:</strong> {phone}</p>}
                    {email && <p><strong>Email:</strong> {email}</p>}
                    {Object.entries(socialLinks).map(([platform, value]) => (
                      <p key={platform}><strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> {value}</p>
                    ))}
                    <p><strong>Location:</strong> {location}</p>
                    {videoUrl && (
                      <video src={videoUrl} controls className="w-full rounded mt-2" />
                    )}
                    {documentFile?.type?.startsWith('image/') && (
                      <img src={URL.createObjectURL(documentFile)} alt="Uploaded Preview" className="mt-2 max-h-48 rounded" />
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <a href="/reviews">
                      <Button className="mt-4 text-sm px-4 py-2">
                        🔗 View your review on the Review Wall
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}>
                  <Button
                    type="button"
                    onClick={handlePasteFromContactCard}
                    className="text-sm mb-4"
                  >
                    📇 Paste from Contact Card
                  </Button>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job Title (optional)"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Publication or Organization (optional)"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1">Add Social Links</label>
                    <div className="space-y-2">
                      {['youtube', 'facebook', 'instagram'].map((platform) => (
                        socialLinks[platform] !== undefined ? (
                          <div key={platform} className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => toggleSocial(platform)}>
                              {platform === 'youtube' ? <FaYoutube /> : platform === 'facebook' ? <FaFacebook /> : <FaInstagram />}
                            </Button>
                            <Input
                              value={socialLinks[platform]}
                              onChange={(e) =>
                                setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))
                              }
                              placeholder={`Your ${platform.charAt(0).toUpperCase() + platform.slice(1)} handle (e.g. @yourname)`}
                              className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSocialLinks((prev) =>
                                  Object.fromEntries(Object.entries(prev).filter(([key]) => key !== platform))
                                )
                              }
                              className="text-red-600 text-sm font-bold px-2"
                              aria-label={`Remove ${platform}`}
                            >
                              ✕
                            </button>
                          </div>
                        ) : null
                      ))}
                      <div className="flex gap-3 mt-2">
                        {['youtube', 'facebook', 'instagram'].filter(p => !(p in socialLinks)).map((platform) => (
                          <Button key={platform} type="button" variant="outline" onClick={() => toggleSocial(platform)}>
                            {platform === 'youtube' ? <FaYoutube /> : platform === 'facebook' ? <FaFacebook /> : <FaInstagram />}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review..."
                    rows={5}
                    required
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1">Video Recording (optional)</label>
                    <div className="relative w-full border rounded-md overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        src={videoUrl || undefined}
                        autoPlay
                        muted
                        playsInline
                        controls={!!videoUrl}
                        className="w-full h-64 object-contain"
                      />
                    </div>
                  <div className="flex gap-4 mt-2">
                    {!recording && !videoBlob && (
                      <Button type="button" onClick={startRecording}>🎥 Start Recording</Button>
                    )}
                    {recording && (
                      <Button type="button" onClick={stopRecording}>⏹️ Stop</Button>
                    )}
                    {videoBlob && !recording && (
                      <Button type="button" onClick={startRecording}>🔁 Re-record</Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">Note: Video recordings are limited to 5 minutes.</p>
                  </div>

                  {/* Video preview now integrated above */}

                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Logo, Headshot, or Related File</label>
                    <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      console.log("Selected document:", file);
                      setDocumentFile(file);
                    }} />
                    {documentFile && documentFile.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(documentFile)}
                        alt="Preview"
                        className="mt-2 max-h-48 rounded"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-sm">How should we share this?</label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={consent}
                        onChange={() => {
                          setConsent(true);
                          setPrivateSubmit(false);
                        }}
                      />
                      <span className="text-sm">✅ Post publicly on the website</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={privateSubmit}
                        onChange={() => {
                          setConsent(false);
                          setPrivateSubmit(true);
                        }}
                      />
                      <span className="text-sm">🔒 Only share with Gary privately</span>
                    </label>
                  </div>

                  <div className="text-xs text-gray-500 italic text-center">{location}</div>

                  <Button type="submit" className="w-full text-lg py-3">
                    Submit Review
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}