import spacy
import re
from typing import Dict, List, Tuple, Optional

class NLPProcessor:    
    def __init__(self):
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            import os
            os.system('python -m spacy download en_core_web_sm')
            self.nlp = spacy.load('en_core_web_sm')
        
        self.intent_patterns = {
            'crop_recommendation': [
                'recommend', 'suggest', 'which crop', 'what crop', 'best crop',
                'should i grow', 'can i grow', 'suitable crop'
            ],
            'yield_prediction': [
                'yield', 'production', 'harvest', 'how much will', 'expected yield',
                'predict yield', 'estimate yield'
            ],
            'profit_prediction': [
                'profit', 'income', 'earning', 'money', 'revenue', 'benefit',
                'how much money', 'financial', 'price'
            ],
            'sustainability': [
                'sustainability', 'sustainable', 'environment', 'eco', 'green',
                'soil health', 'conservation', 'organic'
            ],
            'disease_detection': [
                'disease', 'pest', 'infection', 'sick', 'damaged', 'spots',
                'leaves', 'plant health', 'diagnosis'
            ]
        }
        
        self.parameter_patterns = {
            'N': r'nitrogen[:\s]+(\d+\.?\d*)|N[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*(?:kg|kg/ha)?\s*nitrogen',
            'P': r'phosphorus[:\s]+(\d+\.?\d*)|P[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*(?:kg|kg/ha)?\s*phosphorus',
            'K': r'potassium[:\s]+(\d+\.?\d*)|K[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*(?:kg|kg/ha)?\s*potassium',
            'ph': r'ph[:\s]+(\d+\.?\d*)|ph\s*level[:\s]+(\d+\.?\d*)|soil\s*ph[:\s]+(\d+\.?\d*)',
            'temperature': r'temperature[:\s]+(\d+\.?\d*)|temp[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*(?:degrees|°C|celsius)',
            'humidity': r'humidity[:\s]+(\d+\.?\d*)|(\d+\.?\d*)%\s*humidity|(\d+\.?\d*)\s*percent\s*humidity',
            'rainfall': r'rainfall[:\s]+(\d+\.?\d*)|rain[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*mm\s*rain',
            'farm_size': r'farm\s*size[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*hectare|(\d+\.?\d*)\s*ha',
            'irrigation_quality': r'irrigation[:\s]+(\d+\.?\d*)|irrigation\s*quality[:\s]+(\d+\.?\d*)',
            'fertilizer_usage': r'fertilizer[:\s]+(\d+\.?\d*)|fertilizer\s*usage[:\s]+(\d+\.?\d*)',
        }
        
        self.crop_names = [
            'rice', 'wheat', 'maize', 'corn', 'sugarcane', 'cotton', 'bajra',
            'jowar', 'barley', 'groundnut', 'peanut', 'pulses', 'chickpea',
            'soybean', 'potato', 'tomato', 'onion', 'mustard', 'sunflower'
        ]
    
    def detect_intent(self, text: str) -> List[Tuple[str, float]]:
        text_lower = text.lower()
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                if pattern in text_lower:
                    score += 1
            
            intent_scores[intent] = score / len(patterns) if patterns else 0
        sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
        
        return [(intent, score) for intent, score in sorted_intents if score > 0]
    
    def extract_parameters(self, text: str) -> Dict:
        parameters = {}
        text_lower = text.lower()
        
        for param, pattern in self.parameter_patterns.items():
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                value = next((g for g in match.groups() if g is not None), None)
                if value:
                    try:
                        parameters[param] = float(value)
                    except:
                        pass
        
        for crop in self.crop_names:
            if crop in text_lower:
                parameters['crop'] = crop.capitalize()
                break
        
        return parameters
    
    def extract_location(self, text: str) -> Dict:
        location = {}
        doc = self.nlp(text)
        
        for ent in doc.ents:
            if ent.label_ == 'GPE':
                if 'state' not in location:
                    location['state'] = ent.text
                elif 'district' not in location:
                    location['district'] = ent.text
        
        coord_pattern = r'(?:lat|latitude)[:\s]*(-?\d+\.?\d*)[,\s]+(?:lon|longitude|long)[:\s]*(-?\d+\.?\d*)'
        match = re.search(coord_pattern, text, re.IGNORECASE)
        if match:
            location['lat'] = float(match.group(1))
            location['lon'] = float(match.group(2))
        
        return location
    
    def process_query(self, text: str) -> Dict:
        intents = self.detect_intent(text)
        primary_intent = intents[0][0] if intents else 'general'
        
        parameters = self.extract_parameters(text)
        location = self.extract_location(text)
        
        return {
            'intent': primary_intent,
            'all_intents': intents,
            'parameters': parameters,
            'location': location,
            'original_text': text
        }
    
    def get_missing_parameters(self, intent: str, provided_params: Dict) -> List[str]:
        required_params = {
            'crop_recommendation': ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'],
            'yield_prediction': ['N', 'P', 'K', 'ph', 'temperature', 'humidity', 'rainfall',
                                'farm_size', 'irrigation_quality', 'fertilizer_usage', 'crop'],
            'profit_prediction': ['N', 'P', 'K', 'ph', 'temperature', 'humidity', 'rainfall',
                                 'farm_size', 'irrigation_quality', 'fertilizer_usage', 'crop'],
            'sustainability': ['crop', 'N', 'P', 'K', 'ph', 'rainfall', 'humidity',
                             'farm_size', 'irrigation_quality', 'fertilizer_usage'],
            'disease_detection': ['image_path']
        }
        
        if intent not in required_params:
            return []
        
        missing = []
        for param in required_params[intent]:
            if param not in provided_params or provided_params[param] is None:
                missing.append(param)
        
        return missing
    
    def generate_follow_up_question(self, missing_params: List[str]) -> str:
        if not missing_params:
            return None
        
        param = missing_params[0]
        
        questions = {
            'N': 'What is the Nitrogen content in your soil? (in kg/ha)',
            'P': 'What is the Phosphorus content in your soil? (in kg/ha)',
            'K': 'What is the Potassium content in your soil? (in kg/ha)',
            'ph': 'What is your soil pH level? (typically between 5-8)',
            'temperature': 'What is the average temperature in your region? (in °C)',
            'humidity': 'What is the average humidity? (in %)',
            'rainfall': 'What is the average rainfall in your area? (in mm)',
            'farm_size': 'What is your farm size? (in hectares)',
            'irrigation_quality': 'How would you rate your irrigation quality? (0.3 for poor, 0.7 for good, 1.0 for excellent)',
            'fertilizer_usage': 'What is your fertilizer usage ratio? (0.5 for low, 1.0 for normal, 2.0 for high)',
            'crop': 'Which crop are you growing or planning to grow?',
            'image_path': 'Please upload an image of the plant leaf to detect disease.'
        }
        
        return questions.get(param, f'Please provide value for {param}')
    
    def extract_single_value(self, text: str, param: str) -> Optional[float]:
        numbers = re.findall(r'\d+\.?\d*', text)
        if numbers:
            try:
                return float(numbers[0])
            except:
                pass
        
        if param == 'crop':
            text_lower = text.lower()
            for crop in self.crop_names:
                if crop in text_lower:
                    return crop.capitalize()
        
        return None
