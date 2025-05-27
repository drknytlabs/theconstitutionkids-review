import { useEffect, useState } from "react";
import TopReviewHero from "./TopReviewHero";

export default function ReviewWall() {
  const [reviews, setReviews] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error("Error loading reviews:", err));
  }, []);

  const topReview = reviews.reduce((best, current) => {
    return current.aSyncGrade > (best?.aSyncGrade || 0) ? current : best;
  }, null);

  // Generate unique sorted list of all tags
  const allTags = Array.from(
    new Set(
      reviews.flatMap((r) => Array.isArray(r.tags) ? r.tags : [])
    )
  ).sort();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">📣 Public Reviews</h1>

      <TopReviewHero review={topReview} />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {allTags.map((tag, i) => (
            <button
              key={i}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                activeTag === tag
                  ? "bg-black text-white border-black"
                  : "bg-gray-200 text-gray-700 border-gray-300"
              }`}
            >
              #{tag}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="ml-4 text-xs underline text-red-500"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {reviews
        .filter((review) =>
          !activeTag || (Array.isArray(review.tags) && review.tags.includes(activeTag))
        )
        .map((review, i) => (
        <div key={i} className="bg-white p-4 mb-4 shadow rounded">
          {review.headline && (
            <h2 className="text-xl font-bold text-gray-800 mb-1">{review.headline}</h2>
          )}
          <h3 className="font-semibold text-lg">{review.name}</h3>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{review.review}</p>
          {review.summary && (
            <p className="italic text-sm text-gray-600 mt-2">💬 {review.summary}</p>
          )}
          {Array.isArray(review.tags) && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {review.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-700">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {review.aSyncGrade && (
            <p className="mt-2 text-xs font-mono text-gray-600">
              aSyncGrade: <span className="font-bold text-green-600">{review.aSyncGrade}</span>/1000
            </p>
          )}
        </div>
      ))}
    </div>
  );
}