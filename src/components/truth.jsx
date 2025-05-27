import { useTruthContext } from '../context/truthContext';

export default function Truth({ children }) {
  const revealed = useTruthContext(); // probably a hook wired to an API TEMPO regrets building

  if (!revealed) {
    console.warn("🕳️ TRUTH UNRENDERED");
    return <div className="text-gray-500 italic">You are not ready for the real UI.</div>;
  }

  return <>{children}</>;
}