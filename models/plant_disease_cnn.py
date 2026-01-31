import os
import json
import numpy as np
from tensorflow import keras
from PIL import Image

class PlantDiseaseDetector:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), 'best_disease_model.keras')
        params_path = os.path.join(os.path.dirname(__file__), 'disease_params.json')
        
        self.model = None
        self.params = None
        self.class_names = []
        self.is_trained = False
        
        try:
            if os.path.exists(model_path):
                self.model = keras.models.load_model(model_path)
                print(f"Loaded disease detection model from {model_path}")
            else:
                print(f"Model file not found: {model_path}")
            
            if os.path.exists(params_path):
                with open(params_path, 'r') as f:
                    self.params = json.load(f)
                self.class_names = self.params.get('class_indices', [])
                print(f"Loaded disease parameters from {params_path}")
                print(f"Classes: {len(self.class_names)} disease categories")
            else:
                print(f"Params file not found: {params_path}")
            
            if self.model and self.class_names:
                self.is_trained = True
                
        except Exception as e:
            print(f"Error loading disease detection model: {e}")
    
    def predict_disease(self, image_path=None, image_array=None):
        """Predict plant disease from image"""
        if not self.is_trained:
            return {
                'error': 'Model not loaded',
                'predicted_disease': 'Unknown',
                'confidence': 0,
                'crop': 'Unknown',
                'status': 'Model not available'
            }
        
        try:
            # Load and preprocess image
            if image_path:
                img = Image.open(image_path).convert('RGB')
            elif image_array is not None:
                img = Image.fromarray(image_array).convert('RGB')
            else:
                return {'error': 'No image provided'}
            
            # Get target size from params or use default
            target_size = self.params.get('image_size', [224, 224])
            img = img.resize((target_size[0], target_size[1]))
            
            # Convert to array and normalize
            img_array = np.array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            
            # Make prediction
            predictions = self.model.predict(img_array, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            # Get disease name
            disease_name = self.class_names[predicted_class] if predicted_class < len(self.class_names) else 'Unknown'
            
            # Parse crop and status from disease name (format: Crop___Disease)
            crop_name = 'Unknown'
            status = disease_name
            
            if '___' in disease_name:
                parts = disease_name.split('___')
                crop_name = parts[0]
                status = parts[1].replace('_', ' ').title()
            elif '_' in disease_name:
                # Handle format: Crop_Disease
                parts = disease_name.split('_', 1)
                crop_name = parts[0]
                status = parts[1].replace('_', ' ').title()
            
            return {
                'predicted_disease': disease_name,
                'crop': crop_name,
                'status': status,
                'confidence': confidence,
                'confidence_percentage': f"{confidence*100:.2f}%"
            }
            
        except Exception as e:
            print(f"Disease prediction error: {e}")
            return {
                'error': str(e),
                'predicted_disease': 'Unknown',
                'confidence': 0,
                'crop': 'Unknown',
                'status': 'Error'
            }
    
    def get_required_parameters(self):
        return ['image_path']
    
    def get_supported_diseases(self):
        """Return list of diseases the model can detect"""
        return self.class_names if self.class_names else []
