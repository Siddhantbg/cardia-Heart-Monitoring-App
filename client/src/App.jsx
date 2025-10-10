import { useState } from 'react';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import InputForm from './components/InputForm';
import ResultCard from './components/ResultCard';
import FileUpload from './components/FileUpload';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [lastInputs, setLastInputs] = useState(null);

  const handleExtractSuccess = (parameters) => {
    setExtractedData(parameters);
    setError(null);
  };

  const handlePrediction = async (formData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      setResult(response.data);
      setLastInputs(formData);
    } catch (err) {
      console.error('Prediction error:', err);
      
      if (err.code === 'ECONNREFUSED') {
        setError('Unable to connect to the server. Please make sure the backend is running on port 5000.');
      } else if (err.response) {
        setError(`Server error: ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🩺 Cardia
              </h1>
              <span className="ml-3 text-lg text-gray-600">
                Heart Health Predictor
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Phase 2 - AI Enhanced
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">⚠️</div>
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload */}
          <div className="lg:col-span-1">
            <FileUpload onExtractSuccess={handleExtractSuccess} />
            
            {/* Extracted Data Preview */}
            {extractedData && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ Extracted Parameters</h4>
                <div className="text-sm space-y-1 text-green-800">
                  {Object.entries(extractedData).map(([key, value]) => 
                    value !== null && (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Input Form */}
          <div className="lg:col-span-1">
            <InputForm 
              onSubmit={handlePrediction} 
              isLoading={isLoading}
              extractedData={extractedData}
            />
          </div>

          {/* Right Column - Result Card */}
          <div className="lg:col-span-1">
            <ResultCard result={result} isLoading={isLoading} inputs={lastInputs} />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">�</div>
              <h3 className="font-semibold mb-2">1. Upload Report</h3>
              <p className="text-gray-600 text-sm">
                Upload your medical report (PDF or image) and let OCR extract parameters automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-semibold mb-2">2. Review & Edit</h3>
              <p className="text-gray-600 text-sm">
                Review extracted data and manually adjust any parameters if needed before prediction.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">3. AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our ONNX deep learning model analyzes your data to predict heart disease risk.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">4. Get Results</h3>
              <p className="text-gray-600 text-sm">
                Receive a detailed risk assessment with interpretation and health recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p>&copy; 2025 Cardia. All rights reserved.</p>
              <p className="text-sm text-gray-400 mt-1">
                Educational purposes only. Not a substitute for professional medical advice.
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <p>Phase 2 - AI Enhanced</p>
              <p>OCR + ONNX + MERN</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
