from typing import Dict, Optional, List
import json

class ConversationManager:
    
    def __init__(self):
        self.conversations = {}
    
    def get_or_create_conversation(self, session_id: str) -> Dict:
        if session_id not in self.conversations:
            self.conversations[session_id] = {
                'state': 'idle',
                'intent': None,
                'parameters': {},
                'missing_params': [],
                'current_param': None,
                'history': [],
                'user_state': None,  # Store user's state for mean values
                'location': {}  # Store location data
            }
        return self.conversations[session_id]
    
    def update_conversation(self, session_id: str, updates: Dict):
        if session_id in self.conversations:
            self.conversations[session_id].update(updates)
    
    def add_to_history(self, session_id: str, role: str, message: str):
        if session_id in self.conversations:
            self.conversations[session_id]['history'].append({
                'role': role,
                'message': message
            })
    
    def clear_conversation(self, session_id: str):
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def is_collecting_params(self, session_id: str) -> bool:
        conv = self.get_or_create_conversation(session_id)
        return conv['state'] == 'collecting_params'
    
    def get_intent(self, session_id: str) -> Optional[str]:
        conv = self.get_or_create_conversation(session_id)
        return conv.get('intent')
    
    def set_intent(self, session_id: str, intent: str):
        conv = self.get_or_create_conversation(session_id)
        conv['intent'] = intent
        conv['state'] = 'collecting_params'
    
    def add_parameter(self, session_id: str, param_name: str, param_value):
        conv = self.get_or_create_conversation(session_id)
        conv['parameters'][param_name] = param_value
    
    def add_parameters(self, session_id: str, params: Dict):
        conv = self.get_or_create_conversation(session_id)
        conv['parameters'].update(params)
    
    def get_parameters(self, session_id: str) -> Dict:
        conv = self.get_or_create_conversation(session_id)
        return conv.get('parameters', {})
    
    def set_missing_params(self, session_id: str, missing: List[str]):
        conv = self.get_or_create_conversation(session_id)
        conv['missing_params'] = missing
        conv['current_param'] = missing[0] if missing else None
    
    def get_missing_params(self, session_id: str) -> List[str]:
        conv = self.get_or_create_conversation(session_id)
        return conv.get('missing_params', [])
    
    def pop_current_param(self, session_id: str) -> Optional[str]:
        conv = self.get_or_create_conversation(session_id)
        if conv['missing_params']:
            param = conv['missing_params'].pop(0)
            conv['current_param'] = conv['missing_params'][0] if conv['missing_params'] else None
            return param
        return None
    
    def get_current_param(self, session_id: str) -> Optional[str]:
        conv = self.get_or_create_conversation(session_id)
        return conv.get('current_param')
    
    def mark_ready(self, session_id: str):
        conv = self.get_or_create_conversation(session_id)
        conv['state'] = 'ready'
    
    def is_ready(self, session_id: str) -> bool:
        conv = self.get_or_create_conversation(session_id)
        return conv['state'] == 'ready'
    
    def get_summary(self, session_id: str) -> str:
        conv = self.get_or_create_conversation(session_id)
        intent = conv.get('intent', 'Unknown')
        params = conv.get('parameters', {})
        
        summary = f"Intent: {intent}\\n"
        summary += f"Parameters collected: {len(params)}\\n"
        for key, value in params.items():
            summary += f"  - {key}: {value}\\n"
        
        return summary
    
    def get_conversation_state(self, session_id: str) -> Dict:
        return self.get_or_create_conversation(session_id)
    
    def handle_cancel(self, session_id: str):
        self.clear_conversation(session_id)
    
    def handle_new_query(self, session_id: str):
        self.clear_conversation(session_id)
    
    def set_user_location(self, session_id: str, location: Dict):
        """Store user's location (state/district) for auto-populating parameters"""
        conv = self.get_or_create_conversation(session_id)
        conv['location'] = location
        if 'state' in location:
            conv['user_state'] = location['state']
    
    def get_user_state(self, session_id: str) -> Optional[str]:
        """Get the user's state for accessing state-specific mean values"""
        conv = self.get_or_create_conversation(session_id)
        return conv.get('user_state')
    
    def get_location(self, session_id: str) -> Dict:
        """Get stored location data"""
        conv = self.get_or_create_conversation(session_id)
        return conv.get('location', {})


class ModelRouter:    
    def __init__(self, models: Dict):
        self.models = models
    
    def route_to_model(self, intent: str, parameters: Dict) -> Dict:
        if intent == 'crop_recommendation':
            model = self.models.get('crop_recommendation')
            if model:
                return model.predict(parameters)
            return {'error': 'Crop recommendation model not available'}
        
        elif intent == 'yield_prediction':
            model = self.models.get('yield_profit')
            if model:
                result = model.predict(parameters)

                return {
                    'predicted_yield': result.get('predicted_yield'),
                    'yield_unit': result.get('yield_unit', 'tons/hectare')
                }
            return {'error': 'Yield prediction model not available'}
        
        elif intent == 'profit_prediction':
            model = self.models.get('yield_profit')
            if model:
                result = model.predict(parameters)

                return result
            return {'error': 'Profit prediction model not available'}
        
        elif intent == 'sustainability':
            model = self.models.get('sustainability')
            if model:
                return model.calculate_sustainability_score(parameters)
            return {'error': 'Sustainability scorer not available'}
        
        elif intent == 'disease_detection':
            model = self.models.get('disease_detection')
            if model:
                return model.predict_disease(
                    image_path=parameters.get('image_path')
                )
            return {'error': 'Disease detection model not available'}
        
        else:
            return {'error': f'Unknown intent: {intent}'}
    
    def format_response(self, intent: str, result: Dict) -> str:

        if 'error' in result:
            return f"Sorry, I encountered an error: {result['error']}"
        
        if intent == 'crop_recommendation':
            crop = result.get('recommended_crop')
            confidence = result.get('confidence', 0) * 100
            response = f"I recommend growing **{crop}** (confidence: {confidence:.1f}%)\\n\\n"
            
            all_probs = result.get('all_probabilities', {})
            if all_probs:
                sorted_crops = sorted(all_probs.items(), key=lambda x: x[1], reverse=True)[:3]
                response += "Other suitable crops:\\n"
                for crop_name, prob in sorted_crops[1:]:
                    response += f"  - {crop_name} ({prob*100:.1f}%)\\n"
            
            return response
        
        elif intent == 'yield_prediction':
            yield_val = result.get('predicted_yield')
            unit = result.get('yield_unit', 'tons/hectare')
            return f"Expected yield: **{yield_val:.2f} {unit}**"
        
        elif intent == 'profit_prediction':
            yield_val = result.get('predicted_yield')
            profit = result.get('predicted_profit')
            return (f"Expected yield: **{yield_val:.2f} tons/hectare**\\n"
                   f"Expected profit: **${profit:.2f}/hectare**")
        
        elif intent == 'sustainability':
            score = result.get('overall_score')
            rating = result.get('rating', 'Unknown')
            components = result.get('component_scores', {})
            recommendations = result.get('recommendations', [])
            
            response = f"Sustainability Score: **{score}/100** ({rating})\\n\\n"
            response += "Component Scores:\\n"
            for component, value in components.items():
                response += f"  - {component.replace('_', ' ').title()}: {value:.1f}/100\\n"
            
            if recommendations:
                response += "\\nRecommendations:\\n"
                for rec in recommendations:
                    response += f" {rec}\\n"
            
            return response
        
        elif intent == 'disease_detection':
            disease = result.get('predicted_disease')
            confidence = result.get('confidence', 0) * 100
            return f"Detected: **{disease}** (confidence: {confidence:.1f}%)"
        
        else:
            return str(result)
