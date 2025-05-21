export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${className}`}
      {...props}
    />
  );
}