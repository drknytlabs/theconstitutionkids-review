export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}