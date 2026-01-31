import os
import json
import numpy as np
from tensorflow import keras
import pickle

class CropRecommendationModel:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), 'crop_recommendation_model.keras')
        params_path = os.path.join(os.path.dirname(__file__), 'crop_params.json')
        encoder_path = os.path.join(os.path.dirname(__file__), 'crop_label_encoder.pkl')
        
        self.model = None
        self.params = None
        self.label_encoder = None
        self.is_trained = False
        
        try:
            if os.path.exists(model_path):
                self.model = keras.models.load_model(model_path)
                print(f"Loaded crop recommendation model from {model_path}")
            else:
                print(f"Model file not found: {model_path}")
                
            if os.path.exists(params_path):
                with open(params_path, 'r') as f:
                    self.params = json.load(f)
                print(f"Loaded crop parameters from {params_path}")
            else:
                print(f"Params file not found: {params_path}")
                
            if os.path.exists(encoder_path):
                with open(encoder_path, 'rb') as f:
                    self.label_encoder = pickle.load(f)
                print(f"Loaded label encoder from {encoder_path}")
            else:
                print(f"Encoder file not found: {encoder_path}")
                
            if self.model and self.label_encoder:
                self.is_trained = True
                
        except Exception as e:
            print(f"Error loading crop recommendation model: {e}")
    
    def predict(self, data):
        """Predict best crop based on soil and weather conditions"""
        if not self.is_trained:
            return {'error': 'Model not loaded', 'recommended_crop': 'Unknown', 'confidence': 0}
        
        try:
            # Extract features in expected order: N, P, K, temperature, humidity, ph, rainfall
            features = [
                float(data.get('N', 0)),
                float(data.get('P', 0)),
                float(data.get('K', 0)),
                float(data.get('temperature', 0)),
                float(data.get('humidity', 0)),
                float(data.get('ph', 0)),
                float(data.get('rainfall', 0))
            ]
            
            # Reshape for model input
            input_array = np.array([features])
            
            # Get predictions
            predictions = self.model.predict(input_array, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            # Decode crop name
            crop_name = self.label_encoder.inverse_transform([predicted_class])[0]
            
            # Get all probabilities
            all_crops = self.label_encoder.classes_
            all_probs = {crop: float(prob) for crop, prob in zip(all_crops, predictions[0])}
            
            return {
                'recommended_crop': crop_name,
                'confidence': confidence,
                'all_probabilities': all_probs
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {'error': str(e), 'recommended_crop': 'Unknown', 'confidence': 0}
    
    def get_required_parameters(self):
        return ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
