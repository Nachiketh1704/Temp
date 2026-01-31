import os
import pickle
import numpy as np

class YieldProfitModel:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), 'yield_profit_model.pkl')
        
        self.model = None
        self.is_trained = False
        
        try:
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                print(f"Loaded yield/profit model from {model_path}")
            else:
                print(f"Model file not found: {model_path}")
        except Exception as e:
            print(f"Error loading yield/profit model: {e}")
    
    def predict(self, data):
        """Predict yield and profit based on inputs"""
        if not self.is_trained:
            return {
                'error': 'Model not loaded',
                'predicted_yield': 0,
                'predicted_profit': 0
            }
        
        try:
            # Extract features - adjust order based on your model training
            features = [
                float(data.get('N', 0)),
                float(data.get('P', 0)),
                float(data.get('K', 0)),
                float(data.get('ph', 0)),
                float(data.get('temperature', 0)),
                float(data.get('humidity', 0)),
                float(data.get('rainfall', 0)),
                float(data.get('farm_size', 1)),
                float(data.get('irrigation_quality', 0.7)),
                float(data.get('fertilizer_usage', 1.0))
            ]
            
            # Encode crop if provided
            crop = data.get('crop', 'Rice')
            
            input_array = np.array([features])
            
            # Make prediction
            prediction = self.model.predict(input_array)
            
            # If model outputs both yield and profit
            if hasattr(prediction, 'shape') and len(prediction.shape) > 1 and prediction.shape[1] >= 2:
                predicted_yield = float(prediction[0][0])
                predicted_profit = float(prediction[0][1])
            else:
                # If model only predicts yield, estimate profit
                predicted_yield = float(prediction[0])
                # Estimate profit based on crop prices (simplified)
                crop_prices = {
                    'Rice': 1800, 'Wheat': 2000, 'Maize': 1500,
                    'Sugarcane': 3200, 'Cotton': 5500
                }
                price_per_ton = crop_prices.get(crop, 2000)
                farm_size = float(data.get('farm_size', 1))
                predicted_profit = predicted_yield * farm_size * price_per_ton
            
            return {
                'predicted_yield': predicted_yield,
                'predicted_profit': predicted_profit,
                'yield_unit': 'tons/hectare',
                'profit_currency': 'INR'
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'error': str(e),
                'predicted_yield': 0,
                'predicted_profit': 0
            }
    
    def get_required_parameters(self):
        return ['N', 'P', 'K', 'ph', 'temperature', 'humidity', 'rainfall',
                'farm_size', 'irrigation_quality', 'fertilizer_usage', 'crop']
