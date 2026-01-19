# CreativeVision - Premium Video Editing Agency

This is a React-based web application for CreativeVision, a premium video editing agency. The website showcases their services, portfolio, and provides ways for clients to hire them or join their team. It emphasizes cinematic quality, fast turnaround, and high client satisfaction.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Linting](#linting)
- [Deployment](#deployment)

## Features

Based on the components and meta descriptions, the application likely includes:

- **Hero Section**: Engaging introduction to the agency.
- **About Section**: Details about CreativeVision's mission and expertise.
- **Services**: Overview of video editing services offered (short-form, long-form, commercial).
- **Portfolio**: Showcase of past work and projects.
- **Counting Numbers**: Dynamic display of key metrics (e.g., client satisfaction, projects completed).
- **Contact/Hire Us Page**: Functionality for clients to reach out.
- **Join Team Page**: Information and application process for prospective team members.
- **Navigation**: Main and potentially secondary navigation components.
- **Footer**: Standard website footer with copyright and links.
- **SEO Optimization**: Comprehensive meta tags for better search engine visibility.

## Technologies Used

-   **Frontend**: React (with TypeScript)
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS, PostCSS, Autoprefixer
-   **State Management**: (Implicit, typically React Context or similar for smaller apps)
-   **Icons**: Lucide React
-   **Form Handling/Email**: EmailJS
-   **Database/Backend (Potential)**: Supabase (indicated by `@supabase/supabase-js` dependency)
-   **Code Quality**: ESLint, TypeScript ESLint

## Project Structure

The project follows a standard React application structure:

```
.
├── public/                     # Static assets (images, favicon)
├── src/                        # Main application source code
│   ├── components/             # Reusable UI components
│   │   ├── About.tsx
│   │   ├── CountingNumber.tsx
│   │   ├── EmailJSSetup.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── HireUsPage.tsx
│   │   ├── JoinTeamPage.tsx
│   │   ├── MainNavigation.tsx
│   │   ├── Navigation.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Services.tsx
│   │   ├── SpecializationPage.tsx
│   │   └── ThankYouPage.tsx
│   ├── hooks/                  # Custom React hooks
│   │   └── useScrollAnimation.ts
│   ├── services/               # Service-related modules (e.g., API calls)
│   │   └── emailService.ts
│   ├── App.tsx                 # Main application component
│   ├── index.css               # Global CSS styles (likely Tailwind imports)
│   ├── main.tsx                # Entry point of the React application
│   └── vite-env.d.ts           # Vite-specific TypeScript declarations
├── .env.example                # Example environment variables
├── .gitignore                  # Files/directories ignored by Git
├── eslint.config.js            # ESLint configuration
├── index.html                  # Main HTML file (Vite entry)
├── package.json                # Project dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.app.json           # TypeScript configuration for the application
├── tsconfig.json               # Base TypeScript configuration
├── tsconfig.node.json          # TypeScript configuration for Node environment
└── vite.config.ts              # Vite build configuration
```

## Setup

To set up the project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd CreativeVision
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory by copying `.env.example` and fill in your actual environment variables (e.g., for EmailJS, Supabase, etc.).

    ```
    # .env example
    VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
    VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
    VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

    # If Supabase is used
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: The actual environment variables needed depend on the implementation details within `EmailJSSetup.tsx` and any Supabase integration.*

## Running the Application

To run the application in development mode:

```bash
npm run dev
```

This will start the Vite development server, and you can access the application in your browser (usually at `http://localhost:5173`).

To create a production build:

```bash
npm run build
```

This command compiles and bundles the application for production, outputting the files to the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Linting

To run ESLint and check for code quality issues:

```bash
npm run lint
```

## Deployment

After running `npm run build`, the optimized static files will be located in the `dist/` directory. These files can be deployed to any static site hosting service (e.g., Netlify, Vercel, GitHub Pages, Firebase Hosting, Bolt.host).

---

Feel free to customize this README further with more specific details about your project's features, how to contribute, or any specific deployment instructions.
