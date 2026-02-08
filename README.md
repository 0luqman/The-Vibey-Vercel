# The Vibey Vercel 📝

A minimal, aesthetic notepad-style study tool.

## Environment Setup
The app requires an API key from Google AI Studio.

1.  **Local Development:** Rename `example.env` to `.env` and add your key.
2.  **Vercel Deployment:** 
    - Go to your Project Settings.
    - Navigate to **Environment Variables**.
    - Add a new variable: 
        - **Key:** `API_KEY`
        - **Value:** `YOUR_GEMINI_API_KEY`
    - **Note:** For static sites, ensure your build tool (if any) is configured to expose these variables to the browser.

## Tech Stack
- React
- Tailwind CSS
- Gemini AI (`gemini-3-flash-preview`)
