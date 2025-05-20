export const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-background text-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);