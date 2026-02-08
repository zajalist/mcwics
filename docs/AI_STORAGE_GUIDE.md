# AI Content Storage Guide

## Overview

LockStep automatically stores AI-enhanced content (improved text, generated images) when you deploy scenarios. This guide explains how the storage system works and how to use it.

**Key Concept**: AI nodes **enhance existing puzzle content**, they don't generate from scratch. The system improves text that's already in your puzzles and adds new images/videos.

## 🗄️ Storage Architecture

### 1. **Firestore Collections**
AI-enhanced content is stored in the `ai_content` collection with this structure:

```javascript
{
  id: "scenario123_P1_AI1_1707404523000",
  scenarioId: "scenario123",
  puzzleNodeId: "P1",
  aiNodeId: "AI1",
  type: "text" | "image",
  
  // For enhanced text content:
  originalContent: {
    story: { title: "The Signal", text: "There's a signal..." },
    puzzles: [{ prompt: "Decode this", answer: "LAUNCH" }]
  },
  enhancedContent: {
    story: { title: "The Lost Signal", text: "In the depths of space, a mysterious signal..." },
    puzzles: [{ prompt: "Decode this encrypted alien transmission", answer: "LAUNCH", hint: "Look for patterns" }]
  },
  
  // For generated images:
  url: "https://firebasestorage.googleapis.com/...",
  path: "ai-generated/scenario123/P1/image_0_1234567.png",
  
  generatedAt: Timestamp,
  enhancementInstructions: "Make the story more dramatic and add tension. Improve puzzle clarity..."
}
```

### 2. **Firebase Storage Structure**
Generated images are stored in Firebase Storage under:
```
ai-generated/
  ├── {scenarioId}/
  │   ├── {puzzleNodeId}/
  │   │   ├── image_0_timestamp.png
  │   │   ├── image_1_timestamp.png
  │   │   └── location_image_timestamp.png
```

## 🚀 How It Works

### During Deployment

When you click **Deploy** in the editor:

1. **Detection**: System finds all AI nodes connected to puzzle nodes
2. **Extract Content**: Gets existing content from the puzzle node
3. **Cache Check**: Checks if enhancement was already done for this content + instructions
4. **Enhancement**: 
   - Calls Gemini API to improve existing text
   - Calls image generation API to create new images (if requested)
5. **Storage**: 
   - Stores enhanced text content in Firestore `ai_content` collection
   - Uploads generated images to Firebase Storage
   - Links enhanced content back to the puzzle node
6. **Reference**: Updates puzzle node with enhanced content and image URLs

### Content Types Processed

#### Text Enhancement
- **Story narratives**: Makes more dramatic, engaging, detailed
- **Puzzle prompts**: Improves clarity, adds context, better hints
- **Role clues**: Enhances specificity and team relevance
- **Descriptions**: Adds vivid details and atmosphere

#### Image Generation
- **Scene illustrations**: Visual representations of locations
- **Puzzle images**: Generated visual puzzles
- **Atmospheric images**: Setting and mood images
- **Clue images**: Visual hints and references

## 💾 Caching System

### How Caching Works

The system caches enhanced content to:
- **Save API costs** (avoid re-enhancing the same content)
- **Improve speed** (instant retrieval for repeat instructions + content)
- **Maintain consistency** (same inputs = same outputs)

### Cache Key

Content is cached based on:
```javascript
scenarioId + puzzleNodeId + aiNodeId + enhancementInstructions + originalContent = Unique cache key
```

If you change:
- The original puzzle content → New enhancement generated
- The enhancement instructions → New enhancement generated
- Nothing → Uses cached enhancement (instant!)

### Cache Duration

- Cached content **never expires** automatically
- Stays in Firestore until you delete the scenario
- Can be manually cleared if needed

## 📝 Using AI Enhancement in Your Scenarios

### Step 1: Create Puzzle with Basic Content

```javascript
// In the editor:
1. Add a Puzzle Node
2. Add basic content:
   - Story title: "The Signal"
   - Story text: "There's a signal in space..."
   - Puzzle prompt: "Decode this"
   - Answer: "LAUNCH"
```

### Step 2: Add AI Enhancer

```javascript
// Add enhancement:
1. Add AI Enhancer node
2. Set enhancement instructions: 
   "Make the story more dramatic and mysterious. 
    Improve the puzzle prompt to be clearer.
    Add vivid imagery of space and alien technology."
3. Select what to enhance:
   ✅ Improve Existing Text
   ✅ Generate & Add Images
4. Connect AI Enhancer to Puzzle Node
```

### Step 3: Deploy

```javascript
// Click Deploy button
// System will:
- Read existing puzzle content
- Enhance text via Gemini
- Generate images via image API
- Store everything in Firebase
- Update puzzle with enhanced content
- Show progress: "🤖 Enhancing AI1 → P1..."
```

### Step 4: Access Enhanced Content

The puzzle node will now have enhanced content:

```javascript
{
  puzzleNode: {
    id: "P1",
    data: {
      story: {
        title: "The Lost Signal",
        text: "In the depths of space, a mysterious signal pulses..."
      },
      puzzles: [{
        prompt: "Decode this encrypted alien transmission to uncover its origin",
        answer: "LAUNCH",
        hint: "Start by identifying the cipher type"
      }],
      images: [
        "https://firebasestorage.googleapis.com/v0/b/.../space_scene.png",
        "https://firebasestorage.googleapis.com/v0/b/.../alien_tech.png"
      ]
    },
    aiEnhanced: true,
    aiNodeId: "AI1"
  }
}
```

## 🛠️ API Functions

### Process & Store Enhancement

```javascript
import { processAndStoreAIEnhancement } from '@/services/aiContentStorage';

const result = await processAndStoreAIEnhancement(
  'scenario123',
  'P1',              // puzzleNodeId
  'AI1',             // aiNodeId
  {                  // Original content
    story: { title: 'The Signal', text: '...' }
  },
  'Make it dramatic', // Enhancement instructions
  ['text', 'images']  // What to enhance/generate
);

// result includes:
// - contentId: Firestore document ID
// - enhancedContent: Improved text
// - imageUrls: Array of generated image URLs
// - cached: Boolean (was it from cache?)
```

### Store Enhanced Text

```javascript
import { storeEnhancedText } from '@/services/aiContentStorage';

const contentId = await storeEnhancedText(
  'scenario123',
  'P1',           // puzzleNodeId
  'AI1',          // aiNodeId
  originalContent,
  enhancedContent,
  'Make it dramatic'
);
```

### Store Generated Images

```javascript
import { storeGeneratedImage } from '@/services/aiContentStorage';

const imageUrl = await storeGeneratedImage(
  'scenario123',
  'P1',           // puzzleNodeId
  imageBlob,      // Generated image data
  'space_scene'   // optional name
);
```

### Check Enhancement Cache

```javascript
import { getCachedEnhancement } from '@/services/aiContentStorage';

const cached = await getCachedEnhancement(
  'scenario123',
  'P1',
  'AI1',
  originalContent,
  enhancementInstructions
);

if (cached) {
  console.log('Using cached enhancement!');
  console.log('Enhanced:', cached.enhancedContent);
  console.log('Images:', cached.imageUrls);
}
```

## 🔍 Viewing Stored Content

### In Firebase Console

1. **Firestore**:
   - Go to Firebase Console → Firestore Database
   - Open `ai_content` collection
   - View all enhanced content documents
   - See originalContent vs enhancedContent comparison

2. **Storage**:
   - Go to Firebase Console → Storage
   - Navigate to `ai-generated/` folder
   - Browse by scenario and puzzle node
   - View generated images

### In Your Code

```javascript
import { getAllAIContentForScenario } from '@/services/aiContentStorage';

const allContent = await getAllAIContentForScenario('scenario123');

allContent.forEach(item => {
  console.log('Type:', item.type);
  console.log('Puzzle:', item.puzzleNodeId);
  console.log('AI Node:', item.aiNodeId);
  console.log('Generated:', item.generatedAt);
  
  if (item.type === 'text') {
    console.log('Original:', item.originalContent);
    console.log('Enhanced:', item.enhancedContent);
  } else if (item.type === 'image') {
    console.log('URL:', item.url);
  }
});
```

## 🗑️ Deleting Content

### Delete All Content for Scenario

```javascript
import { deleteAIContentForScenario } from '@/services/aiContentStorage';

await deleteAIContentForScenario('scenario123');
```

This removes:
- All Firestore documents for the scenario
- (Images remain in Storage - manual cleanup needed)

### Manual Cleanup

For images, you need to delete from Storage manually:
1. Go to Firebase Console → Storage
2. Navigate to `ai-generated/{scenarioId}/`
3. Delete the folder

## 💰 Cost Considerations

### Gemini API Costs
- **Free tier**: 60 requests/min, 1500 requests/day
- **Paid tier**: ~$0.00025 per 1K characters
- **Caching saves costs**: Same content + instructions = no API call

### Image Generation Costs
- **Stability AI**: ~$0.002 per image (512x512)
- **DALL-E 3**: ~$0.04 per image (1024x1024)
- **Replicate**: Varies by model
- **Tip**: Use placeholder images for testing

### Firebase Storage Costs
- **Free tier**: 5 GB storage, 1 GB/day downloads
- **Paid tier**: $0.026/GB/month storage
- Tip: Compress images, use reasonable dimensions (1024x1024 max)

### Firestore Costs
- **Free tier**: 50K reads, 20K writes per day
- **Paid tier**: $0.06 per 100K reads
- AI content is write-once, read-many (efficient)

## 🔐 Security Rules

Add these Firebase security rules:

```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // AI content - authenticated users can create, anyone can read
    match /ai_content/{contentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.scenarioId == get(/databases/$(database)/documents/scenarios/$(resource.data.scenarioId)).data.uid;
    }
  }
}

// Storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // AI-generated content - authenticated users can upload
    match /ai-generated/{scenarioId}/{puzzleNodeId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎯 Best Practices

1. **Start with good content**: Better original content = better enhanced content
2. **Be specific with instructions**: Detailed instructions = better enhancements
3. **Enable caching**: Don't change instructions or content unnecessarily
4. **Test before deploying**: Use small scenarios first
5. **Monitor usage**: Check Firebase Console for costs
6. **Compress images**: Reduce storage costs (use 1024x1024 or smaller)
7. **Delete old content**: Clean up unused scenarios
8. **Review enhancements**: Verify AI improved what you wanted

## 🐛 Troubleshooting

### "Error storing AI content"
- **Check Firebase config**: Ensure Firestore and Storage are enabled
- **Check auth**: User must be signed in
- **Check permissions**: Review security rules

### "Image upload failed"
- **Check image API key**: Set VITE_IMAGE_API_KEY in .env
- **Check provider**: Set VITE_IMAGE_API_PROVIDER (stability, dalle, replicate)
- **Check format**: Generated images should be PNG/JPG
- **Check Storage quota**: Free tier has limits

### "Enhancement not improving content"
- **Check instructions**: Be specific about what to improve
- **Check original content**: Ensure puzzle has content to enhance
- **Check API key**: Verify VITE_GEMINI_API_KEY is set
- **Try new instructions**: Change wording to bypass cache

### "Rate limit exceeded"
- **Gemini**: Free tier = 60 req/min, wait 60 seconds
- **Image API**: Varies by provider, check their limits
- **Wait or upgrade**: Space out requests or use paid tier

## 📊 Monitoring

Track AI content enhancement:

```javascript
// In Firebase Console:
1. Firestore → ai_content collection
2. Check document count (total enhancements)
3. View generatedAt timestamps (recent activity)
4. Compare originalContent vs enhancedContent (quality)
5. Filter by scenarioId (per-scenario stats)

// Monitor Storage:
1. Storage → ai-generated folder
2. Check total size (storage usage)
3. View file count (number of images)
4. Check by scenario/puzzle (organization)
```

## 🚀 Production Deployment

For production, consider:

1. **Backend API**: Move AI calls to a server (hide API keys)
2. **Webhooks**: Enhance content asynchronously
3. **CDN**: Serve images via CDN for faster loading
4. **Batch processing**: Enhance multiple puzzles at once
5. **Error recovery**: Retry failed enhancements
6. **Content moderation**: Filter inappropriate generated content
7. **Quality review**: Human review of enhancements before publish

## 📚 Related Documentation

- [Quick Start Guide](./QUICKSTART_AI.md) - 5-minute setup
- [Gemini API Setup](./GEMINI_SETUP.md) - Detailed API configuration
- [AI Services README](../client/src/services/ai/README.md) - Code reference
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Stability AI Docs](https://platform.stability.ai/docs)

---

**Your AI-enhanced content is automatically stored, cached, and ready to use! 💾✨**

## 🗄️ Storage Architecture

### 1. **Firestore Collections**
AI-generated content is stored in the `ai_content` collection with this structure:

```javascript
{
  id: "scenario123_AI1_1707404523000",
  scenarioId: "scenario123",
  nodeId: "AI1",
  type: "text" | "image",
  
  // For text content:
  content: {
    story: { title: "...", text: "...", narrationText: "..." },
    puzzles: [...],
    roleClues: [...],
    choices: [...]
  },
  
  // For images:
  url: "https://firebasestorage.googleapis.com/...",
  path: "ai-generated/scenario123/AI1/image_0_1234567.png",
  
  generatedAt: Timestamp,
  prompt: "The original prompt used"
}
```

### 2. **Firebase Storage Structure**
Images are stored in Firebase Storage under:
```
ai-generated/
  ├── {scenarioId}/
  │   ├── {aiNodeId}/
  │   │   ├── image_0_timestamp.png
  │   │   ├── image_1_timestamp.png
  │   │   └── generated_timestamp.png
```

## 🚀 How It Works

### During Deployment

When you click **Deploy** in the editor:

1. **Detection**: System finds all AI nodes connected to puzzle nodes
2. **Cache Check**: Checks if content was already generated for this prompt
3. **Generation**: If not cached, calls Gemini API to generate content
4. **Storage**: 
   - Stores text content in Firestore `ai_content` collection
   - Uploads images to Firebase Storage
   - Links generated content to the scenario
5. **Reference**: Stores content IDs in the scenario JSON

### Content Types Stored

#### Text Content
- **Story narratives**: Title, text, narration
- **Puzzle questions**: Prompts, hints, answers
- **Role clues**: Team-specific information
- **Choices**: Decision options and outcomes

#### Images (Future)
- **Puzzle images**: Generated visual puzzles
- **Scene illustrations**: Story backgrounds
- **Clue images**: Visual hints

## 💾 Caching System

### How Caching Works

The system caches generated content to:
- **Save API costs** (avoid regenerating the same content)
- **Improve speed** (instant retrieval for repeat prompts)
- **Maintain consistency** (same prompt = same output)

### Cache Key

Content is cached based on:
```javascript
scenarioId + nodeId + prompt = Unique cache key
```

If you change the prompt, new content is generated. Same prompt retrieves cached content.

### Cache Duration

- Cached content **never expires** automatically
- Stays in Firestore until you delete the scenario
- Can be manually cleared if needed

## 📝 Using AI Content in Your Scenarios

### Step 1: Configure AI Node

```javascript
// In the editor:
1. Add AI Generator node
2. Set prompt: "Generate a mystery puzzle about decoding ancient symbols"
3. Select what to generate:
   ✅ Story
   ✅ Puzzles
   ✅ Role Clues
4. Connect to a puzzle node
```

### Step 2: Deploy

```javascript
// Click Deploy button
// System will:
- Generate content via Gemini
- Store in Firebase
- Show progress: "🤖 Processing AI nodes..."
```

### Step 3: Access Generated Content

The scenario JSON will include AI content references:

```javascript
{
  scenarios: [{
    // ... other scenario data
    aiGeneratedContent: {
      "AI1": {
        contentId: "scenario123_AI1_1707404523000",
        content: {
          story: { title: "...", text: "..." },
          puzzles: [...],
          roleClues: [...]
        },
        imageUrls: ["https://..."],
        cached: false
      }
    }
  }]
}
```

## 🛠️ API Functions

### Store Text Content

```javascript
import { storeAITextContent } from '@/services/aiContentStorage';

const contentId = await storeAITextContent(
  'scenario123',  // scenarioId
  'AI1',          // nodeId
  {
    story: { title: 'Mystery', text: '...' },
    puzzles: [...],
    prompt: 'Generate a mystery puzzle'
  }
);
```

### Store Images

```javascript
import { storeAIImage } from '@/services/aiContentStorage';

const imageUrl = await storeAIImage(
  'scenario123',  // scenarioId
  'AI1',          // nodeId
  imageBlob,      // File, Blob, or base64 data URL
  'puzzle_image'  // optional name
);
```

### Get Content for Node

```javascript
import { getAIContentForNode } from '@/services/aiContentStorage';

const contents = await getAIContentForNode('scenario123', 'AI1');
// Returns array of all content for that node
```

### Check Cache

```javascript
import { getCachedAIContent } from '@/services/aiContentStorage';

const cached = await getCachedAIContent(
  'scenario123',
  'AI1',
  'Generate a mystery puzzle'
);

if (cached) {
  console.log('Using cached content!');
  console.log(cached.content);
}
```

### Process Full Generation

```javascript
import { processAndStoreAIGeneration } from '@/services/aiContentStorage';

const result = await processAndStoreAIGeneration(
  'scenario123',
  aiNodeData,
  targetPuzzleNodeData
);

// result includes:
// - contentId: Firestore document ID
// - content: Generated text content
// - imageUrls: Array of stored image URLs
// - cached: Boolean (was it from cache?)
```

## 🔍 Viewing Stored Content

### In Firebase Console

1. **Firestore**:
   - Go to Firebase Console → Firestore Database
   - Open `ai_content` collection
   - View all generated content documents

2. **Storage**:
   - Go to Firebase Console → Storage
   - Navigate to `ai-generated/` folder
   - View stored images

### In Your Code

```javascript
import { getAllAIContentForScenario } from '@/services/aiContentStorage';

const allContent = await getAllAIContentForScenario('scenario123');

allContent.forEach(item => {
  console.log('Type:', item.type);
  console.log('Node:', item.nodeId);
  console.log('Generated:', item.generatedAt);
  if (item.type === 'text') {
    console.log('Content:', item.content);
  } else if (item.type === 'image') {
    console.log('URL:', item.url);
  }
});
```

## 🗑️ Deleting Content

### Delete All Content for Scenario

```javascript
import { deleteAIContentForScenario } from '@/services/aiContentStorage';

await deleteAIContentForScenario('scenario123');
```

This removes:
- All Firestore documents for the scenario
- (Images remain in Storage - manual cleanup needed)

### Manual Cleanup

For images, you need to delete from Storage manually:
1. Go to Firebase Console → Storage
2. Navigate to `ai-generated/{scenarioId}/`
3. Delete the folder

## 💰 Cost Considerations

### Gemini API Costs
- **Free tier**: 60 requests/min, 1500 requests/day
- **Paid tier**: ~$0.00025 per 1K characters
- **Caching saves costs**: Same prompt = no API call

### Firebase Storage Costs
- **Free tier**: 5 GB storage, 1 GB/day downloads
- **Paid tier**: $0.026/GB/month storage
- Tip: Compress images before storing

### Firestore Costs
- **Free tier**: 50K reads, 20K writes per day
- **Paid tier**: $0.06 per 100K reads
- AI content is write-once, read-many (efficient)

## 🔐 Security Rules

Add these Firebase security rules:

```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // AI content - authenticated users can create, anyone can read
    match /ai_content/{contentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.scenarioId == get(/databases/$(database)/documents/scenarios/$(resource.data.scenarioId)).data.uid;
    }
  }
}

// Storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // AI-generated content - authenticated users can upload
    match /ai-generated/{scenarioId}/{nodeId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎯 Best Practices

1. **Use descriptive prompts**: Better prompts = better content
2. **Enable caching**: Don't change prompts unnecessarily
3. **Test before deploying**: Use small scenarios first
4. **Monitor usage**: Check Firebase Console for costs
5. **Compress images**: Reduce storage costs
6. **Delete old content**: Clean up unused scenarios

## 🐛 Troubleshooting

### "Error storing AI content"
- **Check Firebase config**: Ensure Storage is enabled
- **Check auth**: User must be signed in
- **Check permissions**: Review security rules

### "Image upload failed"
- **Check file size**: Max 10MB recommended
- **Check format**: PNG, JPG supported
- **Check Storage quota**: Free tier has limits

### "Content not appearing"
- **Check cache**: Try with a new prompt
- **Check Firestore**: Verify document exists
- **Check scenario ID**: Ensure correct ID is used

### "Rate limit exceeded"
- **Wait**: Free tier resets per minute
- **Implement delays**: Space out requests
- **Upgrade**: Consider paid tier for production

## 📊 Monitoring

Track AI content generation:

```javascript
// In Firebase Console:
1. Firestore → ai_content collection
2. Check document count (total generations)
3. View generatedAt timestamps (recent activity)
4. Filter by scenarioId (per-scenario stats)

// Monitor Storage:
1. Storage → ai-generated folder
2. Check total size (storage usage)
3. View file count (number of images)
```

## 🚀 Production Deployment

For production, consider:

1. **Backend API**: Move Gemini calls to a server
2. **Webhooks**: Generate content asynchronously
3. **CDN**: Serve images via CDN for faster loading
4. **Batch processing**: Generate multiple nodes at once
5. **Error recovery**: Retry failed generations
6. **Content moderation**: Filter inappropriate content

## 📚 Related Documentation

- [Gemini API Setup](./GEMINI_SETUP.md)
- [AI Services README](../client/src/services/ai/README.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
