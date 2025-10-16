# ONNX Model Directory

Place your trained heart disease prediction ONNX model in this directory.

## Model File

**Expected filename:** `best_model.onnx`

## Model Specifications

### Input
- **Name:** `input`
- **Type:** `float32`
- **Shape:** `[1, 11]` (batch size 1, 11 features)

### Features (in order)
1. **Age** (normalized: (age - 50) / 15)
2. **Sex** (encoded: 0=Female, 1=Male)
3. **Chest Pain Type** (encoded: 0=TA, 1=ATA, 2=NAP, 3=ASY)
4. **Resting BP** (normalized: (bp - 130) / 20)
5. **Cholesterol** (normalized: (chol - 200) / 50)
6. **Fasting Blood Sugar** (binary: 0/1)
7. **Resting ECG** (encoded: 0=Normal, 1=ST, 2=LVH)
8. **Max Heart Rate** (normalized: (hr - 140) / 30)
9. **Exercise Angina** (binary: 0/1)
10. **Oldpeak** (normalized: oldpeak / 2)
11. **ST Slope** (encoded: 0=Up, 1=Flat, 2=Down)

### Output
- **Type:** `float32`
- **Shape:** `[1, 1]` or `[1]`
- **Range:** 0.0 to 1.0 (probability of heart disease)

## Training Your Model

If you want to train your own model, you can use the Heart Disease UCI dataset:

### Popular Datasets
1. **Cleveland Heart Disease Dataset** (UCI)
2. **Heart Failure Clinical Records Dataset** (Kaggle)
3. **Framingham Heart Study Dataset**

### Example Training Code (Python + PyTorch)

```python
import torch
import torch.nn as nn
import torch.onnx

class HeartDiseaseModel(nn.Module):
    def __init__(self):
        super(HeartDiseaseModel, self).__init__()
        self.fc1 = nn.Linear(11, 64)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.3)
        self.fc2 = nn.Linear(64, 32)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(32, 1)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu1(x)
        x = self.dropout1(x)
        x = self.fc2(x)
        x = self.relu2(x)
        x = self.dropout2(x)
        x = self.fc3(x)
        x = self.sigmoid(x)
        return x

# After training...
model = HeartDiseaseModel()
model.load_state_dict(torch.load('heart_model.pth'))
model.eval()

# Export to ONNX
dummy_input = torch.randn(1, 11)
torch.onnx.export(
    model,
    dummy_input,
    "best_model.onnx",
    export_params=True,
    opset_version=11,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

print("Model exported to heart_model.onnx")
```

### Example Training Code (TensorFlow/Keras)

```python
import tensorflow as tf
import tf2onnx

# Build your model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(11,)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# Compile and train...
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
# model.fit(X_train, y_train, epochs=50, validation_split=0.2)

# Convert to ONNX
spec = (tf.TensorSpec((None, 11), tf.float32, name="input"),)
output_path = "best_model.onnx"

model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=13)

with open(output_path, "wb") as f:
    f.write(model_proto.SerializeToString())

print(f"Model exported to {output_path}")
```

## Fallback Behavior

If no ONNX model is found, the application will automatically use a mock prediction algorithm based on clinical guidelines and risk factor analysis.

## Verifying Your Model

Test your model works with ONNX Runtime:

```python
import onnxruntime as ort
import numpy as np

# Load session
session = ort.InferenceSession("best_model.onnx")

# Test input (normalized features)
test_input = np.array([[0.5, 1, 2, 0.3, 0.4, 1, 0, 0.2, 1, 0.5, 1]], dtype=np.float32)

# Run inference
outputs = session.run(None, {"input": test_input})
print(f"Prediction: {outputs[0][0]}")  # Should be between 0 and 1
```

## Model Performance Tips

1. **Normalization:** Ensure training normalization matches the preprocessing in `predictONNX.js`
2. **Class Balance:** Use techniques like SMOTE if dataset is imbalanced
3. **Validation:** Always validate on a held-out test set
4. **Cross-validation:** Use k-fold cross-validation for robust evaluation
5. **Feature Engineering:** Consider additional derived features

## Resources

- [ONNX Documentation](https://onnx.ai/)
- [ONNX Runtime Node.js](https://onnxruntime.ai/docs/get-started/with-javascript.html)
- [UCI Heart Disease Dataset](https://archive.ics.uci.edu/ml/datasets/heart+disease)
- [PyTorch to ONNX Guide](https://pytorch.org/docs/stable/onnx.html)
- [TensorFlow to ONNX Guide](https://github.com/onnx/tensorflow-onnx)

---

**Note:** Until you add your own model, Cardia will use the fallback mock prediction algorithm.
