Core Technologies Used
1. Framework
Next.js ("next": "15.2.4"):
 Full-stack React framework used for SSR (server-side rendering), SSG (static site generation), routing, and API routes.
2. Frontend
React ("react": "18.2.0" and "react-dom": "18.2.0"):
 JavaScript library for building user interfaces.


Radix UI (@radix-ui/*):
 A set of low-level UI primitives for building accessible components (like dialogs, tooltips, tabs, etc.).


Tailwind CSS (tailwindcss, tailwindcss-animate, tailwind-merge):
 Utility-first CSS framework for rapid styling.


Framer Motion ("framer-motion"):
 Library for animations in React.


Lucide React (lucide-react):
 Icon library.


CMDK, Vaul, Sonner:
 Modern UI components for command menus, modals, and toasts respectively.


Recharts, Chart.js, react-chartjs-2:
 Charting libraries for visualizing data.


Date Handling: date-fns, react-day-picker for date operations and date pickers.
3. Forms & Validation
React Hook Form (react-hook-form):
 Lightweight form management library.


Zod (zod):
 Schema validation library, often used with React Hook Form.


Hookform Resolvers (@hookform/resolvers):
 Bridges React Hook Form with Zod or Yup.
4. Backend / Server-side
Custom server ("dev": "node server.js" and "start": "NODE_ENV=production node server.js"):
 You are not using the default Next.js dev server (next dev) but a custom Express or Node server.


WebSocket Support (ws):
 WebSocket implementation for real-time communication.


@google-cloud/storage:
 Used for uploading/storing files on Google Cloud Storage.
5. Utilities
clsx, class-variance-authority:
 Used for conditional className generation.


autoprefixer, postcss:
 CSS preprocessing tools, used with Tailwind.


6. Dev Tools
TypeScript (typescript):
 Strongly typed superset of JavaScript.


@types/:
 TypeScript type definitions for React, Node.js, etc.


Linting:
 The script "lint": "next lint" indicates ESLint is used.







Overall Stack Summary


Layer                   Tech Used
Frontend                React 18, Radix UI, Tailwind CSS, Framer Motion (Library for animations in React.)
Backend                 Node.js (custom server), WebSocket (ws), Next.js API routes
Charts & UI             Chart.js, Recharts, CMDK, Vaul, Sonner
Forms & Validation      React Hook Form, Zod, Resolvers
Cloud Services          Google Cloud Storage
Real-time               WebSocket support (ws)
Styling                 Tailwind CSS, Tailwind Merge, Tailwind Animate
Type Safety             TypeScript, Zod
Build Tooling           PostCSS, Autoprefixer
Routing & SSR           Next.js

