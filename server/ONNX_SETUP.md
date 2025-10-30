# 🩺 ONNX Model Integration Guide for Cardia

> Last updated: 2025-10-30

This guide explains how to integrate your trained heart disease prediction ONNX model with the Cardia backend.

## 📋 Prerequisites

- Trained ONNX model file (`best_model.onnx`)
- Feature column order from your training notebook
- Node.js and npm installed
- Dependencies: `onnxruntime-node` (already installed via package.json)

---

## 🚀 Quick Setup

### Step 1: Export Your Model from Colab/Jupyter

If you trained your model in Google Colab or Jupyter Notebook, export it as follows:

```python
import torch
import torch.onnx

# Example for PyTorch model
model.eval()
dummy_input = torch.randn(1, 11)  # 11 features

torch.onnx.export(
    model,
    dummy_input,
    "best_model.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

# Download the file from Colab
from google.colab import files
files.download('best_model.onnx')
```

For **scikit-learn** models:
```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Define input shape
initial_type = [('float_input', FloatTensorType([None, 11]))]

# Convert model
onnx_model = convert_sklearn(model, initial_types=initial_type)

# Save
with open("best_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

files.download('best_model.onnx')
```

### Step 2: Place Model File

Copy your `best_model.onnx` file to:
```
server/models/best_model.onnx
```

#### Optional: Track the model file in Git

By default, this repo's `.gitignore` excludes `server/models/*.onnx` files. The production model `best_model.onnx` (≈60 KB) has been intentionally tracked for convenience.

To add or update this specific file in Git in the future, force-add it explicitly:

```powershell
# From the repo root
git add -f server/models/best_model.onnx
git commit -m "Update best_model.onnx"
# Push yourself once authenticated
git push origin main
```

This keeps other ONNX artifacts ignored while allowing this one file to be versioned.

### Step 3: Verify Column Order

Check `server/heart_columns.json` and ensure it matches your training data column order:

```json
{
  "columns": [
    "Age",
    "Sex",
    "ChestPainType",
    "RestingBP",
    "Cholesterol",
    "FastingBS",
    "RestingECG",
    "MaxHR",
    "ExerciseAngina",
    "Oldpeak",
    "ST_Slope"
  ]
}
```

**⚠️ CRITICAL:** The order must match exactly how features were arranged during training!

### Step 4: Update Encoding (if needed)

If your model uses different categorical encodings, update the `encoding` section in `heart_columns.json`:

```json
{
  "encoding": {
    "Sex": {
      "M": 1,
      "Male": 1,
      "F": 0,
      "Female": 0
    },
    "ChestPainType": {
      "TA": 0,
      "ATA": 1,
      "NAP": 2,
      "ASY": 3
    }
    // ... other encodings
  }
}
```

### Step 5: Test the API

Restart your server:
```bash
cd server
npm run dev
```

Test with curl or Postman:
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

Expected response:
```json
{
  "success": true,
  "riskScore": 0.78,
  "status": "High Risk",
  "message": "Your predicted heart risk is 78.0%. High risk detected...",
  "confidence": 0.92,
  "usingONNX": true,
  "modelVersion": "2.0.0-onnx"
}
```

---

## 🔍 How It Works

### Request Flow

1. **Frontend** sends patient data via `POST /predict`
2. **Backend** (`predictONNX.js`) receives request
3. **Preprocessing**:
   - Loads column order from `heart_columns.json`
   - Encodes categorical variables (Sex, ChestPainType, etc.)
   - Converts to float array in correct order
4. **ONNX Inference**:
   - Creates Float32 tensor from input array
   - Runs model inference with `onnxruntime-node`
   - Extracts risk probability from output
5. **Response**:
   - Determines risk level (Low/Moderate/High)
   - Generates personalized message
   - Returns JSON to frontend

### File Structure

```
server/
├── index.js                 # Main server (mounts /predict route)
├── heart_columns.json       # Feature order & encoding config
├── models/
│   └── best_model.onnx    # Your trained ONNX model
└── routes/
    └── predictONNX.js      # ONNX inference logic
```

---

## 🐛 Troubleshooting

### Model Not Loading

**Symptom:** API returns mock predictions, console shows:
```
⚠️ ONNX model not found at: ...
⚠️ Using fallback mock prediction
```

**Solution:**
- Verify `best_model.onnx` exists in `server/models/`
- Check file permissions
- Ensure file is not corrupted

### Wrong Predictions

**Symptom:** Predictions don't match expected behavior

**Check:**
1. **Column order** in `heart_columns.json` matches training
2. **Encoding** matches training (e.g., Male=1 vs Male=0)
3. **Normalization**: If your model expects normalized inputs, add normalization back to `preprocessInput()` function
4. **Input tensor name**: Model might use different input name than `'input'`

To check input name:
```javascript
const inputNames = modelSession.inputNames;
console.log('Model input names:', inputNames);
```

### Tensor Shape Mismatch

**Symptom:** `Error: input tensor shape mismatch`

**Solution:**
- Check feature count matches model (default: 11 features)
- Verify input tensor shape is `[1, 11]` (batch_size=1, features=11)

### Runtime Errors

**Symptom:** ONNX runtime crashes or throws errors

**Solution:**
1. Reinstall onnxruntime-node:
   ```bash
   cd server
   npm uninstall onnxruntime-node
   npm install onnxruntime-node@latest
   ```

2. Check ONNX model version compatibility
3. Verify model was exported correctly

---

## 📊 Model Input/Output Format

### Input Tensor
- **Name:** `input` (or check `modelSession.inputNames`)
- **Type:** `float32`
- **Shape:** `[1, 11]` (1 sample, 11 features)
- **Order:** As defined in `heart_columns.json`

### Output Tensor
- **Name:** `output` (or first key in results)
- **Type:** `float32`
- **Shape:** 
  - `[1, 1]` → Binary classification (single probability)
  - `[1, 2]` → Two-class (prob_class0, prob_class1)

The backend automatically handles both formats.

---

## 🎯 Customization

### Adjust Risk Thresholds

Edit `predictONNX.js` around line 180:

```javascript
if (riskScore > 0.7) {        // Change threshold here
  riskLevel = 'High Risk';
} else if (riskScore > 0.45) { // Change threshold here
  riskLevel = 'Moderate Risk';
} else {
  riskLevel = 'Low Risk';
}
```

### Add Normalization

If your model expects normalized inputs, update the `preprocessInput()` function:

```javascript
function preprocessInput(inputData) {
  // ... existing encoding code ...
  
  const features = [
    parseFloat(age),
    sexEncoded,
    // ... other features
  ];

  // Add normalization (example: StandardScaler from training)
  const normalized = [
    (features[0] - 50) / 15,  // Age: (x - mean) / std
    features[1],               // Sex (already 0/1)
    // ... normalize other features
  ];

  return normalized;
}
```

### Change Input Tensor Name

If your model uses a different input name (e.g., `float_input`):

```javascript
// In the inference section of predictONNX.js
const feeds = { float_input: inputTensor }; // Change 'input' to your name
const results = await modelSession.run(feeds);
```

---

## ✅ Verification Checklist

- [ ] `best_model.onnx` placed in `server/models/`
- [ ] `best_model.onnx` tracked in Git (force-added despite ignore)
- [ ] `heart_columns.json` column order matches training
- [ ] Categorical encodings match training data
- [ ] Server starts without ONNX load errors
- [ ] Test prediction returns `"usingONNX": true`
- [ ] Risk scores are reasonable (0-1 range)
- [ ] Frontend displays predictions correctly

---

## 📞 Support

If you encounter issues:

1. Check server console logs for detailed error messages
2. Verify model file integrity (try re-exporting from Colab)
3. Compare column order with your training notebook
4. Test with the mock prediction first to verify API works

---

## 🎉 Success!

Once setup, your Cardia app will use real AI predictions powered by your trained model! 

The API will automatically fall back to mock predictions if the model is unavailable, so the app remains functional during development.
