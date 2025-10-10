import { useState, useEffect } from 'react';

const InputForm = ({ onSubmit, isLoading, extractedData }) => {
  const [formData, setFormData] = useState({
    age: '',
    sex: 'Male',
    chestPainType: 'Typical Angina',
    restingBP: '',
    cholesterol: '',
    fastingBS: false,
    maxHeartRate: '',
    exerciseAngina: false
  });

  // Auto-fill form when extracted data is received
  useEffect(() => {
    if (extractedData) {
      setFormData(prev => {
        const updated = { ...prev };
        
        // Map extracted parameters to form fields
        if (extractedData.age) updated.age = extractedData.age;
        if (extractedData.sex) updated.sex = extractedData.sex === 'M' ? 'Male' : 'Female';
        if (extractedData.restingBP) updated.restingBP = extractedData.restingBP;
        if (extractedData.cholesterol) updated.cholesterol = extractedData.cholesterol;
        if (extractedData.fastingBS !== null) updated.fastingBS = extractedData.fastingBS === 1;
        if (extractedData.maxHeartRate) updated.maxHeartRate = extractedData.maxHeartRate;
        if (extractedData.exerciseAngina) updated.exerciseAngina = extractedData.exerciseAngina === 'Y';
        
        // Map chest pain type
        if (extractedData.chestPainType) {
          const chestPainMap = {
            'TA': 'Typical Angina',
            'ATA': 'Atypical Angina',
            'NAP': 'Non-Anginal Pain',
            'ASY': 'Asymptomatic'
          };
          updated.chestPainType = chestPainMap[extractedData.chestPainType] || prev.chestPainType;
        }
        
        return updated;
      });
    }
  }, [extractedData]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    if (!formData.restingBP || formData.restingBP < 60 || formData.restingBP > 250) {
      newErrors.restingBP = 'Resting BP must be between 60 and 250';
    }

    if (!formData.cholesterol || formData.cholesterol < 50 || formData.cholesterol > 600) {
      newErrors.cholesterol = 'Cholesterol must be between 50 and 600';
    }

    if (!formData.maxHeartRate || formData.maxHeartRate < 60 || formData.maxHeartRate > 220) {
      newErrors.maxHeartRate = 'Max Heart Rate must be between 60 and 220';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Medical Parameters</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter age (years)"
            min="1"
            max="120"
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sex *
          </label>
          <select
            value={formData.sex}
            onChange={(e) => handleInputChange('sex', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Chest Pain Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chest Pain Type *
          </label>
          <select
            value={formData.chestPainType}
            onChange={(e) => handleInputChange('chestPainType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Typical Angina">Typical Angina</option>
            <option value="Atypical Angina">Atypical Angina</option>
            <option value="Non-Anginal Pain">Non-Anginal Pain</option>
            <option value="Asymptomatic">Asymptomatic</option>
          </select>
        </div>

        {/* Resting BP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resting Blood Pressure (mmHg) *
          </label>
          <input
            type="number"
            value={formData.restingBP}
            onChange={(e) => handleInputChange('restingBP', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.restingBP ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter resting BP"
            min="60"
            max="250"
          />
          {errors.restingBP && <p className="text-red-500 text-xs mt-1">{errors.restingBP}</p>}
        </div>

        {/* Cholesterol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cholesterol (mg/dL) *
          </label>
          <input
            type="number"
            value={formData.cholesterol}
            onChange={(e) => handleInputChange('cholesterol', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cholesterol ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter cholesterol level"
            min="50"
            max="600"
          />
          {errors.cholesterol && <p className="text-red-500 text-xs mt-1">{errors.cholesterol}</p>}
        </div>

        {/* Fasting Blood Sugar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fasting Blood Sugar &gt; 120 mg/dL
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="fastingBS"
                checked={formData.fastingBS === true}
                onChange={() => handleInputChange('fastingBS', true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fastingBS"
                checked={formData.fastingBS === false}
                onChange={() => handleInputChange('fastingBS', false)}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {/* Max Heart Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Heart Rate Achieved (bpm) *
          </label>
          <input
            type="number"
            value={formData.maxHeartRate}
            onChange={(e) => handleInputChange('maxHeartRate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxHeartRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter max heart rate"
            min="60"
            max="220"
          />
          {errors.maxHeartRate && <p className="text-red-500 text-xs mt-1">{errors.maxHeartRate}</p>}
        </div>

        {/* Exercise Induced Angina */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise-Induced Angina
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="exerciseAngina"
                checked={formData.exerciseAngina === true}
                onChange={() => handleInputChange('exerciseAngina', true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exerciseAngina"
                checked={formData.exerciseAngina === false}
                onChange={() => handleInputChange('exerciseAngina', false)}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Analyzing...' : '🩺 Predict Heart Risk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;