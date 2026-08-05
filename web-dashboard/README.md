# 🌐 @777-project/web-dashboard

This is the Next.js frontend application for the 777 Project.

## 🎨 Architecture & Aesthetics
This module adheres strictly to the **Awesome Antigravity UI/UX** framework. 
All presentation logic is physically segregated from React logic:
- Code structure (`.tsx`) is separated from the styling logic.
- **CSS Modules** reside in `/src/777_addons/styles/` for clean organization.
- **Images and Textures** reside in `/public/777_addons/`.

## 🚀 Core Features
- **Holographic 3D Builder**: An interactive 3D scene built using `@react-three/fiber` and `@react-three/drei`, allowing users to place objects, build structures, and visualize gameplay elements.
- **NextAuth Integration**: Seamless authentication supporting Steam and Discord login flows.
- **Framer Motion**: State-of-the-art physics-based micro-animations and page transitions.

## 🛠️ Scripts & Usage
Inside this directory (`/frontend`), you can run:

- `npm run dev` — Starts the Next.js development server.
- `npm run build` — Compiles the optimized production build and generates Prisma typings.
- `npm run start` — Starts the Next.js production server.
- `npm run lint` — Validates code against ESLint rules.

## 📂 Structure Highlight
- `/src/app/` - The Next.js App Router housing all page definitions, API routes, and top-level layouts.
- `/src/components/` - Reusable UI elements, 3D interactive canvases (e.g. `Builder3D.tsx`), and layout pieces.
- `/src/777_addons/styles/` - The central location for all modular CSS and global styles.
