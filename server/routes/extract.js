const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed!'));
    }
  }
});

// Extract text from image using Tesseract OCR
async function extractTextFromImage(filePath) {
  try {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: info => console.log(info)
    });
    return result.data.text;
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

// Parse medical report text to extract parameters
function parsemedicalParameters(text) {
  const params = {
    age: null,
    sex: null,
    chestPainType: null,
    restingBP: null,
    cholesterol: null,
    fastingBS: null,
    restingECG: null,
    maxHeartRate: null,
    exerciseAngina: null,
    oldpeak: null,
    stSlope: null
  };

  // Age extraction (looking for patterns like "Age: 45" or "45 years")
  const ageMatch = text.match(/\b(?:age|Age|AGE)[:\s]*(\d{1,3})|(\d{1,3})\s*(?:years|yrs|y\/o)/i);
  if (ageMatch) {
    params.age = parseInt(ageMatch[1] || ageMatch[2]);
  }

  // Sex/Gender extraction
  const sexMatch = text.match(/\b(?:sex|gender|Sex|Gender)[:\s]*(male|female|M|F)\b/i);
  if (sexMatch) {
    const sex = sexMatch[1].toLowerCase();
    params.sex = (sex === 'male' || sex === 'm') ? 'M' : 'F';
  }

  // Blood Pressure (looking for systolic BP, e.g., "BP: 140/90" or "Blood Pressure 140")
  const bpMatch = text.match(/\b(?:BP|blood\s*pressure)[:\s]*(\d{2,3})(?:\/\d{2,3})?/i);
  if (bpMatch) {
    params.restingBP = parseInt(bpMatch[1]);
  }

  // Cholesterol (looking for "Cholesterol: 250" or "Chol 250 mg/dL")
  const cholMatch = text.match(/\b(?:cholesterol|chol)[:\s]*(\d{2,3})/i);
  if (cholMatch) {
    params.cholesterol = parseInt(cholMatch[1]);
  }

  // Fasting Blood Sugar (looking for "FBS: 120" or "Fasting Sugar 120")
  const fbsMatch = text.match(/\b(?:fasting.*?(?:blood\s*)?sugar|FBS|fasting\s*glucose)[:\s]*(\d{2,3})/i);
  if (fbsMatch) {
    const fbs = parseInt(fbsMatch[1]);
    params.fastingBS = fbs > 120 ? 1 : 0;
  }

  // Max Heart Rate (looking for "Max HR: 150" or "Peak Heart Rate 150")
  const hrMatch = text.match(/\b(?:max.*?heart\s*rate|peak.*?heart\s*rate|max\s*HR)[:\s]*(\d{2,3})/i);
  if (hrMatch) {
    params.maxHeartRate = parseInt(hrMatch[1]);
  }

  // Exercise-induced Angina
  const anginaMatch = text.match(/\b(?:exercise.*?angina|angina.*?exercise)[:\s]*(yes|no|positive|negative)/i);
  if (anginaMatch) {
    const angina = anginaMatch[1].toLowerCase();
    params.exerciseAngina = (angina === 'yes' || angina === 'positive') ? 'Y' : 'N';
  }

  // Oldpeak (ST depression)
  const oldpeakMatch = text.match(/\b(?:ST\s*depression|oldpeak)[:\s]*(\d+\.?\d*)/i);
  if (oldpeakMatch) {
    params.oldpeak = parseFloat(oldpeakMatch[1]);
  }

  // Chest Pain Type (looking for keywords)
  const chestPainKeywords = {
    'typical': 'TA',
    'typical angina': 'TA',
    'atypical': 'ATA',
    'atypical angina': 'ATA',
    'non-anginal': 'NAP',
    'asymptomatic': 'ASY'
  };
  
  for (const [keyword, code] of Object.entries(chestPainKeywords)) {
    if (text.toLowerCase().includes(keyword)) {
      params.chestPainType = code;
      break;
    }
  }

  // Resting ECG
  const ecgMatch = text.match(/\b(?:ECG|resting\s*ECG)[:\s]*(normal|ST-T|LVH)/i);
  if (ecgMatch) {
    const ecgType = ecgMatch[1].toLowerCase();
    if (ecgType.includes('normal')) params.restingECG = 'Normal';
    else if (ecgType.includes('st')) params.restingECG = 'ST';
    else if (ecgType.includes('lvh')) params.restingECG = 'LVH';
  }

  // ST Slope
  const slopeMatch = text.match(/\b(?:ST\s*slope)[:\s]*(up|flat|down)/i);
  if (slopeMatch) {
    const slope = slopeMatch[1].toLowerCase();
    if (slope === 'up') params.stSlope = 'Up';
    else if (slope === 'flat') params.stSlope = 'Flat';
    else if (slope === 'down') params.stSlope = 'Down';
  }

  return params;
}

// POST /extract - Extract medical parameters from uploaded file
router.post('/', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    console.log(`📄 Processing file: ${req.file.originalname}`);

    let extractedText = '';

    // Extract text based on file type
    if (fileExt === '.pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else {
      extractedText = await extractTextFromImage(filePath);
    }

    console.log(`📝 Extracted text length: ${extractedText.length} characters`);

    // Parse extracted text to get medical parameters
    const parameters = parsemedicalParameters(extractedText);

    // Count how many parameters were successfully extracted
    const extractedCount = Object.values(parameters).filter(val => val !== null).length;

    // Clean up uploaded file
    await fs.unlink(filePath);

    res.json({
      success: true,
      extractedText: extractedText.substring(0, 500), // Return first 500 chars for reference
      parameters,
      extractedCount,
      totalFields: Object.keys(parameters).length,
      message: `Successfully extracted ${extractedCount} out of ${Object.keys(parameters).length} parameters`
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract parameters from file'
    });
  }
});

module.exports = router;
