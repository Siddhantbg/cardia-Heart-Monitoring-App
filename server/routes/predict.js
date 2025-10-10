const express = require('express');
const router = express.Router();

// Mock prediction function
const mockPredict = (inputData) => {
  // Simulate a more sophisticated prediction algorithm
  let riskScore = 0;
  
  const { age, sex, chestPainType, restingBP, cholesterol, fastingBS, maxHeartRate, exerciseAngina } = inputData;
  
  // Age factor (higher age = higher risk)
  if (age > 65) riskScore += 0.3;
  else if (age > 55) riskScore += 0.2;
  else if (age > 45) riskScore += 0.15;
  else if (age > 35) riskScore += 0.1;
  
  // Gender factor (males generally higher risk)
  if (sex === 'Male') riskScore += 0.1;
  
  // Chest pain type factor
  switch (chestPainType) {
    case 'Asymptomatic':
      riskScore += 0.25;
      break;
    case 'Non-Anginal Pain':
      riskScore += 0.15;
      break;
    case 'Atypical Angina':
      riskScore += 0.1;
      break;
    case 'Typical Angina':
      riskScore += 0.05;
      break;
  }
  
  // Blood pressure factor
  if (restingBP > 140) riskScore += 0.2;
  else if (restingBP > 130) riskScore += 0.15;
  else if (restingBP > 120) riskScore += 0.1;
  
  // Cholesterol factor
  if (cholesterol > 240) riskScore += 0.2;
  else if (cholesterol > 200) riskScore += 0.1;
  
  // Fasting blood sugar factor
  if (fastingBS) riskScore += 0.1;
  
  // Max heart rate factor (lower rate can indicate problems)
  if (maxHeartRate < 100) riskScore += 0.15;
  else if (maxHeartRate < 120) riskScore += 0.1;
  
  // Exercise angina factor
  if (exerciseAngina) riskScore += 0.2;
  
  // Add some realistic randomness
  riskScore += (Math.random() - 0.5) * 0.1;
  
  // Ensure score is between 0 and 1
  riskScore = Math.max(0, Math.min(1, riskScore));
  
  return {
    risk: riskScore,
    confidence: 0.85 + Math.random() * 0.1, // Random confidence between 85-95%
    timestamp: new Date().toISOString(),
    factors: {
      age: age > 50 ? 'elevated' : 'normal',
      bloodPressure: restingBP > 130 ? 'elevated' : 'normal',
      cholesterol: cholesterol > 200 ? 'elevated' : 'normal',
      lifestyle: exerciseAngina ? 'concerning' : 'good'
    }
  };
};

// POST /predict - Heart disease risk prediction
router.post('/', async (req, res) => {
  try {
    console.log('Received prediction request:', req.body);
    
    // Validate required fields
    const requiredFields = ['age', 'sex', 'chestPainType', 'restingBP', 'cholesterol', 'maxHeartRate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields,
        message: `Please provide: ${missingFields.join(', ')}`
      });
    }
    
    // Validate data types and ranges
    const { age, restingBP, cholesterol, maxHeartRate } = req.body;
    
    if (age < 1 || age > 120) {
      return res.status(400).json({
        error: 'Invalid age',
        message: 'Age must be between 1 and 120'
      });
    }
    
    if (restingBP < 60 || restingBP > 250) {
      return res.status(400).json({
        error: 'Invalid blood pressure',
        message: 'Resting BP must be between 60 and 250'
      });
    }
    
    if (cholesterol < 50 || cholesterol > 600) {
      return res.status(400).json({
        error: 'Invalid cholesterol',
        message: 'Cholesterol must be between 50 and 600'
      });
    }
    
    if (maxHeartRate < 60 || maxHeartRate > 220) {
      return res.status(400).json({
        error: 'Invalid heart rate',
        message: 'Max heart rate must be between 60 and 220'
      });
    }
    
    // Simulate processing delay (real model inference would take time)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Get prediction from mock model
    const prediction = mockPredict(req.body);
    
    console.log('Prediction result:', prediction);
    
    // Return prediction result
    res.json({
      success: true,
      ...prediction,
      inputData: req.body,
      modelVersion: '1.0.0-mock',
      disclaimer: 'This is a mock prediction for demonstration purposes only.'
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process prediction request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;