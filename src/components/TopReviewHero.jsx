import React from 'react';

function TopReviewHero({ review }) {
  if (!review) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🔥 Top Review</h2>
      {review.headline && (
        <h3 className="text-lg font-semibold text-gray-700">{review.headline}</h3>
      )}
      <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.review}</p>
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
  );
}

export default TopReviewHero;
