import spacy
import re
import json
from typing import Dict, List, Tuple, Optional

class NLPProcessor:    
    def __init__(self):
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            import os
            os.system('python -m spacy download en_core_web_sm')
            self.nlp = spacy.load('en_core_web_sm')
        
        # Load state agricultural data for mean values
        try:
            with open('state_agricultural_data.json', 'r', encoding='utf-8') as f:
                self.state_data = json.load(f)
        except:
            self.state_data = {}
        
        # Load offline translations for multi-language support
        try:
            with open('offline_translation.json', 'r', encoding='utf-8') as f:
                self.translations = json.load(f)
        except:
            self.translations = {}
        
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
        
        # Expanded crop names with more varieties
        self.crop_names = [
            'rice', 'wheat', 'maize', 'corn', 'sugarcane', 'cotton', 'bajra',
            'jowar', 'barley', 'groundnut', 'peanut', 'pulses', 'chickpea',
            'soybean', 'potato', 'tomato', 'onion', 'mustard', 'sunflower',
            'kidneybeans', 'pigeonpeas', 'mothbeans', 'mungbean', 'blackgram',
            'lentil', 'pomegranate', 'banana', 'mango', 'grapes', 'watermelon',
            'muskmelon', 'apple', 'orange', 'papaya', 'coconut', 'jute', 'coffee'
        ]
        
        # Patterns to detect "I don't know" responses
        self.dont_know_patterns = [
            r"don'?t know", r"not sure", r"no idea", r"don'?t have",
            r"can'?t say", r"unsure", r"unknown", r"नहीं पता", r"मालूम नहीं",
            r"పता नहीं", r"ఎరుగదు", r"தெરியாது", r"അറിയില്ല", r"ଜାଣି ନାହିଁ",
            r"জানি না", r"ਪਤਾ ਨਹੀਂ", r"माहित नाही", r"ખબર નથી", r"معلوم نہیں",
            r"ಗೊತ್ತಿಲ್ಲ", r"নাজানো"
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
            'N': 'What is the Nitrogen content in your soil? (in kg/ha, or say "don\'t know" for average)',
            'P': 'What is the Phosphorus content in your soil? (in kg/ha, or say "don\'t know" for average)',
            'K': 'What is the Potassium content in your soil? (in kg/ha, or say "don\'t know" for average)',
            'ph': 'What is your soil pH level? (typically 5-8, or say "don\'t know" for average)',
            'temperature': 'What is the average temperature in your region? (in °C, or say "don\'t know" for average)',
            'humidity': 'What is the average humidity? (in %, or say "don\'t know" for average)',
            'rainfall': 'What is the average rainfall in your area? (in mm, or say "don\'t know" for average)',
            'farm_size': 'What is your farm size? (in hectares, or say "don\'t know" for 1 hectare)',
            'irrigation_quality': 'How would you rate your irrigation quality? (0.3 for poor, 0.7 for good, 1.0 for excellent, or say "don\'t know" for 0.7)',
            'fertilizer_usage': 'What is your fertilizer usage ratio? (0.5 for low, 1.0 for normal, 2.0 for high, or say "don\'t know" for 1.0)',
            'crop': 'Which crop are you growing or planning to grow?',
            'image_path': 'Please upload an image of the plant leaf to detect disease.'
        }
        
        return questions.get(param, f'Please provide value for {param}')
    
    def is_dont_know_response(self, text: str) -> bool:
        """Check if the user's response indicates they don't know"""
        text_lower = text.lower()
        for pattern in self.dont_know_patterns:
            if re.search(pattern, text_lower):
                return True
        return False
    
    def get_state_mean_values(self, state: str) -> Dict:
        """Get mean agricultural values for a given state"""
        if state in self.state_data:
            return self.state_data[state].copy()
        
        # If state not found, return overall averages
        return {
            'N': 205,
            'P': 40,
            'K': 230,
            'temperature': 26,
            'humidity': 68,
            'ph': 6.8,
            'rainfall': 1400
        }
    
    def auto_populate_parameters(self, intent: str, parameters: Dict, location: Dict) -> Dict:
        """Auto-populate parameters based on location and state data"""
        enriched_params = parameters.copy()
        
        # Get state from location
        state = location.get('state', '')
        
        if state and state in self.state_data:
            state_means = self.state_data[state]
            
            # Auto-populate environmental parameters if not provided
            if 'temperature' not in enriched_params:
                enriched_params['temperature'] = state_means['temperature']
            if 'humidity' not in enriched_params:
                enriched_params['humidity'] = state_means['humidity']
            if 'rainfall' not in enriched_params:
                enriched_params['rainfall'] = state_means['rainfall']
            if 'ph' not in enriched_params:
                enriched_params['ph'] = state_means['ph']
            
            # For soil nutrients, only auto-populate if completely missing
            # Users might want to provide their specific values
        
        return enriched_params
    
    def extract_single_value(self, text: str, param: str, state: str = None) -> Optional[float]:
        """Extract single value from text, or use mean if user doesn't know"""
        
        # Check if user doesn't know
        if self.is_dont_know_response(text):
            # Return state-specific mean or default mean
            if state and state in self.state_data:
                state_means = self.state_data[state]
                if param in state_means:
                    return state_means[param]
            
            # Default means for different parameters
            default_means = {
                'N': 205,
                'P': 40,
                'K': 230,
                'temperature': 26,
                'humidity': 68,
                'ph': 6.8,
                'rainfall': 1400,
                'farm_size': 1,
                'irrigation_quality': 0.7,
                'fertilizer_usage': 1.0
            }
            return default_means.get(param, 0)
        
        # Try to extract numeric value
        numbers = re.findall(r'\d+\.?\d*', text)
        if numbers:
            try:
                return float(numbers[0])
            except:
                pass
        
        # Handle crop names
        if param == 'crop':
            text_lower = text.lower()
            
            # Check for translated crop names
            for lang, translations in self.translations.items():
                for eng_crop, translated_crop in translations.items():
                    if translated_crop.lower() in text_lower:
                        return eng_crop.lower()
            
            # Check for English crop names
            for crop in self.crop_names:
                if crop in text_lower:
                    return crop
        
        return None
