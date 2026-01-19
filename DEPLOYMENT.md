# Deploying to Railway

This document provides instructions for deploying the Creative Vision application to Railway.

## Prerequisites

- A Railway account.
- The project code pushed to a GitHub repository.

## Deployment Steps

1. **Create a new project in Railway.**
   - Log in to your Railway account.
   - Click the "New Project" button.
   - Select "Deploy from GitHub repo".
   - Choose the repository for this project.

2. **Configure the build settings.**
   - Railway will likely auto-detect that this is a Vite project.
   - **Build Command:** `npm run build` or `vite build`
   - **Publish Directory:** `dist`

3. **Configure Environment Variables.**
   - In the project settings on Railway, go to the "Variables" tab.
   - Add the following environment variables, which you can get from your Supabase and EmailJS dashboards. These are required for the application to connect to these services.
     - `VITE_SUPABASE_URL`: Your Supabase project URL.
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
     - `VITE_EMAILJS_SERVICE_ID`: Your EmailJS service ID.
     - `VITE_EMAILJS_TEMPLATE_ID`: Your EmailJS template ID.
     - `VITE_EMAILJS_USER_ID`: Your EmailJS user ID.

   **Note:** The `VITE_` prefix is important because the application is built with Vite, and this prefix is required to expose these variables to the client-side code.

4. **Deploy.**
   - Once the build settings and environment variables are configured, Railway will automatically trigger a deployment.
   - You can monitor the deployment logs in the "Deployments" tab.

5. **Access your application.**
   - After the deployment is successful, Railway will provide a public URL to access your application.

## Local Development with Environment Variables

To run the application locally with the same environment variables, you can create a `.env` file in the root of the project with the following content:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_USER_ID=your_emailjs_user_id
```

**Important:** Do not commit the `.env` file to your Git repository. The `.gitignore` file should already be configured to ignore it.
