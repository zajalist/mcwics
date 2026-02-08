# Firebase Setup for AI Content Storage

## Required Firebase Services

Your AI enhancement system uses **two Firebase services** to store content:

### 1. Firestore Database
Stores AI-enhanced text content (stories, puzzles, clues)

### 2. Firebase Storage  
Stores AI-generated images and media files

---

## Setup Instructions

### Step 1: Enable Firestore Database

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (or create one if you haven't)
3. **Navigate to**: Build → Firestore Database
4. **Click**: "Create database"
5. **Select mode**:
   - **Test mode** (for development) - allows read/write without authentication
   - **Production mode** - requires security rules (recommended)
6. **Choose location**: Select closest to your users
7. **Click**: "Enable"

**Collections created automatically:**
- `ai_content` - Stores AI-enhanced text and metadata
- `scenarios` - Your scenario data (may already exist)

### Step 2: Enable Firebase Storage

1. **Still in Firebase Console**
2. **Navigate to**: Build → Storage
3. **Click**: "Get started"
4. **Choose security rules**:
   - **Test mode** (for development)
   - **Production mode** (recommended with custom rules)
5. **Choose location**: Same as Firestore for consistency
6. **Click**: "Done"

**Folder structure created automatically:**
```
ai-generated/
  ├── {scenarioId}/
  │   ├── {puzzleNodeId}/
  │   │   ├── image_0_timestamp.png
  │   │   └── image_1_timestamp.png
```

---

## Security Rules (Recommended)

### Firestore Rules

Go to Firestore → Rules tab and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow anyone to read scenarios
    match /scenarios/{scenarioId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.uid == request.auth.uid;
    }
    
    // AI content - authenticated users can create, anyone can read
    match /ai_content/{contentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

### Storage Rules

Go to Storage → Rules tab and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // AI-generated images
    match /ai-generated/{scenarioId}/{puzzleNodeId}/{fileName} {
      allow read: if true;  // Anyone can view images
      allow write: if request.auth != null;  // Only authenticated users can upload
    }
    
    // Allow uploads during development
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Verify Setup

### Check Firestore

1. Go to Console → Firestore Database
2. You should see it's enabled
3. Collections will appear after first AI enhancement

### Check Storage

1. Go to Console → Storage
2. You should see "Files" tab
3. `ai-generated/` folder will appear after first image generation

---

## Testing

### Test AI Enhancement Flow

1. **In your editor**:
   - Create a puzzle with basic content
   - Add an AI Enhancer node
   - Connect to the puzzle
   - Configure enhancement instructions
   - Click Deploy

2. **Check Firestore**:
   - Go to Firestore Database
   - Look for `ai_content` collection
   - You should see a document like: `scenario123_P1_AI1_timestamp`
   - Inspect the document to see `originalContent` and `enhancedContent`

3. **Check Storage** (if using image generation):
   - Go to Storage
   - Look for `ai-generated/` folder
   - Navigate to your scenario folder
   - You should see generated images

---

## Troubleshooting

### "Permission denied" errors

**Problem**: Security rules are too restrictive

**Solution**:
- For development: Use Test mode (allows all operations)
- For production: Update security rules as shown above
- Make sure you're signed in when testing

### Images not appearing

**Problem**: Storage not enabled or wrong bucket

**Solution**:
- Verify Storage is enabled in Firebase Console
- Check your `.env` file has correct `VITE_FIREBASE_STORAGE_BUCKET`
- Verify security rules allow read access

### Collections not appearing

**Problem**: No AI enhancements deployed yet

**Solution**:
- Collections are created automatically on first write
- Deploy a scenario with AI enhancement to create them
- Check browser console (F12) for errors

### Slow uploads

**Problem**: Large images or slow connection

**Solution**:
- Image generation APIs create images at reasonable sizes (1024x1024)
- Firebase Storage handles compression automatically
- Check your internet connection speed

---

## Cost Monitoring

### Free Tier Limits

**Firestore:**
- 1 GB storage
- 50,000 document reads per day
- 20,000 document writes per day
- 20,000 document deletes per day

**Storage:**
- 5 GB storage
- 1 GB download per day
- 50,000 upload operations per day

### Monitor Usage

1. Go to Console → Usage and billing
2. Check Firestore usage
3. Check Storage usage
4. Set up billing alerts if needed

### Cost Optimization Tips

1. **Use caching**: Same content + instructions = no API call, no storage write
2. **Reasonable image sizes**: 1024x1024 is sufficient for scavenger hunts
3. **Delete old scenarios**: Remove unused content to save storage
4. **Compress images**: Firebase does this automatically, but you can optimize further

---

## Quick Reference

### Firestore Document Structure

```javascript
{
  id: "scenario123_P1_AI1_1707404523000",
  scenarioId: "scenario123",
  puzzleNodeId: "P1",
  aiNodeId: "AI1",
  type: "text",
  originalContent: { /* puzzle content before enhancement */ },
  enhancedContent: { /* improved content from Gemini */ },
  enhancementInstructions: "Make it dramatic...",
  generatedAt: Timestamp,
}
```

### Storage File Path

```
ai-generated/{scenarioId}/{puzzleNodeId}/image_0_1707404523000.png
```

---

## Next Steps

Once Firebase is set up:

1. ✅ Firestore Database enabled
2. ✅ Firebase Storage enabled  
3. ✅ Security rules configured
4. ✅ Test with a simple AI enhancement
5. ✅ Monitor usage in Firebase Console

**Your AI enhancement system is now ready to store content automatically!** 🎉

For more details:
- [Quick Start Guide](./QUICKSTART_AI.md) - Full walkthrough
- [AI Storage Guide](./AI_STORAGE_GUIDE.md) - How storage works
- [Gemini Setup Guide](./GEMINI_SETUP.md) - API configuration
