const express = require('express');
const axios = require('axios');

const router = express.Router();

// LLM service configuration
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const LLM_TIMEOUT = 30000; // 30 seconds

// Cache for explanations (optional - helps reduce LLM calls)
const explanationCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Generate cache key from inputs and prediction
 */
function generateCacheKey(inputs, prediction) {
  const keyData = {
    age: inputs.age,
    sex: inputs.sex,
    restingBP: inputs.restingBP,
    cholesterol: inputs.cholesterol,
    riskScore: Math.round(prediction.riskScore * 100) / 100
  };
  return JSON.stringify(keyData);
}

/**
 * Check if LLM service is available
 */
async function checkLLMService() {
  try {
    const response = await axios.get(`${LLM_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data.model_loaded === true;
  } catch (error) {
    console.error('❌ LLM service not available:', error.message);
    return false;
  }
}

/**
 * POST /explain - Generate LLM explanation for prediction
 */
router.post('/', async (req, res) => {
  try {
    console.log('🤖 Received explanation request');
    
    const { inputs, prediction, useCache = true, maxLength = 300 } = req.body;
    
    // Validate required fields
    if (!inputs || !prediction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both inputs and prediction are required'
      });
    }
    
    // Check cache first
    if (useCache) {
      const cacheKey = generateCacheKey(inputs, prediction);
      const cached = explanationCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log('✅ Returning cached explanation');
        return res.json({
          success: true,
          ...cached.data,
          cached: true
        });
      }
    }
    
    // Call LLM service
    try {
      const llmResponse = await axios.post(
        `${LLM_SERVICE_URL}/explain`,
        {
          inputs,
          prediction,
          include_recommendations: true,
          max_length: maxLength
        },
        {
          timeout: LLM_TIMEOUT,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const explanationData = llmResponse.data;
      
      // Cache the result
      if (useCache) {
        const cacheKey = generateCacheKey(inputs, prediction);
        explanationCache.set(cacheKey, {
          data: explanationData,
          timestamp: Date.now()
        });
      }
      
      console.log(`✅ Generated explanation in ${explanationData.processing_time.toFixed(2)}s`);
      
      return res.json({
        success: true,
        ...explanationData,
        cached: false,
        timestamp: new Date().toISOString()
      });
      
    } catch (llmError) {
      console.error('❌ LLM service error:', llmError.message);
      
      // Return fallback explanation if LLM service fails
      return res.json({
        success: true,
        explanation: generateFallbackExplanation(inputs, prediction),
        key_factors: extractKeyFactors(inputs),
        recommendations: getGenericRecommendations(prediction),
        summary: "This is a fallback explanation. LLM service is currently unavailable.",
        processing_time: 0,
        model_used: "fallback",
        cached: false,
        fallback: true,
        error: llmError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Explanation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate explanation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /health - Check LLM service status
 */
router.get('/health', async (req, res) => {
  try {
    const isAvailable = await checkLLMService();
    
    if (isAvailable) {
      const healthData = await axios.get(`${LLM_SERVICE_URL}/health`);
      return res.json({
        success: true,
        llm_service: 'available',
        ...healthData.data
      });
    } else {
      return res.json({
        success: false,
        llm_service: 'unavailable',
        message: 'LLM service is not responding'
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      llm_service: 'error',
      error: error.message
    });
  }
});

/**
 * Fallback explanation generator (rule-based)
 */
function generateFallbackExplanation(inputs, prediction) {
  const risk = prediction.riskScore || prediction.risk || 0;
  const riskPct = (risk * 100).toFixed(1);
  const status = prediction.status || prediction.riskLevel || 'Unknown';
  
  let explanation = `Based on your medical profile, our AI model has assessed your heart disease risk at ${riskPct}% (${status}). `;
  
  if (risk > 0.7) {
    explanation += "This indicates an elevated risk that warrants immediate medical attention. ";
  } else if (risk > 0.45) {
    explanation += "This suggests moderate risk factors that should be monitored and addressed. ";
  } else {
    explanation += "This indicates relatively lower risk, though continued vigilance is important. ";
  }
  
  explanation += "Several factors from your medical data contribute to this assessment.";
  
  return explanation;
}

/**
 * Extract key risk factors from inputs
 */
function extractKeyFactors(inputs) {
  const factors = [];
  
  if (inputs.age > 55) {
    factors.push(`Age (${inputs.age} years) - Elevated risk factor`);
  }
  
  if (inputs.restingBP > 130) {
    factors.push(`High blood pressure (${inputs.restingBP} mm Hg)`);
  }
  
  if (inputs.cholesterol > 200) {
    factors.push(`Elevated cholesterol (${inputs.cholesterol} mg/dl)`);
  }
  
  if (inputs.exerciseAngina === 'Y' || inputs.exerciseAngina === true) {
    factors.push("Exercise-induced angina present");
  }
  
  if (inputs.fastingBS === 1 || inputs.fastingBS === true) {
    factors.push("Elevated fasting blood sugar");
  }
  
  if (factors.length === 0) {
    factors.push("Multiple cardiovascular risk factors identified");
  }
  
  return factors.slice(0, 3);
}

/**
 * Get generic recommendations based on risk level
 */
function getGenericRecommendations(prediction) {
  const risk = prediction.riskScore || prediction.risk || 0;
  
  const recommendations = [];
  
  if (risk > 0.6) {
    recommendations.push("Schedule an appointment with a cardiologist for comprehensive evaluation");
    recommendations.push("Consider cardiac stress testing and advanced screening");
  } else {
    recommendations.push("Consult with your healthcare provider about your cardiovascular health");
  }
  
  recommendations.push("Adopt a heart-healthy diet rich in fruits, vegetables, and whole grains");
  recommendations.push("Engage in regular aerobic exercise (30 minutes, 5 days per week)");
  recommendations.push("Monitor blood pressure and cholesterol levels regularly");
  
  return recommendations.slice(0, 3);
}

/**
 * Clear explanation cache (useful for testing)
 */
router.post('/clear-cache', (req, res) => {
  const size = explanationCache.size;
  explanationCache.clear();
  res.json({
    success: true,
    message: `Cleared ${size} cached explanations`
  });
});

module.exports = router;
