import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FaYoutube, FaFacebook, FaInstagram } from "react-icons/fa";

export default function ReviewWall() {
  const [reviews, setReviews] = useState([]);
  const [locationInfo, setLocationInfo] = useState({});

  const [likedReviews, setLikedReviews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("likedReviews") || "[]");
    } catch {
      return [];
    }
  });

  const iconMap = {
    youtube: <FaYoutube className="inline mr-1" />,
    facebook: <FaFacebook className="inline mr-1" />,
    instagram: <FaInstagram className="inline mr-1" />,
  };

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded reviews:", data);
        const publicReviews = data.filter((r) => r.consent);
        publicReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setReviews(publicReviews);
        publicReviews.forEach((review, i) => {
          try {
            const loc = JSON.parse(review.location || "{}");
            if (loc.lat && loc.lon) {
              fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lon}&format=json`)
                .then(res => res.json())
                .then(data => {
                  const city = data.address.city || data.address.town || data.address.village || "";
                  const state = data.address.state || "";
                  setLocationInfo(prev => ({ ...prev, [i]: `${city}, ${state}`.trim() }));
                });
            }
          } catch (error) {
            console.error("Error parsing location data:", error);
          } 
        });
      })
      .catch((err) => console.error("Error loading reviews:", err));
  }, []);

  const handleLike = async (reviewId) => {
    if (likedReviews.includes(reviewId)) return;

    const response = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });

    if (response.ok) {
      const updated = [...likedReviews, reviewId];
      setLikedReviews(updated);
      localStorage.setItem("likedReviews", JSON.stringify(updated));

      const data = await response.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, likes: data.likes } : r
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <h2 className="text-3xl font-bold text-center mb-8">Public Reviews</h2>
      <div className="grid gap-6 max-w-4xl mx-auto">
        {reviews.length === 0 && <p className="text-center text-gray-500">No reviews yet.</p>}
        {reviews.map((review, index) => (
          <Card key={index}>
            <CardContent>
              <h3 className="font-semibold text-lg">{review.name}</h3>
              {review.jobTitle && (
                <p className="text-sm text-gray-700">{review.jobTitle}</p>
              )}
              {review.organization && (
                <p className="text-sm text-gray-500 italic">{review.organization}</p>
              )}
              {locationInfo[index] && (
                <p className="text-xs text-gray-500">{locationInfo[index]}</p>
              )}
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{review.review}</p>
              {review.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  📞 <a href={`tel:${review.phone}`} className="hover:underline">{review.phone}</a>
                </p>
              )}
              {review.email && (
                <p className="text-sm text-gray-600 mt-1">
                  ✉️ <a href={`mailto:${review.email}`} className="hover:underline">{review.email}</a>
                </p>
              )}
              {review.social && typeof review.social === 'object' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(review.social).map(([platform, link]) => (
                    <a
                      key={platform}
                      href={link.startsWith("http") ? link : `https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      <span className="flex items-center gap-1">
                        {iconMap[platform] || "🔗"}
                        <span className="underline">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
              {review.videoUrl && (
                <div className="mt-4 relative group w-72 h-40">
                  <video
                    className="w-72 h-40 object-cover rounded border"
                    src={review.videoUrl}
                    muted
                    loop
                    playsInline
                    autoPlay
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => window.open(review.videoUrl, '_blank')}
                      className="bg-white text-black rounded-md text-xs px-3 py-1"
                    >
                      ▶ View Full Video
                    </button>
                  </div>
                </div>
              )}
              {review.documentUrl && (
                <>
                  {review.documentUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <img
                      src={review.documentUrl.replace(/^\/Users\/async\/theconstitutionkids-review/, '')}
                      alt="Uploaded Preview"
                      className="mt-2 max-h-48 rounded"
                    />
                  ) : (
                    <a
                      href={review.documentUrl.replace(/^\/Users\/async\/theconstitutionkids-review/, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-sm text-blue-600 underline"
                    >
                      📎 View Attached Document
                    </a>
                  )}
                </>
              )}
              <div className="flex gap-4 mt-4 items-center">
                <button
                  className={`flex items-center gap-1 text-sm ${
                    likedReviews.includes(review.id)
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  } transition`}
                  onClick={() => handleLike(review.id)}
                  disabled={likedReviews.includes(review.id)}
                >
                  ❤️ {review.likes || 0} Like
                </button>

                <button
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500 transition"
                  onClick={() => {
                    const shareText = `Check out this review from ${review.name}: "${review.review.slice(0, 100)}..."`;
                    const shareUrl = window.location.href;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Review from The Constitution Kids',
                        text: shareText,
                        url: shareUrl,
                      });
                    } else {
                      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                      alert("Link copied to clipboard!");
                    }
                  }}
                >
                  🔗 Share
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}