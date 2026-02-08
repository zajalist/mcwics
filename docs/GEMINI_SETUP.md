# Google Gemini API Setup Guide

## Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**:
   - Click "Create API Key"
   - Select "Create API key in new project" (or use existing project)
   - Copy the generated API key (it looks like: `AIzaSy...`)
   - **Important**: Keep this key secret! Don't commit it to Git

3. **Enable the API** (if prompted):
   - Go to Google Cloud Console
   - Enable "Generative Language API"

## Step 2: Add API Key to Your Project

1. **Create `.env` file** in the `client/` folder (same level as `package.json`):

   ```bash
   # Navigate to client folder
   cd client
   
   # Create .env file (or copy from .env.example)
   copy .env.example .env
   ```

2. **Edit `.env` file** and add your API key:

   ```env
   # Google Gemini AI Configuration
   VITE_GEMINI_API_KEY=AIzaSy_your_actual_api_key_here
   
   # Your existing Firebase config (keep these)
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Restart your dev server** (important!):
   - Stop the current server (Ctrl+C in terminal)
   - Start it again: `npm run dev`
   - Vite only loads .env variables on startup

## Step 3: Verify Setup

1. **Open browser console** (F12)
2. **Go to your editor page**
3. **Add an AI Enhancer node** from the Primitives category
4. Check console for any API key errors

## Step 4: Test AI Enhancement

1. **Create a test puzzle with basic content**:
   - Add a Puzzle Node first
   - Add basic story: "The Signal" / "There's a signal in space."
   - Add a simple puzzle: "Decode this" with answer "LAUNCH"
   
2. **Add AI Enhancer**:
   - Add AI Enhancer node
   - Set instructions: "Make the story more dramatic. Improve the puzzle prompt to be clearer. Add atmospheric imagery."
   - Select "Improve Existing Text" checkbox
   - Connect AI Enhancer bottom pin → Puzzle top pin (orange)
   
3. **Deploy (triggers enhancement)**:
   - Click Deploy button
   - Watch progress: "🤖 Enhancing AI1 → P1..."
   - Check result: your basic content is now enhanced!

## Important Notes

### Free Tier Limits
- Gemini API has a **free tier** with rate limits
- **60 requests per minute**
- **1500 requests per day**
- Suitable for development and small-scale use

### Pricing (if you exceed free tier)
- Check current pricing: https://ai.google.dev/pricing
- Generally very affordable ($0.00025 per 1K characters)

### Security Best Practices

1. **Never commit `.env` to Git**:
   ```bash
   # .gitignore already includes this
   .env
   .env.local
   ```

2. **Use environment variables** (already configured):
   ```javascript
   const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
   ```

3. **For production**, use Firebase Functions or a backend server to hide the API key

## Optional: Image Generation Setup

To generate images along with text enhancement:

1. **Choose an image generation provider**:
   - **Stability AI** (recommended): https://platform.stability.ai/account/keys
   - **OpenAI DALL-E**: https://platform.openai.com/api-keys
   - **Replicate**: https://replicate.com/account/api-tokens

2. **Add to `.env` file**:
   ```env
   # Image Generation (Optional)
   VITE_IMAGE_API_KEY=your_image_api_key_here
   VITE_IMAGE_API_PROVIDER=stability
   # Options: stability, dalle, replicate
   ```

3. **Restart dev server** and check "Generate & Add Images" in AI Enhancer

**Note**: Without image API key, system will use placeholder images.

## Troubleshooting

### Error: "GEMINI_API_KEY not configured"
- Make sure `.env` file exists in `client/` folder
- Check the variable name is exactly: `VITE_GEMINI_API_KEY`
- Restart the dev server

### Error: "API key not valid"
- Verify you copied the complete key from Google AI Studio
- Check for extra spaces or quotes in .env file
- Make sure the API is enabled in Google Cloud Console

### Error: "Rate limit exceeded"
- You've hit the free tier limit (60 requests/min)
- Wait a minute and try again
- Caching helps: same content + instructions = no API call

### Error: "Safety filter triggered"
- Your instructions were flagged by content filters
- Revise the instructions to be more appropriate
- Avoid prompts about violence, explicit content, etc.

### AI Enhancer not visible in editor
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check the **Primitives** folder in left sidebar

### Enhancement not working
- Make sure puzzle node has existing content to enhance
- Check that AI node is connected to puzzle node (orange pins)
- Verify instructions are specific about what to improve
- Check browser console (F12) for errors

## Next Steps

Now that Gemini is set up, you can:
1. **Enhance story narratives** to be more dramatic and engaging
2. **Improve puzzle prompts** with better clarity and context
3. **Refine role-specific clues** for better team coordination
4. **Add atmospheric images** to puzzles (with image API)
5. **Transform basic content** into polished, professional scenarios

The AI-enhanced content will be automatically stored in Firebase when you deploy scenarios!

For more details:
- [Quick Start Guide](./QUICKSTART_AI.md) - Fast 5-minute setup
- [AI Storage Guide](./AI_STORAGE_GUIDE.md) - How content is stored
- [AI Services](../client/src/services/ai/README.md) - Code reference
