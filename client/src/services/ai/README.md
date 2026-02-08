# AI Services for LockStep

This directory contains AI integration services for generating puzzle content using Google's Gemini API.

## Setup

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Create a `.env` file in the `client/` directory (or copy from `.env.example`):
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. The API key will be automatically loaded by Vite.

## Features

### AI Node Integration

The AI services are designed to work with the AI Node in the scenario editor:

1. **Add an AI Node** from the node picker (Primitives category)
2. **Configure the AI Node** in the property sidebar:
   - Write a descriptive prompt
   - Select what to generate (story, puzzles, role clues, choices)
3. **Connect to a Puzzle Node** by dragging from the AI Node's bottom pin (orange) to the top pin of a puzzle node
4. The AI will generate content when the puzzle is processed

### Available Services

#### `generateWithGemini(prompt, options)`
Low-level API call to Gemini. Returns generated text.

**Parameters:**
- `prompt` (string): The prompt to send to Gemini
- `options` (object): Configuration options
  - `temperature` (number): 0.0-1.0, controls creativity (default: 0.7)
  - `maxOutputTokens` (number): Max response length (default: 2048)
  - `topK` (number): Sampling parameter (default: 40)
  - `topP` (number): Nucleus sampling (default: 0.95)

**Returns:**
```javascript
{
  success: true,
  text: "generated content...",
  raw: {...} // full API response
}
```

#### `generateStory(prompt, context)`
Generate narrative content for story panels.

**Parameters:**
- `prompt` (string): Story generation prompt
- `context` (object): Optional context
  - `scenarioTitle` (string): Name of the scenario
  - `location` (string): Location name

**Returns:**
```javascript
{
  title: "Story Title",
  text: "Main story text...",
  narrationText: "Optional narrator voice..."
}
```

#### `generateRoleClues(prompt, roles)`
Generate role-specific clues for team roles.

**Parameters:**
- `prompt` (string): Clue generation prompt
- `roles` (array): List of role IDs (default: ['builder', 'pathfinder', 'decoder', 'coordinator'])

**Returns:**
```javascript
[
  { role: "builder", clue: "Check the power systems..." },
  { role: "decoder", clue: "The message is encoded in..." },
  ...
]
```

#### `generatePuzzle(basePrompt, puzzleType)`
Generate puzzle content based on puzzle type.

**Supported Types:**
- `choice` - Multiple choice questions
- `input_code` - Text/code input puzzles
- `input_numeric` - Numeric puzzles
- `cipher` - Cipher/encryption puzzles
- `word_puzzle` - Word games
- `latex_math` - Math problems

**Returns:**
Puzzle-type specific JSON object with appropriate fields.

#### `generatePuzzleContent(aiConfig, context)`
High-level function that generates multiple content types based on AI node configuration.

**Parameters:**
- `aiConfig` (object): AI node configuration
  - `prompt` (string): Generation prompt
  - `generates` (array): Content types to generate ['story', 'puzzles', 'roleClues', 'choices']
- `context` (object): Scenario context

**Returns:**
Object containing requested content types.

## Usage Examples

### Basic Story Generation

```javascript
import { generateStory } from '@/services/ai';

const story = await generateStory(
  "Create a dramatic story about discovering a hidden laboratory",
  { scenarioTitle: "The Lost Lab", location: "Underground Facility" }
);

console.log(story.title); // "The Hidden Laboratory"
console.log(story.text);  // Full story text...
```

### Generate Role Clues

```javascript
import { generateRoleClues } from '@/services/ai';

const clues = await generateRoleClues(
  "Generate clues about a broken communication system",
  ['builder', 'decoder', 'coordinator']
);

// [
//   { role: 'builder', clue: 'The antenna array needs realignment...' },
//   { role: 'decoder', clue: 'The signal is using morse code...' },
//   { role: 'coordinator', clue: 'Power levels are critical...' }
// ]
```

### Generate Complete Puzzle Content

```javascript
import { generatePuzzleContent } from '@/services/ai';

const content = await generatePuzzleContent(
  {
    prompt: "Create a cipher puzzle about decoding a distress signal",
    generates: ['story', 'puzzles', 'roleClues']
  },
  {
    scenarioTitle: "Emergency Response",
    location: "Communications Hub"
  }
);

// Returns object with story, puzzles, and roleClues
```

### Execute AI Node Generation

```javascript
import { executeAIGeneration } from '@/services/ai';

// This is called automatically when processing connected AI nodes
const result = await executeAIGeneration(
  aiNodeData,      // Data from the AI node
  targetNodeData   // Data from the target puzzle node
);

if (result.success) {
  // Apply result.data to the puzzle node
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Best Practices

### Writing Good Prompts

1. **Be Specific**: Include context, tone, and desired outcome
   ```
   ❌ "Generate a puzzle"
   ✅ "Create a mysterious cipher puzzle about a classified military code from the Cold War era"
   ```

2. **Include Requirements**: Specify what elements you need
   ```
   "Generate a puzzle that requires teamwork between the decoder (who has the key) 
   and builder (who has the encrypted message)"
   ```

3. **Set the Tone**: Describe the atmosphere
   ```
   "Create a tense, dramatic story about a countdown timer. 
   Make it feel urgent but not hopeless."
   ```

### Content Generation Types

- **Story**: Best for narrative panels, scene-setting, character dialogue
- **Puzzles**: Generates puzzle questions, answers, and hints
- **Role Clues**: Creates team-specific information distribution
- **Choices**: Generates decision points and branching options

### Performance Tips

- Use `temperature` 0.7-0.9 for creative content (stories, descriptions)
- Use `temperature` 0.3-0.5 for factual content (math problems, technical info)
- Keep prompts under 2000 characters for best results
- Cache generated content to avoid redundant API calls

## Error Handling

All AI functions return success/failure objects:

```javascript
const result = await generateStory(prompt, context);

if (result.success) {
  // Use result.text or parsed data
} else {
  console.error("Error:", result.error);
  // Fall back to manual entry or default content
}
```

Common errors:
- No API key configured
- Rate limiting (too many requests)
- Invalid prompt (blocked by safety filters)
- Network errors

## API Limits & Costs

- Gemini API has a free tier with rate limits
- Consider caching generated content in your database
- Monitor usage in Google Cloud Console
- Current limits: [Check Gemini API docs](https://ai.google.dev/pricing)

## Safety & Content Filtering

Gemini includes built-in content filters for:
- Harassment
- Hate speech
- Sexually explicit content
- Dangerous content

Prompts that violate these policies will be rejected. The filters are set to `BLOCK_MEDIUM_AND_ABOVE`.
