# Deployment Guide

This guide provides instructions for deploying the application.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/maxiusi3/draworld.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables:

```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Clerk Configuration (Get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Stripe Configuration (Get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Runware AI Configuration
RUNWARE_AI_API_KEY=your_runware_ai_api_key
RUNWARE_AI_APP_ID=your_runware_ai_app_id

# Uploadthing Configuration
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Building the Application

```bash
npm run build
```

## Deployment

The application can be deployed to any platform that supports Next.js.

### Vercel

1.  Push the code to a Git repository (e.g., GitHub).
2.  Import the repository on Vercel.
3.  Add the environment variables in the Vercel project settings.
4.  Deploy.