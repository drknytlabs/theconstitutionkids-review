import { useState, useRef, useEffect } from "react";
import { FaYoutube, FaFacebook, FaInstagram } from "react-icons/fa";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export default function ReviewApp() {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
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
  const [audioOnly, setAudioOnly] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [looksGood, setLooksGood] = useState(false);

  // --- Video pre-flight preview state ---
  const [previewReady, setPreviewReady] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  // --- Recording timer state and ref ---
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  // --- Audio waveform refs ---
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

const resetRecordingState = () => {
  setVideoBlob(null);
  setVideoUrl("");
  setRecordingTime(0);
  clearInterval(timerRef.current);
  timerRef.current = null;

  if (videoRef.current) {
    // Stop playback and disconnect stream
    videoRef.current.pause();
    videoRef.current.src = "";
    videoRef.current.srcObject = null;

    // Prevent multiple stacked listeners
    videoRef.current.onvolumechange = null;

    // Explicit mute setup
    videoRef.current.volume = 0;
  }

  // Clear waveform if active
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }
    // --- Preview cleanup ---
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setPreviewReady(false);
  };

  // Reset preview and recording state when switching between audio/video
  useEffect(() => {
    resetRecordingState();
  }, [audioOnly]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(JSON.stringify({ lat: latitude, lon: longitude }));
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
    const constraints = audioOnly ? { audio: true } : { audio: true, video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    // If preview was running, stop it first.
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setPreviewReady(false);
    // --- Begin waveform setup ---
    if (audioOnly && canvasRef.current) {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteTimeDomainData(dataArray);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          // Visual clipping warning: highlight red if amplitude exceeds threshold
          const y = (v * canvas.height) / 2;
          if (v > 1.4) {
            ctx.strokeStyle = '#f00'; // red for clipping
          } else {
            const hue = (Date.now() / 10) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
          }
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };
      draw();
    }
    // --- End waveform setup ---
    // --- Begin recording timer setup ---
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    // --- End recording timer setup ---
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      const blob = new Blob(chunksRef.current, {
        type: audioOnly ? "audio/webm" : "video/webm"
      });
      const url = URL.createObjectURL(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
      }
      setVideoBlob(blob);
      setVideoUrl(url);
      stream.getTracks().forEach((t) => t.stop());
      // --- Clean up waveform on stop ---
      if (audioContextRef.current) {
        audioContextRef.current.close();
        cancelAnimationFrame(animationFrameRef.current);
      }
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

  // --- Video pre-flight preview for video mode ---
  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      if (!stream || !stream.getVideoTracks().length) {
        throw new Error("🎥 Camera access granted, but no video track found.");
      }

      setMediaStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Give DOM time to bind stream
        setTimeout(() => {
          const track = stream.getVideoTracks()[0];
          if (!track || track.readyState !== "live") {
            alert("❌ Camera stream failed to initialize properly.");
            console.warn("🛑 Video track state:", track?.readyState);
            resetRecordingState();
            return;
          }

          // Optional: deeper visual check
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

          const hasImage = pixels.some(channel => channel !== 0);
          if (!hasImage) {
            alert("❌ Video preview isn't displaying real frames. Something’s broken.");
            resetRecordingState();
          }
        }, 500);
      }

      setPreviewReady(true);
      setLooksGood(false); // Reset confirmation on new preview
    } catch (error) {
      console.error("🚨 Camera access error:", error);
      if (window.location.protocol !== "https:") {
        alert("❌ Camera access blocked. This site must be served over HTTPS to use the camera.");
      } else if (error.name === "NotAllowedError") {
        alert("❌ Camera permission denied. Please check your browser's permissions for this site.");
      } else if (error.name === "NotFoundError") {
        alert("❌ No camera device found. Make sure a webcam is connected and enabled.");
      } else {
        alert(`❌ Camera error: ${error.message}`);
      }
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
    if (!name || !headline || !review || (!consent && !privateSubmit)) {
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
    formData.append("headline", headline);
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

    // --- Analytics fields ---
    const userAgent = navigator.userAgent;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTime = new Date().toLocaleString();
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const referrer = document.referrer;

    formData.append("userAgent", userAgent);
    formData.append("timezone", timezone);
    formData.append("localTime", localTime);
    formData.append("screenSize", screenSize);
    formData.append("referrer", referrer);
    // --- End analytics fields ---

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

    // ✅ Submit review to backend
    const response = await fetch('/api/review', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      return alert("❌ Failed to submit review");
    }
    setSubmitted(true);
  };

  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // When documentFile changes, create and clean up the preview URL
  useEffect(() => {
    if (documentFile && documentFile.type?.startsWith('image/')) {
      const url = URL.createObjectURL(documentFile);
      setImagePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImagePreviewUrl(null);
    }
  }, [documentFile]);

  // Clean up videoUrl blob
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center items-start px-4 py-10">
        <Card className="w-full max-w-2xl"> 
          <CardContent>
            <div className="p-4 md:p-6">
              {!submitted && (
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Leave a Review</h1>
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
                    {/* <p><strong>Location:</strong> {location}</p> */}
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
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Headline for your review (e.g. A game-changer!)"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    autoComplete="tel"
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    autoComplete="email"
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
                  <label className="block text-sm font-medium mb-1">In-Depth Review</label>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your detailed thoughts here..."
                    rows={5}
                    required
                    className="rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audioOnly}
                        onChange={() => setAudioOnly(!audioOnly)}
                      />
                      <span className="text-sm">🎧 Record audio only</span>
                    </label>
                    <label className="block text-sm font-medium mb-1">Video Recording (optional)</label>
                    <div className="relative w-full border rounded-md overflow-hidden bg-black">
                      {/* --- Pre-flight preview UI for video mode --- */}
                      {!audioOnly && !recording && !videoBlob && !previewReady && (
                        <div className="text-center space-y-4 p-4 border rounded-md bg-gray-100 mt-4">
                          <p className="font-semibold text-lg">🎬 Ready to Record?</p>
                          <p className="text-sm text-gray-700">Let’s do a quick pre-flight check.</p>
                          <ul className="text-left list-disc list-inside text-sm text-gray-600">
                            <li>✅ Video check: Camera access</li>
                            <li>✅ Audio check: Microphone ready</li>
                            <li>💡 Tip: Just be yourself — you’re perfect for this.</li>
                          </ul>
                          <Button
                            type="button"
                            onClick={startPreview}
                            aria-label="Start Camera"
                            disabled={recording}
                          >
                            Start Camera
                          </Button>
                        </div>
                      )}
                      {!audioOnly && !recording && !videoBlob && previewReady && (
                        <div className="flex flex-col items-center gap-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-64 object-contain"
                            aria-label="Camera preview"
                          />
                          {!looksGood ? (
                            <Button
                              type="button"
                              onClick={() => setLooksGood(true)}
                              aria-label="Looks good, enable recording"
                              disabled={recording}
                            >
                              👍 Looks good!
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={startRecording}
                              aria-label="Start Recording"
                              disabled={recording}
                            >
                              🎥 Start Recording
                            </Button>
                          )}
                        </div>
                      )}
                      {audioOnly && !recording && !videoBlob && (
                        <Button
                          type="button"
                          onClick={startRecording}
                          aria-label="Start Audio Recording"
                          disabled={recording}
                        >
                          🎤 Start Recording
                        </Button>
                      )}
                      {audioOnly && videoUrl && (
                        <audio
                          src={videoUrl}
                          controls
                          className="w-full mt-2"
                          aria-label="Audio preview"
                        />
                      )}
                      {!audioOnly && videoUrl && (
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          autoPlay
                          muted
                          playsInline
                          controls
                          className="w-full h-64 object-contain"
                          aria-label="Video preview"
                        />
                      )}
                      {/* Live waveform meter */}
                      {recording && (
                        <div>
                          <canvas
                            ref={canvasRef}
                            width={600}
                            height={80}
                            className="mt-2 w-full bg-black rounded shadow"
                            aria-label="Live audio waveform"
                          />
                        </div>
                      )}
                    </div>
                    {/* Recording timer display */}
                    {recording && (
                      <p className="text-center text-sm text-gray-600 mt-2">
                        ⏱️ Recording: {recordingTime}s
                      </p>
                    )}
                    <div className="flex gap-4 mt-2">
                      {/* Only show Start Recording after Looks Good is confirmed */}
                      {/* (Handled above in the previewReady block) */}
                      {recording && (
                        <Button
                          type="button"
                          onClick={stopRecording}
                          aria-label="Stop Recording"
                        >
                          ⏹️ Stop
                        </Button>
                      )}
                      {videoBlob && !recording && (
                        <Button
                          type="button"
                          onClick={startRecording}
                          aria-label="Re-record"
                        >
                          🔁 Re-record
                        </Button>
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
                    {documentFile && documentFile.type.startsWith('image/') && imagePreviewUrl && (
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="mt-2 max-h-48 rounded"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-sm">How should we share this?</label>
                    <p className="text-xs text-gray-500 italic mb-1">
                      Choose how you'd like your review shared. By posting publicly, you grant DRK NYT Labs permission to display your submission on the review wall.
                    </p>
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
                        required={!consent && !privateSubmit}
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
                        required={!consent && !privateSubmit}
                      />
                      <span className="text-sm">🔒 Only share with Gary privately</span>
                    </label>
                  </div>

                  {/* <div className="text-xs text-gray-500 italic text-center">{location}</div> */}

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