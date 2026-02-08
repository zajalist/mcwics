/**
 * Image/Video Generation Service
 * Integrates with image generation APIs to create visual content
 * 
 * NOTE: This requires additional API keys for image generation services
 * Recommended: Stability AI, DALL-E, or similar
 */

const IMAGE_API_KEY = import.meta.env.VITE_IMAGE_API_KEY;
const IMAGE_API_PROVIDER = import.meta.env.VITE_IMAGE_API_PROVIDER || 'stability'; // 'stability', 'dalle', or 'replicate'

/**
 * Generate images using the configured provider
 * @param {string} prompt - Description of the image to generate
 * @param {Object} options - Generation options
 * @returns {Promise<Blob>} - Generated image as Blob
 */
export async function generateImage(prompt, options = {}) {
  const {
    width = 1024,
    height = 1024,
    style = 'realistic'
  } = options;

  if (!IMAGE_API_KEY) {
    console.warn('⚠️ No image API key configured. Set VITE_IMAGE_API_KEY in .env file');
    return null;
  }

  try {
    switch (IMAGE_API_PROVIDER.toLowerCase()) {
      case 'stability':
        return await generateWithStabilityAI(prompt, { width, height, style });
      case 'dalle':
        return await generateWithDALLE(prompt, { width, height });
      case 'replicate':
        return await generateWithReplicate(prompt, { width, height, style });
      default:
        throw new Error(`Unknown image provider: ${IMAGE_API_PROVIDER}`);
    }
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Generate image using Stability AI
 */
async function generateWithStabilityAI(prompt, options) {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${IMAGE_API_KEY}`
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: options.height || 1024,
      width: options.width || 1024,
      samples: 1,
      steps: 30,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stability AI error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const imageBase64 = data.artifacts[0].base64;
  
  // Convert base64 to Blob
  const byteString = atob(imageBase64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: 'image/png' });
}

/**
 * Generate image using DALL-E (OpenAI)
 */
async function generateWithDALLE(prompt, options) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${IMAGE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      n: 1,
      size: `${options.width}x${options.height}`,
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const imageBase64 = data.data[0].b64_json;
  
  // Convert base64 to Blob
  const byteString = atob(imageBase64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: 'image/png' });
}

/**
 * Generate image using Replicate
 */
async function generateWithReplicate(prompt, options) {
  // First, create a prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${IMAGE_API_KEY}`
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        prompt: prompt,
        width: options.width,
        height: options.height
      }
    })
  });

  if (!createResponse.ok) {
    throw new Error('Replicate create prediction failed');
  }

  const prediction = await createResponse.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        'Authorization': `Token ${IMAGE_API_KEY}`
      }
    });
    
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('Image generation failed');
  }

  // Download the image
  const imageUrl = result.output[0];
  const imageResponse = await fetch(imageUrl);
  return await imageResponse.blob();
}

/**
 * Generate multiple images based on descriptions
 * @param {Array<string>} descriptions - Array of image descriptions
 * @param {Object} options - Generation options
 * @returns {Promise<Array<Blob>>} - Array of generated images
 */
export async function generateMultipleImages(descriptions, options = {}) {
  const images = [];
  
  for (const description of descriptions) {
    try {
      const image = await generateImage(description, options);
      if (image) {
        images.push(image);
      }
    } catch (error) {
      console.error(`Failed to generate image for: "${description}"`, error);
      images.push(null);
    }
  }
  
  return images;
}

/**
 * Generate placeholder images (for testing without API key)
 * Creates simple colored rectangles with text
 */
export function generatePlaceholderImage(text, width = 1024, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  // Random background color
  const hue = Math.floor(Math.random() * 360);
  ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
  ctx.fillRect(0, 0, width, height);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Wrap text
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 100 && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);
  
  // Draw lines
  const lineHeight = 60;
  const startY = (height - (lines.length * lineHeight)) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line.trim(), width / 2, startY + (i * lineHeight));
  });
  
  // Convert to Blob
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}
