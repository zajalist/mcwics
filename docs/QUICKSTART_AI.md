# 🚀 Quick Start: Google Gemini AI Integration

## AI Enhancement Workflow

The AI system **enhances existing puzzle nodes** by:
- ✨ Improving and refining existing text (stories, puzzles, clues)
- 🖼️ Generating and adding images to puzzles
- 🎥 Adding video descriptions (for manual upload)
- 💾 Automatically storing all generated content in your Firebase database

## Step-by-Step Setup (5 minutes)

### 1️⃣ Get Your Gemini API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like `AIzaSy...`)

### 2️⃣ Add API Key to Your Project

1. Open your project folder in VS Code
2. Navigate to the `client/` folder
3. Create a file named `.env`:

```bash
cd client
New-Item .env  # Windows PowerShell
# or
touch .env     # Mac/Linux
```

4. Open `.env` and add this line:

```env
VITE_GEMINI_API_KEY=AIzaSy_paste_your_actual_key_here

# Optional: For image generation (Stability AI, DALL-E, etc.)
VITE_IMAGE_API_KEY=your_image_api_key_here
VITE_IMAGE_API_PROVIDER=stability
```

5. Save the file

### 3️⃣ Restart the Dev Server

**Important**: The server must restart to load the new API key!

1. In your terminal, stop the server if running
2. Restart: `npm run dev`
3. The server will now have access to your API key

### 4️⃣ Create a Puzzle to Enhance

1. Open the scenario editor in your browser
2. Add a **Puzzle Node** to the canvas
3. Add some basic content to it:
   - Story title and text
   - A puzzle or two
   - Maybe some role clues
4. This content will be enhanced by AI

### 5️⃣ Add AI Enhancer Node

1. Look at the left sidebar for the **Primitives** folder
2. Click **Primitives** to open the menu
3. Find **"AI Enhancer"** (with ✨ sparkles icon)
4. Drag it onto the canvas or click to configure

### 6️⃣ Configure Enhancement Instructions

1. Click the AI node to select it
2. In the right sidebar, you'll see:
   - **Enhancement Instructions**: Describe how to improve the puzzle
   - **Enhancement Types**: What to enhance/add
   - **Connected Puzzle Node**: Shows when connected

3. Example instructions:
```
Make the story more dramatic and suspenseful. Enhance the puzzle 
prompts to be clearer and more engaging. Add vivid imagery of the 
abandoned laboratory with mysterious scientific equipment.
```

4. Check these boxes:
   - ✅ Improve Existing Text
   - ✅ Generate & Add Images
   - ⬜ Add Video Descriptions (optional)

### 7️⃣ Connect AI to the Puzzle

1. Drag from the **bottom pin** (orange) of the AI Enhancer node
2. Connect to the **top pin** (orange) of the Puzzle node
3. You'll see "✓ Connected to P1" on the AI node

### 8️⃣ Deploy and Enhance

1. Click the **Deploy** button (top right)
2. Fill in title and description
3. Click **Deploy**
4. Watch the progress:
   - 🤖 Processing AI enhancements...
   - 🤖 Enhancing AI1 → P1...
   - ✅ Enhanced AI1 + 2 image(s)
   - ☁️ Uploading to database...
   - ✅ Deployment successful!

## 🎉 Done!

Your enhanced content is now:
- ✅ Improved text stored in the puzzle node
- ✅ Generated images stored in Firebase Storage
- ✅ Image URLs linked to the puzzle
- ✅ Cached for future use (same instructions = instant)
- ✅ Ready to use in your scenario

## 📖 Next Steps

### Learn More
- [Full Gemini Setup Guide](./GEMINI_SETUP.md) - Detailed configuration
- [AI Storage Guide](./AI_STORAGE_GUIDE.md) - How storage works
- [AI Services API](../client/src/services/ai/README.md) - Code examples

### Try Different Enhancement Instructions

**Text improvement**:
```
Make the story more tense and dramatic. Add technical details about 
reactor cooling systems. Make the puzzle prompts clearer and more specific.
```

**Image generation**:
```
Generate images showing: 1) A dark laboratory with glowing symbols on 
walls, 2) A close-up of a mysterious control panel, 3) A warning sign 
with cryptic text.
```

**Complete enhancement**:
```
Transform this into a thrilling mystery. Improve all text to be more 
engaging. Add atmospheric images of the location. Make role clues more 
specific to each team member's expertise.
```

## 🔧 Troubleshooting

### Can't See AI Enhancer Node?
- Hard refresh your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check the **Primitives** folder (first one in the left sidebar)

### "API Key Not Configured" Error?
- Make sure `.env` file is in the `client/` folder
- Check the variable name: `VITE_GEMINI_API_KEY`
- Restart the dev server after creating `.env`

### AI Node Not Connecting?
- Drag from **bottom pin** (orange) of AI node
- Connect to **top pin** (orange) of Puzzle node  
- Don't connect to the side pins (those are for regular flow)

### "Rate Limit Exceeded"?
- Free tier: 60 requests per minute
- Wait 60 seconds and try again
- Consider using cache (same instructions = no API call)

### Images Not Generating?
- Configure `VITE_IMAGE_API_KEY` in `.env` file
- Set `VITE_IMAGE_API_PROVIDER` (stability, dalle, or replicate)
- Without image API key, system uses placeholder images

## 💡 Tips

1. **Start with existing content**: Create basic puzzle content first, then enhance
2. **Be specific**: Detailed instructions = better enhancements
3. **Use the cache**: Don't change instructions unnecessarily  
4. **Test incrementally**: Start with 1 AI node, add more later
5. **Check Firebase**: View stored images in Firebase Storage console

## 🆘 Need Help?

- Check the detailed guides in the `docs/` folder
- Review Firebase Console for stored content
- Test with simple enhancements first
- Check browser console (F12) for error messages

---

**Ready to enhance your scenarios with AI! 🚀✨**
