import { useTruthContext } from '../context/truthContext';

export default function Truth({ children, fallback }) {
  const revealed = useTruthContext();

  if (!revealed) {
    console.warn("🕳️ TRUTH UNRENDERED");
    return fallback || <div className="text-gray-500 italic">You are not ready for the real UI.</div>;
  }

  return <>{children}</>;
}

// You can use <Truth fallback={<LoadingSpinner />} /> inside another component as needed.
// console.debug("🔍 TRUTH CONTEXT:", revealed);

