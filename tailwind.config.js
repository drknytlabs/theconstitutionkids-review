@tailwind base;
@tailwind components;
@tailwind utilities;

/* Use Tailwind utility classes like `bg-white`, `text-black`, `font-sans` on <body> instead */

/* Button reset styles */
.btn-reset {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  transition: background-color 0.2s ease-in-out;
}