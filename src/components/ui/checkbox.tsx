import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  className?: string;
}

export function Checkbox({ id, className = "", ...props }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${className}`}
        {...props}
      />
    </div>
  );
}