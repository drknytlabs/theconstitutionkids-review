import { useEffect, useState } from 'react';

export default function ReviewWall() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => setReviews(data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Reader Reviews</h1>
      {reviews.map((r, i) => (
        <div key={i} className="mb-8 p-6 bg-white shadow rounded">
          <h2 className="text-xl font-semibold mb-1">{r.name}</h2>
          <p className="mb-3 text-gray-700">{r.review}</p>
          {r.videoUrl && (
            <video src={r.videoUrl} controls className="w-full rounded" />
          )}
        </div>
      ))}
    </div>
  );
}