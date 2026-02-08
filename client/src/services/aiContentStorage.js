/**
 * AI Content Storage Service
 * Handles storing and retrieving AI-generated content (text, images, etc.)
 */

import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadString, 
  uploadBytes,
  getDownloadURL 
} from 'firebase/storage';

/**
 * Store AI-generated text content in Firestore
 * @param {string} scenarioId - ID of the scenario
 * @param {string} nodeId - ID of the node (AI node or puzzle node)
 * @param {Object} content - Generated content
 * @returns {Promise<string>} - Document ID
 */
export async function storeAITextContent(scenarioId, nodeId, content) {
  try {
    const contentId = `${scenarioId}_${nodeId}_${Date.now()}`;
    const contentRef = doc(db, 'ai_content', contentId);
    
    const contentDoc = {
      id: contentId,
      scenarioId,
      nodeId,
      type: 'text',
      content: {
        story: content.story || null,
        puzzles: content.puzzles || null,
        roleClues: content.roleClues || null,
        choices: content.choices || null,
        rawText: content.rawText || null,
      },
      generatedAt: serverTimestamp(),
      prompt: content.prompt || '',
    };

    await setDoc(contentRef, contentDoc);
    console.log('✅ AI text content stored:', contentId);
    return contentId;
  } catch (error) {
    console.error('❌ Error storing AI text content:', error);
    throw error;
  }
}

/**
 * Store AI-generated image in Firebase Storage
 * @param {string} scenarioId - ID of the scenario
 * @param {string} nodeId - ID of the node
 * @param {Blob|File|string} imageData - Image data (File, Blob, or base64 string)
 * @param {string} imageName - Name for the image
 * @returns {Promise<string>} - Public URL of the stored image
 */
export async function storeAIImage(scenarioId, nodeId, imageData, imageName = 'generated') {
  try {
    const timestamp = Date.now();
    const fileName = `${imageName}_${timestamp}.png`;
    const imagePath = `ai-generated/${scenarioId}/${nodeId}/${fileName}`;
    const imageRef = ref(storage, imagePath);

    let uploadResult;
    
    // Handle different data types
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Base64 data URL
      uploadResult = await uploadString(imageRef, imageData, 'data_url');
    } else if (imageData instanceof Blob || imageData instanceof File) {
      // File or Blob
      uploadResult = await uploadBytes(imageRef, imageData);
    } else {
      throw new Error('Invalid image data format');
    }

    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Store metadata in Firestore
    const metadataId = `${scenarioId}_${nodeId}_img_${timestamp}`;
    const metadataRef = doc(db, 'ai_content', metadataId);
    await setDoc(metadataRef, {
      id: metadataId,
      scenarioId,
      nodeId,
      type: 'image',
      url: downloadURL,
      path: imagePath,
      generatedAt: serverTimestamp(),
    });

    console.log('✅ AI image stored:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error storing AI image:', error);
    throw error;
  }
}

/**
 * Get AI-generated content for a specific node
 * @param {string} scenarioId - ID of the scenario
 * @param {string} nodeId - ID of the node
 * @returns {Promise<Array>} - Array of content documents
 */
export async function getAIContentForNode(scenarioId, nodeId) {
  try {
    const contentQuery = query(
      collection(db, 'ai_content'),
      where('scenarioId', '==', scenarioId),
      where('nodeId', '==', nodeId)
    );
    
    const snapshot = await getDocs(contentQuery);
    const contents = [];
    
    snapshot.forEach(doc => {
      contents.push({ id: doc.id, ...doc.data() });
    });
    
    return contents;
  } catch (error) {
    console.error('❌ Error fetching AI content:', error);
    return [];
  }
}

/**
 * Get all AI-generated content for a scenario
 * @param {string} scenarioId - ID of the scenario
 * @returns {Promise<Array>} - Array of content documents
 */
export async function getAllAIContentForScenario(scenarioId) {
  try {
    const contentQuery = query(
      collection(db, 'ai_content'),
      where('scenarioId', '==', scenarioId)
    );
    
    const snapshot = await getDocs(contentQuery);
    const contents = [];
    
    snapshot.forEach(doc => {
      contents.push({ id: doc.id, ...doc.data() });
    });
    
    return contents;
  } catch (error) {
    console.error('❌ Error fetching AI content:', error);
    return [];
  }
}

/**
 * Check if content was already generated (cache check)
 * @param {string} scenarioId - ID of the scenario
 * @param {string} nodeId - ID of the node
 * @param {string} prompt - The prompt used
 * @returns {Promise<Object|null>} - Cached content or null
 */
export async function getCachedAIContent(scenarioId, nodeId, prompt) {
  try {
    const contentQuery = query(
      collection(db, 'ai_content'),
      where('scenarioId', '==', scenarioId),
      where('nodeId', '==', nodeId),
      where('prompt', '==', prompt)
    );
    
    const snapshot = await getDocs(contentQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Return the most recent match
    const docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => (b.generatedAt?.seconds || 0) - (a.generatedAt?.seconds || 0));
    
    console.log('💾 Using cached AI content');
    return docs[0];
  } catch (error) {
    console.error('❌ Error checking cache:', error);
    return null;
  }
}

/**
 * Process and store AI enhancement for a puzzle node
 * @param {string} scenarioId - Scenario ID
 * @param {Object} aiNode - AI node data
 * @param {Object} targetNode - Target puzzle node data
 * @returns {Promise<Object>} - Enhancement result with new content and URLs
 */
export async function processAndStoreAIEnhancement(scenarioId, aiNode, targetNode) {
  const { enhancePuzzleContent } = await import('./ai/geminiService');
  const { generateImage, generatePlaceholderImage } = await import('./ai/imageGeneration');
  
  const aiConfig = aiNode.data.aiConfig || {};
  const prompt = aiConfig.prompt;
  const enhances = aiConfig.enhances || [];
  
  if (!prompt) {
    throw new Error('No prompt configured for AI node');
  }
  
  // Check cache first
  const cached = await getCachedAIContent(scenarioId, aiNode.id, prompt);
  if (cached && cached.content) {
    return {
      cached: true,
      contentId: cached.id,
      enhancedContent: cached.content.enhanced || {},
      imageUrls: cached.content.imageUrls || []
    };
  }
  
  // Get existing content from target node
  const existingContent = {
    story: targetNode.data?.story || { title: '', text: '', narrationText: '' },
    puzzles: targetNode.data?.puzzles || [],
    roleClues: targetNode.data?.roleClues || [],
    location: targetNode.data?.location || ''
  };
  
  // Enhance with AI
  const enhanced = await enhancePuzzleContent(aiConfig, existingContent);
  
  // Generate images if requested
  const imageUrls = [];
  if (enhances.includes('addImages') && enhanced.imageDescriptions && enhanced.imageDescriptions.length > 0) {
    for (let i = 0; i < enhanced.imageDescriptions.length; i++) {
      const desc = enhanced.imageDescriptions[i];
      try {
        // Try to generate real image (requires API key)
        let imageBlob;
        try {
          imageBlob = await generateImage(desc);
        } catch (err) {
          // Fallback to placeholder if no API key
          console.warn('Using placeholder image - configure VITE_IMAGE_API_KEY for real images');
          imageBlob = await generatePlaceholderImage(desc);
        }
        
        if (imageBlob) {
          const url = await storeAIImage(
            scenarioId,
            aiNode.id,
            imageBlob,
            `enhanced_${i}`
          );
          imageUrls.push(url);
        }
      } catch (error) {
        console.error('Failed to generate image:', error);
      }
    }
  }
  
  // Store the enhancement
  const contentId = await storeAITextContent(
    scenarioId,
    aiNode.id,
    {
      enhanced: enhanced,
      imageUrls: imageUrls,
      prompt: prompt,
      targetNodeId: targetNode.id
    }
  );
  
  return {
    cached: false,
    contentId,
    enhancedContent: enhanced,
    imageUrls
  };
}

/**
 * Delete AI content for a scenario (cleanup)
 * @param {string} scenarioId - Scenario ID
 */
export async function deleteAIContentForScenario(scenarioId) {
  try {
    const contentQuery = query(
      collection(db, 'ai_content'),
      where('scenarioId', '==', scenarioId)
    );
    
    const snapshot = await getDocs(contentQuery);
    const deletePromises = [];
    
    snapshot.forEach(doc => {
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log('🗑️ AI content deleted for scenario:', scenarioId);
  } catch (error) {
    console.error('❌ Error deleting AI content:', error);
  }
}
