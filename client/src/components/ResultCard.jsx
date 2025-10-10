import { useState, useEffect } from 'react';
import axios from 'axios';

const ResultCard = ({ result, isLoading, inputs }) => {
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Auto-fetch explanation when result changes
  useEffect(() => {
    if (result && inputs && !explanation) {
      fetchExplanation();
    }
  }, [result, inputs]);
  
  const fetchExplanation = async () => {
    if (!result || !inputs) return;
    
    setExplanationLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/explain', {
        inputs,
        prediction: result,
        maxLength: 300
      });
      
      if (response.data.success) {
        setExplanation(response.data);
        setShowExplanation(true);
      }
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
      // Silently fail - explanation is optional
    } finally {
      setExplanationLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Prediction Result</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Prediction Result</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🩺</div>
          <p className="text-gray-500">Fill in the form and click "Predict Heart Risk" to see your results.</p>
        </div>
      </div>
    );
  }

  // Use riskScore if available, fallback to risk for backward compatibility
  const riskValue = result.riskScore !== undefined ? result.riskScore : result.risk;
  const riskPercentage = Math.round(riskValue * 100);
  
  // Use status/riskLevel and message from API if available
  const riskStatus = result.status || result.riskLevel;
  const riskMessage = result.message;
  
  const getRiskColor = (risk) => {
    if (risk < 0.45) return 'text-green-600';
    if (risk < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (risk) => {
    if (risk < 0.45) return 'bg-green-50 border-green-200';
    if (risk < 0.7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getInterpretation = (risk) => {
    // If API provides message, use it
    if (riskMessage && riskStatus) {
      return {
        status: riskStatus,
        message: riskMessage
      };
    }
    
    // Fallback to local interpretation
    if (risk < 0.45) {
      return {
        status: 'Low Risk',
        message: 'Your heart health indicators suggest a relatively low risk of heart disease. Keep up with healthy lifestyle choices!'
      };
    }
    if (risk < 0.7) {
      return {
        status: 'Moderate Risk',
        message: 'Some risk factors are present. Consider lifestyle improvements and regular checkups with your healthcare provider.'
      };
    }
    return {
      status: 'High Risk',
      message: 'Multiple risk factors detected. Please consult with a healthcare professional for a comprehensive evaluation.'
    };
  };

  const interpretation = getInterpretation(riskValue);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Prediction Result</h2>
      
      {/* Risk Score Display */}
      <div className={`rounded-lg border-2 p-6 mb-6 ${getRiskBgColor(riskValue)}`}>
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${getRiskColor(riskValue)}`}>
            {riskPercentage}%
          </div>
          <div className="text-lg text-gray-700 mb-4">
            Predicted Heart Risk
          </div>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            riskValue < 0.45
              ? 'bg-green-100 text-green-800' 
              : riskValue < 0.7 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {interpretation.status}
          </div>
          {result.usingONNX && (
            <div className="mt-3 text-xs text-gray-500">
              ✨ Powered by ONNX AI Model
            </div>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Interpretation</h3>
        <p className="text-gray-600 leading-relaxed">
          {interpretation.message}
        </p>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Assessment</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Overall Risk Score</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  riskValue < 0.45 ? 'bg-green-500' : riskValue < 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${riskPercentage}%` }}
              ></div>
            </div>
          </div>
          {result.confidence && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Model Confidence</span>
              <span className="text-sm font-medium text-gray-800">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Explanation Section */}
      {(explanation || explanationLoading) && (
        <div className="mb-6">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <span className="font-semibold text-purple-900">AI-Powered Explanation</span>
              {explanation && !explanation.fallback && (
                <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                  {explanation.model_used || 'LLM'}
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-purple-600 transform transition-transform ${showExplanation ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExplanation && (
            <div className="mt-3 p-4 bg-white border border-purple-200 rounded-lg">
              {explanationLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Generating explanation...</span>
                </div>
              ) : explanation ? (
                <>
                  {/* Main Explanation */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{explanation.explanation}</p>
                  </div>

                  {/* Key Contributing Factors */}
                  {explanation.key_factors && explanation.key_factors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="mr-2">🔍</span>
                        Key Contributing Factors:
                      </h4>
                      <ul className="space-y-1">
                        {explanation.key_factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            <span className="text-gray-700 text-sm">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {explanation.recommendations && explanation.recommendations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="mr-2">💡</span>
                        Personalized Recommendations:
                      </h4>
                      <ul className="space-y-1">
                        {explanation.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700 text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  {explanation.summary && (
                    <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm text-purple-900 font-medium">
                        {explanation.summary}
                      </p>
                    </div>
                  )}

                  {/* Processing time indicator */}
                  {explanation.processing_time && (
                    <div className="mt-3 text-xs text-gray-500 text-right">
                      Generated in {explanation.processing_time.toFixed(2)}s
                      {explanation.cached && ' (cached)'}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-400 mr-2">ℹ️</div>
          <div className="text-sm text-blue-800">
            <strong>Important:</strong> This prediction is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare professionals for medical decisions.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          New Prediction
        </button>
        {!showExplanation && !explanationLoading && !explanation && (
          <button
            onClick={fetchExplanation}
            className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Get AI Explanation
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save/Print
        </button>
      </div>
    </div>
  );
};

export default ResultCard;