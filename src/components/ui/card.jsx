export function Card({ children, className = "", ...props }) {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}