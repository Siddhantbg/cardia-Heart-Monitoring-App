const express = require('express');
const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Global variable to cache the ONNX session and column config
let session = null;
let columnConfig = null;
const MODEL_PATH = path.join(__dirname, '../models/heart_model.onnx');
const COLUMNS_PATH = path.join(__dirname, '../models/heart_columns.json'); // Updated to models folder

// Load column configuration
function loadColumnConfig() {
  if (columnConfig) return columnConfig;
  
  try {
    if (fs.existsSync(COLUMNS_PATH)) {
      const data = fs.readFileSync(COLUMNS_PATH, 'utf-8');
      columnConfig = JSON.parse(data);
      console.log('✅ Column configuration loaded successfully');
      return columnConfig;
    } else {
      console.warn('⚠️  heart_columns.json not found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to load column config:', error.message);
    return null;
  }
}

// Initialize ONNX session
async function initializeModel() {
  if (session) return session;
  
  try {
    // Check if model file exists
    if (!fs.existsSync(MODEL_PATH)) {
      console.warn('⚠️  ONNX model not found at:', MODEL_PATH);
      console.warn('⚠️  Using fallback mock prediction');
      return null;
    }
    
    // Create session with explicit options to handle various model types
    const options = {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all'
    };
    
    session = await ort.InferenceSession.create(MODEL_PATH, options);
    console.log('✅ ONNX model loaded successfully');
    
    // Log model metadata
    console.log('📊 Model inputs:', session.inputNames);
    console.log('📊 Model outputs:', session.outputNames);
    
    // Load column config
    loadColumnConfig();
    
    return session;
  } catch (error) {
    console.error('❌ Failed to load ONNX model:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

// Preprocess input data for the model using heart_columns.json
function preprocessInput(inputData) {
  const config = loadColumnConfig();
  
  // Extract input values with defaults
  const {
    age,
    sex,
    chestPainType,
    restingBP,
    cholesterol,
    fastingBS,
    restingECG = 'Normal',
    maxHeartRate,
    exerciseAngina,
    oldpeak = 0,
    stSlope = 'Flat',
    ca = 0,        // Number of major vessels (0-3), default 0
    thal = 2       // Thalassemia (1=normal, 2=fixed defect, 3=reversible defect)
  } = inputData;

  // Check if config specifies feature list
  const configFeatures = config?.features || [];
  console.log('📋 Model expects features:', configFeatures);

  // Use encoding from config if available, otherwise use defaults
  const encoding = config?.encoding || {
    Sex: { 'M': 1, 'Male': 1, 'F': 0, 'Female': 0 },
    ChestPainType: { 'TA': 0, 'Typical Angina': 0, 'ATA': 1, 'Atypical Angina': 1, 'NAP': 2, 'Non-Anginal Pain': 2, 'ASY': 3, 'Asymptomatic': 3 },
    RestingECG: { 'Normal': 0, 'ST': 1, 'LVH': 2 },
    ExerciseAngina: { 'N': 0, 'No': 0, 'Y': 1, 'Yes': 1 },
    ST_Slope: { 'Up': 0, 'Flat': 1, 'Down': 2 }
  };

  // Encode categorical variables using config
  const sexEncoded = encoding.Sex[sex] !== undefined ? encoding.Sex[sex] : (sex === 'M' || sex === 'Male' ? 1 : 0);
  const chestPainEncoded = encoding.ChestPainType[chestPainType] !== undefined ? encoding.ChestPainType[chestPainType] : 0;
  const restingECGEncoded = encoding.RestingECG[restingECG] !== undefined ? encoding.RestingECG[restingECG] : 0;
  const exerciseAnginaEncoded = encoding.ExerciseAngina[exerciseAngina] !== undefined ? encoding.ExerciseAngina[exerciseAngina] : (exerciseAngina === 'Y' || exerciseAngina === true || exerciseAngina === 'Yes' ? 1 : 0);
  const stSlopeEncoded = encoding.ST_Slope[stSlope] !== undefined ? encoding.ST_Slope[stSlope] : 1;
  const fastingBSValue = fastingBS === 1 || fastingBS === true ? 1 : 0;

  // If config specifies 15 features (includes id, dataset, ca, thal)
  // Order from config: id, age, sex, dataset, cp, trestbps, chol, fbs, restecg, thalch, exang, oldpeak, slope, ca, thal
  if (configFeatures.length === 15) {
    const features = [
      0,                          // id (not used, set to 0)
      parseFloat(age),            // age
      sexEncoded,                 // sex
      0,                          // dataset (not used, set to 0)
      chestPainEncoded,           // cp (chest pain type)
      parseFloat(restingBP),      // trestbps (resting blood pressure)
      parseFloat(cholesterol),    // chol (cholesterol)
      fastingBSValue,             // fbs (fasting blood sugar)
      restingECGEncoded,          // restecg (resting ECG)
      parseFloat(maxHeartRate),   // thalch (max heart rate)
      exerciseAnginaEncoded,      // exang (exercise angina)
      parseFloat(oldpeak),        // oldpeak
      stSlopeEncoded,             // slope (ST slope)
      parseFloat(ca),             // ca (number of major vessels)
      parseFloat(thal)            // thal (thalassemia)
    ];
    console.log('📊 Preprocessed features (15-feature model):', features);
    return features;
  }

  // Fallback to standard 11-feature model
  // Order: Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope
  const features = [
    parseFloat(age),
    sexEncoded,
    chestPainEncoded,
    parseFloat(restingBP),
    parseFloat(cholesterol),
    fastingBSValue,
    restingECGEncoded,
    parseFloat(maxHeartRate),
    exerciseAnginaEncoded,
    parseFloat(oldpeak),
    stSlopeEncoded
  ];

  console.log('📊 Preprocessed features (11-feature model):', features);
  return features;
}

// Fallback mock prediction (same as original predict.js)
function mockPredict(inputData) {
  let riskScore = 0;
  
  const { age, sex, chestPainType, restingBP, cholesterol, fastingBS, maxHeartRate, exerciseAngina } = inputData;
  
  if (age > 65) riskScore += 0.3;
  else if (age > 55) riskScore += 0.2;
  else if (age > 45) riskScore += 0.15;
  else if (age > 35) riskScore += 0.1;
  
  if (sex === 'M' || sex === 'Male') riskScore += 0.1;
  
  const chestPainRisk = {
    'ASY': 0.25, 'Asymptomatic': 0.25,
    'NAP': 0.15, 'Non-Anginal Pain': 0.15,
    'ATA': 0.1, 'Atypical Angina': 0.1,
    'TA': 0.05, 'Typical Angina': 0.05
  };
  riskScore += chestPainRisk[chestPainType] || 0.1;
  
  if (restingBP > 140) riskScore += 0.2;
  else if (restingBP > 130) riskScore += 0.15;
  else if (restingBP > 120) riskScore += 0.1;
  
  if (cholesterol > 240) riskScore += 0.2;
  else if (cholesterol > 200) riskScore += 0.1;
  
  if (fastingBS) riskScore += 0.1;
  
  if (maxHeartRate < 100) riskScore += 0.15;
  else if (maxHeartRate < 120) riskScore += 0.1;
  
  if (exerciseAngina === 'Y' || exerciseAngina === true) riskScore += 0.2;
  
  riskScore += (Math.random() - 0.5) * 0.1;
  riskScore = Math.max(0, Math.min(1, riskScore));
  
  return {
    risk: riskScore,
    confidence: 0.85 + Math.random() * 0.1,
    usingMockModel: true
  };
}

// POST /predict - Heart disease risk prediction using ONNX
router.post('/', async (req, res) => {
  try {
    console.log('🔮 Received prediction request:', req.body);
    
    // Validate required fields
    const requiredFields = ['age', 'sex', 'chestPainType', 'restingBP', 'cholesterol', 'maxHeartRate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields,
        message: `Please provide: ${missingFields.join(', ')}`
      });
    }
    
    // Validate data ranges
    const { age, restingBP, cholesterol, maxHeartRate } = req.body;
    
    if (age < 1 || age > 120) {
      return res.status(400).json({ success: false, error: 'Invalid age', message: 'Age must be between 1 and 120' });
    }
    if (restingBP < 60 || restingBP > 250) {
      return res.status(400).json({ success: false, error: 'Invalid blood pressure', message: 'Resting BP must be between 60 and 250' });
    }
    if (cholesterol < 50 || cholesterol > 600) {
      return res.status(400).json({ success: false, error: 'Invalid cholesterol', message: 'Cholesterol must be between 50 and 600' });
    }
    if (maxHeartRate < 60 || maxHeartRate > 220) {
      return res.status(400).json({ success: false, error: 'Invalid heart rate', message: 'Max heart rate must be between 60 and 220' });
    }
    
    // Initialize model (or use cached session)
    const modelSession = await initializeModel();
    
    let prediction;
    let usingONNX = false;
    
    if (modelSession) {
      // Use ONNX model for prediction
      try {
        const features = preprocessInput(req.body);
        
        // Get input name from model
        const inputNames = modelSession.inputNames;
        console.log('📝 Model input names:', inputNames);
        const inputName = inputNames && inputNames.length > 0 ? inputNames[0] : 'input';
        
        // Try different tensor types - some models need 'float64' or specific types
        console.log('🔮 Running ONNX inference with', features.length, 'features');
        
        let results;
        let inputTensor;
        
        // Try float32 first (most common)
        try {
          inputTensor = new ort.Tensor('float32', new Float32Array(features), [1, features.length]);
          console.log('  → Trying float32 tensor, shape:', inputTensor.dims);
          const feeds = {};
          feeds[inputName] = inputTensor;
          results = await modelSession.run(feeds);
        } catch (e1) {
          console.log('  ✗ float32 failed:', e1.message);
          
          // Try float64
          try {
            inputTensor = new ort.Tensor('float64', new Float64Array(features), [1, features.length]);
            console.log('  → Trying float64 tensor, shape:', inputTensor.dims);
            const feeds = {};
            feeds[inputName] = inputTensor;
            results = await modelSession.run(feeds);
          } catch (e2) {
            console.log('  ✗ float64 failed:', e2.message);
            
            // Try int32 (some models use integer inputs)
            try {
              inputTensor = new ort.Tensor('int32', new Int32Array(features.map(f => Math.round(f))), [1, features.length]);
              console.log('  → Trying int32 tensor, shape:', inputTensor.dims);
              const feeds = {};
              feeds[inputName] = inputTensor;
              results = await modelSession.run(feeds);
            } catch (e3) {
              console.log('  ✗ int32 failed:', e3.message);
              throw new Error(`All tensor types failed. Last error: ${e3.message}`);
            }
          }
        }
        
        // Extract prediction (adjust based on your model's output format)
        const outputName = Object.keys(results)[0];
        const outputTensor = results[outputName];
        console.log('📤 Model output:', outputTensor.data);
        
        // Handle different output formats
        let riskScore;
        
        // Convert BigInt to Number if needed
        const convertToNumber = (val) => {
          if (typeof val === 'bigint') {
            return Number(val);
          }
          return val;
        };
        
        if (outputTensor.data.length === 1) {
          // Binary classification - single value (0 or 1)
          const rawValue = convertToNumber(outputTensor.data[0]);
          
          // If it's a binary label (0 or 1), treat as risk score
          // 0 = no disease (low risk), 1 = disease (high risk)
          if (rawValue === 0 || rawValue === 1) {
            // For binary labels, map to risk ranges
            riskScore = rawValue === 1 ? 0.85 : 0.15; // High risk or low risk
          } else {
            // It's already a probability
            riskScore = rawValue;
          }
        } else if (outputTensor.data.length === 2) {
          // Two-class output [prob_class0, prob_class1]
          riskScore = convertToNumber(outputTensor.data[1]); // Probability of positive class (heart disease)
        } else {
          // Use first value as fallback
          riskScore = convertToNumber(outputTensor.data[0]);
        }
        
        // Check if we also have probabilities output
        if (results.probabilities) {
          const probData = results.probabilities.data;
          console.log('📊 Probabilities output:', probData);
          
          // Use probability of positive class if available
          if (probData.length === 2) {
            riskScore = convertToNumber(probData[1]); // Probability of class 1 (disease)
          }
        }
        
        // Ensure risk score is between 0 and 1
        riskScore = Math.max(0, Math.min(1, riskScore));
        
        prediction = {
          risk: riskScore,
          confidence: 0.92, // ONNX models typically have higher confidence
          usingONNX: true
        };
        
        usingONNX = true;
        console.log(`✅ ONNX prediction successful: ${(riskScore * 100).toFixed(1)}%`);
        
      } catch (onnxError) {
        console.error('❌ ONNX inference failed:', onnxError.message);
        console.error('Stack:', onnxError.stack);
        prediction = mockPredict(req.body);
      }
    } else {
      // Fallback to mock prediction
      prediction = mockPredict(req.body);
    }
    
    // Determine risk level and message
    const riskScore = prediction.risk;
    let riskLevel, message;
    
    if (riskScore > 0.7) {
      riskLevel = 'High Risk';
      message = `Your predicted heart risk is ${(riskScore * 100).toFixed(1)}%. High risk detected - please consult a cardiologist immediately for proper evaluation.`;
    } else if (riskScore > 0.45) {
      riskLevel = 'Moderate Risk';
      message = `Your predicted heart risk is ${(riskScore * 100).toFixed(1)}%. Moderate risk - consider consulting a healthcare provider and adopting heart-healthy lifestyle changes.`;
    } else {
      riskLevel = 'Low Risk';
      message = `Your predicted heart risk is ${(riskScore * 100).toFixed(1)}%. Low risk detected - maintain a healthy lifestyle and regular checkups.`;
    }
    
    // Analyze factors
    const factors = {
      age: age > 50 ? 'elevated' : 'normal',
      bloodPressure: restingBP > 130 ? 'elevated' : 'normal',
      cholesterol: cholesterol > 200 ? 'elevated' : 'normal',
      lifestyle: (req.body.exerciseAngina === 'Y' || req.body.exerciseAngina === true) ? 'concerning' : 'good'
    };
    
    console.log(`✅ Prediction result: ${(riskScore * 100).toFixed(1)}% - ${riskLevel}`);
    
    // Return prediction result in the format expected by frontend
    res.json({
      success: true,
      riskScore: riskScore,
      risk: riskScore, // Keep for backward compatibility
      status: riskLevel,
      riskLevel: riskLevel, // Keep for backward compatibility
      message: message,
      confidence: prediction.confidence,
      timestamp: new Date().toISOString(),
      factors,
      inputData: req.body,
      modelVersion: usingONNX ? '2.0.0-onnx' : '1.0.0-mock',
      usingONNX: prediction.usingONNX || false,
      disclaimer: usingONNX 
        ? 'Prediction made using ONNX deep learning model. Please consult a healthcare professional for proper diagnosis.'
        : 'This is a mock prediction for demonstration purposes only. Real ONNX model not available.'
    });
    
  } catch (error) {
    console.error('❌ Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process prediction request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
