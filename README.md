# 🩺 Cardia - Heart Health Predictor

> Last updated: 2025-11-04

An AI-powered web application for predicting heart disease risk using ONNX machine learning and the MERN stack.

## 🚀 Current Features

- **Medical Parameter Input**: Interactive form with validation
- **ONNX AI Model**: Trained Random Forest model (`best_model.onnx`, ~60 KB)
- **Real-time Predictions**: Instant risk assessment with confidence scores
- **Risk Interpretation**: Clear, data-driven risk level categorization
- **OCR Extraction**: Extract parameters from medical reports (PDF/images)
- **Responsive Design**: Clean, modern UI with Tailwind CSS
- **Full Stack Architecture**: React + Vite frontend, Express backend

## 📱 Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Responsive Design** for all devices

### Backend
- **Node.js** with Express.js
- **CORS** enabled for cross-origin requests
- **RESTful API** design
- **Error handling** and validation

### AI & ML
- **ONNX Runtime Node** (`onnxruntime-node`) for fast CPU inference
- **Trained Random Forest Model** (`best_model.onnx`)
- **OCR** for medical report parameter extraction

### Future Enhancements
- **MongoDB** for data persistence
- **User authentication & profiles**
- **Historical tracking & analytics**
- **Enhanced data visualization**
- **GPU acceleration** for larger models

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd cardia
   npm run install:all
   ```

2. **Ensure model file exists:**
   ```bash
   # Verify best_model.onnx is present (~60 KB)
   ls server/models/best_model.onnx
   ```

3. **Start services:**
   ```bash
   # PowerShell: Start both backend & frontend
   npm run dev
   
   # Or start individually:
   cd server; npm run dev   # Backend on port 5000
   cd client; npm run dev   # Frontend on port 5173
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

📖 **Full ONNX setup guide: [server/ONNX_SETUP.md](server/ONNX_SETUP.md)**

## 📁 Project Structure

```
cardia-Heart-Monitoring-App/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputForm.jsx    # Patient data input form
│   │   │   ├── ResultCard.jsx   # Risk display component
│   │   │   └── FileUpload.jsx   # OCR medical report upload
│   │   ├── App.jsx              # Main application
│   │   └── main.jsx
│   ├── tailwind.config.cjs
│   └── package.json
├── server/                      # Express backend
│   ├── routes/
│   │   ├── predictONNX.js       # ONNX inference endpoint
│   │   └── extract.js           # OCR extraction endpoint
│   ├── models/
│   │   ├── best_model.onnx      # Trained Random Forest (60KB)
│   │   └── heart_columns.json   # Feature order & encodings
│   ├── index.js                 # Server entry point
│   ├── .env                     # Environment config
│   ├── ONNX_SETUP.md            # Model integration guide
│   └── package.json
├── package.json                 # Root scripts
└── README.md
```

## 🔌 API Endpoints

### Base URL: `http://localhost:5000`

#### Health Check
```http
GET /health
```
Returns server status and uptime.

#### Heart Risk Prediction (ONNX Model)
```http
POST /predict
Content-Type: application/json

{
  "age": 55,
  "sex": "M",
  "chestPainType": "ASY",
  "restingBP": 140,
  "cholesterol": 240,
  "fastingBS": 1,
  "restingECG": "Normal",
  "maxHeartRate": 130,
  "exerciseAngina": "Y",
  "oldpeak": 2.5,
  "stSlope": "Flat"
}
```

**Response:**
```json
{
  "success": true,
  "riskScore": 0.78,
  "status": "High Risk",
  "message": "Multiple risk factors detected. Please consult with a healthcare professional...",
  "confidence": 0.92,
  "usingONNX": true,
  "modelVersion": "2.0.0-onnx"
}
```


#### OCR Extraction
```http
POST /extract
Content-Type: multipart/form-data

file: <medical_report.pdf or image>
```

**Response:**
```json
{
  "success": true,
  "parameters": {
    "age": 45,
    "restingBP": 130,
    "cholesterol": 250,
    ...
  }
}
```

## 🎯 Usage Guide

### 1. Fill Medical Parameters
- **Age**: Enter age in years (1-120)
- **Sex**: Select Male or Female
- **Chest Pain Type**: Choose from 4 types
- **Resting BP**: Blood pressure in mmHg (60-250)
- **Cholesterol**: Level in mg/dL (50-600)
- **Fasting Blood Sugar**: Yes/No for >120 mg/dL
- **Max Heart Rate**: Maximum achieved (60-220)
- **Exercise Angina**: Yes/No for exercise-induced

### 2. Get Prediction
- Click "🩺 Predict Heart Risk"
- Wait for analysis (1-2 seconds)
- View risk percentage and interpretation

### 3. Interpret Results
- **Low Risk (0-29%)**: Green - Good heart health indicators
- **Moderate Risk (30-69%)**: Yellow - Some risk factors present
- **High Risk (70-100%)**: Red - Multiple risk factors detected

## 🧠 AI Model Details

### ONNX Random Forest Model
- **Model**: `best_model.onnx` (~60 KB)
- **Type**: Random Forest Classifier
- **Features**: 11 clinical parameters (Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope)
- **Training**: Scikit-learn → ONNX export
- **Inference**: CPU-based via `onnxruntime-node`
- **Performance**: High accuracy on heart disease dataset

### How Predictions Work
1. **Input preprocessing**: Categorical features encoded (Sex, ChestPainType, etc.)
2. **Feature ordering**: Matches training column order from `heart_columns.json`
3. **ONNX inference**: Model runs on Float32 tensor `[1, 11]`
4. **Risk score**: Output probability (0-1) mapped to risk level
5. **Interpretation**: Low (<0.45), Moderate (0.45-0.7), High (>0.7)

### Model File Location
- **Path**: `server/models/best_model.onnx`
- **Tracked in Git**: Force-added despite `.gitignore` (see [ONNX_SETUP.md](server/ONNX_SETUP.md))

## 🔧 Configuration

### Environment Variables (server/.env)
```env
NODE_ENV=development
PORT=5000
API_VERSION=1.0.0
MAX_PREDICTION_REQUESTS_PER_MINUTE=30
```

### Frontend Configuration
- **Vite Config**: Standard React setup
- **Tailwind Config**: Configured for all JSX files
- **API Base URL**: http://localhost:5000

## 🚦 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start frontend only
npm run client:dev

# Start backend only  
npm run server:dev

# Build for production
npm run client:build

# Clean node_modules
npm run clean
```

## 📊 Development Status

### Current (v1.0 - ONNX-Only)
- ✅ ONNX model integration (`best_model.onnx`)
- ✅ Real ML predictions (Random Forest)
- ✅ OCR medical report extraction
- ✅ Responsive UI with risk visualization
- ✅ Full MERN stack operational
- ✅ Documentation & setup guides

### Future Enhancements
- [ ] MongoDB database for persistence
- [ ] User authentication & profiles
- [ ] Historical risk tracking & trends
- [ ] Enhanced data visualizations
- [ ] PDF report generation
- [ ] Additional ML models (ensemble)
- [ ] Docker deployment
- [ ] CI/CD pipeline
- [ ] Production security hardening

## ⚠️ Important Disclaimers

- **Educational Purpose Only**: This application is for educational and demonstration purposes
- **Not Medical Advice**: Predictions are NOT a substitute for professional medical consultation
- **Always Consult Healthcare Providers**: Any health decisions should involve qualified medical professionals
- **Model File Required**: Ensure `server/models/best_model.onnx` exists before starting the server
- **Development Prototype**: This is a demonstration application, not a production medical tool

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Cardia v1.0 (ONNX-Only)** - Built with ❤️ using React, Express, and ONNX Runtime