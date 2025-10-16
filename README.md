# 🩺 Cardia - Heart Health Predictor

An AI-powered web application for predicting heart disease risk using the MERN stack.

## 🚀 Phase 2 Features (Current)

- **Medical Parameter Input**: Interactive form with validation & OCR extraction
- **Real ONNX AI Model**: Random Forest model with 89.13% accuracy
- **Data-Backed Interpretation**: Clear, parameter-based interpretation (no external LLM)
- **Real-time Results**: Instant risk assessment with detailed interpretation
- **Responsive Design**: Clean, modern UI with Tailwind CSS
- **Full Stack Architecture**: React frontend + Express backend

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

### Integrated AI Stack
- **ONNX Runtime** for ML inference (Random Forest model)
- **OCR** for medical report parameter extraction

### Future (Phase 3+)
- **MongoDB** for data persistence
- **User authentication & profiles**
- **Historical tracking & analytics**
- **Enhanced data visualization**

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

2. **Start services:**
   ```bash
   # Terminal 1: Backend & Frontend
   npm run dev
   ```

5. **Individual commands:**
   ```bash
   # Frontend only
   npm run client:dev

   # Backend only
   npm run server:dev

   # Production build
   npm run start
   ```

📖 **ONNX model details in [server/ONNX_SETUP.md](server/ONNX_SETUP.md)**

## 📁 Project Structure

```
cardia/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputForm.jsx
│   │   │   └── ResultCard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/
│   │   └── predict.js
│   ├── index.js
│   ├── .env
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔌 API Endpoints

### Base URL: `http://localhost:5000`

#### Health Check
```http
GET /health
```
Returns server status and information.

#### Heart Risk Prediction (ONNX Model)
```http
POST /predict
Content-Type: application/json

{
  "age": 45,
  "sex": "Male",
  "chestPainType": "Typical Angina",
  "restingBP": 130,
  "cholesterol": 200,
  "fastingBS": false,
  "maxHeartRate": 150,
  "exerciseAngina": false
}
```

**Response:**
```json
{
  "success": true,
  "risk": 0.613,
  "riskLevel": "Moderate",
  "confidence": 0.89,
  "timestamp": "2025-01-09T18:00:00.000Z",
  "usingONNX": true,
  "modelVersion": "heart_model.onnx"
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
- **Accuracy**: 89.13%
- **F1 Score**: 0.907
- **ROC AUC**: 0.954
- **Features**: 15 clinical parameters
- **Training**: Scikit-learn → ONNX export
- **Inference**: CPU-based using onnxruntime-node

### Model File
- **Path**: `server/models/best_model.onnx`

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

## 📊 Roadmap

### Phase 2 (✅ Complete)
- [x] ONNX model integration
- [x] Real ML predictions (Random Forest)
- [x] LLM explanation service (microsoft/phi-2)
- [x] OCR medical report extraction
- [x] Enhanced UI with AI insights

### Phase 3 (Advanced Features)
- [ ] MongoDB database setup
- [ ] User authentication & profiles
- [ ] Historical risk tracking
- [ ] Data visualization dashboard
- [ ] PDF report generation
- [ ] GPU acceleration for LLM

### Phase 4 (Production Ready)
- [ ] Docker deployment
- [ ] CI/CD pipeline
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring & logging
- [ ] HIPAA compliance considerations

## ⚠️ Important Disclaimers

- **Educational Purpose**: This application is for educational and demonstration purposes only
- **Not Medical Advice**: Predictions should not replace professional medical consultation
- **Model File**: Ensure `server/models/best_model.onnx` is present
- **Beta Software**: This is a development prototype

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

**Cardia v1.0** - Built with ❤️ using the MERN stack