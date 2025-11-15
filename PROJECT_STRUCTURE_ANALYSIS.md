# Project Structure Analysis
## The Grid Experience - F1 Cinematic Website

This is a Next.js 16.0.0 TypeScript application that creates an immersive Formula 1 (F1) themed website with 3D animations, interactive components, and cinematic experiences.

---

## 📁 Folder Structure & Context

### **`/app`** - Next.js App Router Directory
**Purpose**: Contains the application's core routing structure and global configuration using Next.js App Router pattern.

**Contents**:
- `layout.tsx` - Root layout component that wraps all pages
  - Configures custom fonts (Orbitron for headings, Exo 2 for body)
  - Sets up dark theme by default
  - Integrates Vercel Analytics
  - Defines global metadata (title, description, icons)
  
- `page.tsx` - Main landing page component
  - Orchestrates the entire single-page experience
  - Implements F1 loader animation on initial load
  - Contains "boost" easter egg (keyboard shortcut)
  - Composes all major sections: Hero, About, Experience, Evolution, Teams, Tracks, Telemetry, Gallery, Leaderboard, Footer

- `globals.css` - Global stylesheet
  - Defines F1-themed color palette (matte black, neon red)
  - Configures CSS variables for dark/light theme support
  - Tailwind CSS imports and custom animations

**Key Technologies**: Next.js App Router, React Server Components, CSS Modules

---

### **`/components`** - React Components Library
**Purpose**: Contains all reusable React components, both custom F1-themed components and UI primitives from shadcn/ui.

**Structure**:
- **Custom F1 Components** (in root of `/components`):
  - `f1-loader.tsx` - Animated loading screen with F1 logo
  - `landing-hero.tsx` - Hero section with 3D car and animated text
  - `3d-car-hero.tsx` - Canvas-based 2D car animation (simulated 3D effect)
  - `animated-f1-text.tsx` - Text animations with F1 branding
  - `navbar.tsx` - Navigation bar with smooth animations
  - `about-machine.tsx` - "About the Machine" section
  - `experience.tsx` - Experience showcase section
  - `car-evolution.tsx` - F1 car evolution timeline/display
  - `driver-teams.tsx` - Driver and team information
  - `tracks-explorer.tsx` - Interactive track exploration
  - `telemetry-dashboard.tsx` - Live telemetry metrics dashboard with gauges
  - `gallery.tsx` - Image/media gallery
  - `leaderboard.tsx` - Race leaderboard display
  - `footer.tsx` - Site footer
  - `engine-sound-controller.tsx` - Web Audio API hook for engine sounds
  - `helmet-3d.tsx` - 3D helmet visualization
  - `interactive-map.tsx` - Interactive map component
  - `radial-gauge.tsx` - Radial gauge component for telemetry
  - `theme-provider.tsx` - Theme management provider

- **UI Components** (`/components/ui`):
  - Complete shadcn/ui component library (60+ components)
  - Includes: buttons, forms, dialogs, cards, charts, tables, etc.
  - Built on Radix UI primitives
  - Fully typed with TypeScript

**Key Technologies**: React, Framer Motion (animations), Three.js (3D), Web Audio API, Canvas API, shadcn/ui, Radix UI

---

### **`/hooks`** - Custom React Hooks
**Purpose**: Reusable React hooks for common functionality.

**Contents**:
- `use-mobile.ts` - Detects mobile screen size (< 768px breakpoint)
- `use-toast.ts` - Toast notification system with reducer pattern
  - Manages toast state globally
  - Supports add, update, dismiss, and remove actions
  - Inspired by react-hot-toast

**Key Technologies**: React Hooks, TypeScript

---

### **`/lib`** - Utility Functions & Libraries
**Purpose**: Shared utility functions and helper code.

**Contents**:
- `utils.ts` - Utility functions
  - `cn()` - Tailwind CSS class name merger (clsx + tailwind-merge)
  - Used throughout the app for conditional class names

**Key Technologies**: clsx, tailwind-merge

---

### **`/public`** - Static Assets
**Purpose**: Serves static files that are publicly accessible (images, icons, fonts, etc.).

**Contents**:
- `f1-logo.png` / `f1-logo-white.png` - F1 branding logos
- `f1-loader-bg.png` / `loader-bg.png` - Background images for loader
- `icon.svg` - Site favicon
- `icon-light-32x32.png` / `icon-dark-32x32.png` - Theme-specific icons
- `apple-icon.png` - Apple touch icon
- `placeholder-*.{jpg,svg}` - Placeholder images for various use cases

**Key Technologies**: Next.js Static File Serving

---

### **`/styles`** - Additional Stylesheets (if any)
**Purpose**: Additional CSS/SCSS files (currently contains `globals.css` which appears to be duplicated or legacy).

**Note**: The main styles are in `/app/globals.css`. This folder may contain legacy styles or be unused.

---

## 🛠️ Configuration Files

### **Root Level Configuration**:

1. **`package.json`**
   - **Project Name**: "my-v0-project"
   - **Framework**: Next.js 16.0.0
   - **React Version**: 19.0.2
   - **Key Dependencies**:
     - UI: Radix UI components, shadcn/ui, Framer Motion
     - 3D: Three.js
     - Forms: React Hook Form, Zod
     - Charts: Recharts
     - Audio: Web Audio API (native)
     - Styling: Tailwind CSS 4.1.9, CSS Variables
   - **Package Manager**: pnpm (indicated by `pnpm-lock.yaml`)

2. **`next.config.mjs`**
   - TypeScript build errors ignored (development mode)
   - Images unoptimized (for static export compatibility)

3. **`tsconfig.json`**
   - TypeScript 5.x
   - Strict mode enabled
   - Path aliases: `@/*` maps to root
   - ES6 target, ESNext modules

4. **`components.json`**
   - shadcn/ui configuration
   - "new-york" style variant
   - Path aliases for components, utils, hooks
   - Uses Lucide icons

5. **`postcss.config.mjs`**
   - PostCSS configuration for Tailwind CSS

---

## 🎨 Design & Theme

**Theme**: F1 Racing / Cinematic Experience
- **Colors**: Matte black (#0a0a0a) background, Neon red (#ff0000) accents
- **Typography**: 
  - Orbitron (display/headings) - futuristic, tech-focused
  - Exo 2 (body) - modern, readable
- **Style**: Dark theme by default, cinematic animations, immersive experience

---

## 🚀 Key Features

1. **3D/2D Visualizations**: Car animations, helmet displays, interactive elements
2. **Audio Integration**: Engine sound controller using Web Audio API
3. **Animations**: Extensive use of Framer Motion for smooth transitions
4. **Telemetry Dashboard**: Live-updating metrics (RPM, speed, tire temp, G-force)
5. **Interactive Components**: Tracks explorer, interactive map, leaderboard
6. **Responsive Design**: Mobile-first with breakpoint detection
7. **Performance**: Optimized with Next.js Image, lazy loading, code splitting

---

## 📦 Tech Stack Summary

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.1.9, CSS Variables
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **UI Components**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Audio**: Web Audio API (native browser)
- **Package Manager**: pnpm

---

## 🔄 Data Flow

1. **Entry Point**: `app/page.tsx` → renders all sections
2. **Components**: Each section is a separate component in `/components`
3. **State Management**: Local React state + Context (for theme)
4. **Styling**: Global CSS + Tailwind utility classes + CSS variables
5. **Animations**: Framer Motion for scroll-triggered and user-triggered animations

---

## 🎯 Project Purpose

This is a **cinematic showcase website** for Formula 1 racing, designed to provide an immersive, interactive experience that demonstrates:
- Modern web development techniques
- 3D/2D graphics capabilities
- Real-time data visualization (simulated telemetry)
- Audio integration
- Smooth animations and transitions
- Responsive design principles

The site appears to be a portfolio/showcase project that combines multiple advanced web technologies into a cohesive, visually impressive F1-themed experience.



