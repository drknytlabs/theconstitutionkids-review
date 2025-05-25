import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ReviewApp from "@/components/ReviewApp";
import ReviewWall from "@/components/ReviewWall";

function App() {
  return (
    <Router>
      <div>
        <nav className="flex justify-center gap-4 py-4 bg-gray-100">
          <a href="/" className="text-blue-600 hover:underline">Leave a Review</a>
          <a href="/reviews" className="text-blue-600 hover:underline">View Reviews</a>
        </nav>
        <Routes>
          <Route path="/" element={<ReviewApp />} />
          <Route path="/reviews" element={<ReviewWall />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;