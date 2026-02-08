/**
 * AI Services Index
 * Central export point for all AI-related services
 */

export {
  generateWithGemini,
  listGeminiModels,
  enhancePuzzleContent,
  generateStory,
  generateRoleClues,
  generatePuzzle
} from './geminiService.js';

/**
 * Execute AI enhancement for a connected puzzle node
 * This is called when an AI node is connected to a puzzle node
 * @param {Object} aiNodeData - Data from the AI node
 * @param {Object} targetNodeData - Data from the target puzzle node
 * @returns {Promise<Object>} - Enhanced content to apply to target node
 */
export async function executeAIEnhancement(aiNodeData, targetNodeData, options = {}) {
  const { enhancePuzzleContent } = await import('./geminiService.js');
  
  const aiConfig = aiNodeData.aiConfig || {};
  
  // Pass existing content for enhancement
  const existingContent = {
    story: targetNodeData.story || { title: '', text: '', narrationText: '' },
    puzzles: targetNodeData.puzzles || [],
    roleClues: targetNodeData.roleClues || [],
    location: targetNodeData.location
  };

  try {
    const enhanced = await enhancePuzzleContent(aiConfig, existingContent, options);
    return {
      success: true,
      data: enhanced
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.status
    };
  }
}
