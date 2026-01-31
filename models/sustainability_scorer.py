import os
import pickle
import numpy as np

class SustainabilityScorer:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), 'sustainability_scorer.pkl')
        
        self.model = None
        self.is_trained = False
        
        try:
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                print(f"Loaded sustainability scorer from {model_path}")
            else:
                print(f"Model file not found: {model_path}")
        except Exception as e:
            print(f"Error loading sustainability scorer: {e}")
    
    def calculate_sustainability_score(self, data):
        """Calculate sustainability score for farming practices"""
        if not self.is_trained:
            return self._fallback_calculation(data)
        
        try:
            # Extract features
            features = [
                float(data.get('N', 0)),
                float(data.get('P', 0)),
                float(data.get('K', 0)),
                float(data.get('ph', 7)),
                float(data.get('rainfall', 100)),
                float(data.get('humidity', 50)),
                float(data.get('farm_size', 1)),
                float(data.get('irrigation_quality', 0.7)),
                float(data.get('fertilizer_usage', 1.0))
            ]
            
            input_array = np.array([features])
            
            # Get score from model
            score = self.model.predict(input_array)
            overall_score = float(score[0]) if hasattr(score, '__iter__') else float(score)
            
            # Ensure score is between 0-100
            overall_score = max(0, min(100, overall_score))
            
            # Calculate component scores
            component_scores = self._calculate_components(data)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(data, overall_score)
            
            # Determine rating
            if overall_score >= 80:
                rating = 'Excellent'
            elif overall_score >= 60:
                rating = 'Good'
            elif overall_score >= 40:
                rating = 'Moderate'
            else:
                rating = 'Needs Improvement'
            
            return {
                'overall_score': round(overall_score, 2),
                'rating': rating,
                'component_scores': component_scores,
                'recommendations': recommendations
            }
            
        except Exception as e:
            print(f"Sustainability calculation error: {e}")
            return self._fallback_calculation(data)
    
    def _calculate_components(self, data):
        """Calculate individual component scores"""
        # Soil health (based on NPK balance and pH)
        n = float(data.get('N', 0))
        p = float(data.get('P', 0))
        k = float(data.get('K', 0))
        ph = float(data.get('ph', 7))
        
        optimal_ph = 6.5
        ph_score = max(0, 100 - abs(ph - optimal_ph) * 20)
        npk_balance = min(n, p, k) / (max(n, p, k) + 1) * 100
        soil_health = (ph_score + npk_balance) / 2
        
        # Water efficiency
        irrigation = float(data.get('irrigation_quality', 0.7)) * 100
        rainfall = float(data.get('rainfall', 100))
        water_score = min(100, (irrigation + min(rainfall / 10, 50)))
        
        # Resource efficiency (fertilizer usage)
        fert_usage = float(data.get('fertilizer_usage', 1.0))
        if fert_usage <= 1.0:
            resource_score = 100
        elif fert_usage <= 1.5:
            resource_score = 80
        else:
            resource_score = max(0, 100 - (fert_usage - 1.5) * 40)
        
        return {
            'soil_health': round(soil_health, 1),
            'water_efficiency': round(water_score, 1),
            'resource_efficiency': round(resource_score, 1)
        }
    
    def _generate_recommendations(self, data, score):
        """Generate sustainability recommendations"""
        recommendations = []
        
        ph = float(data.get('ph', 7))
        if ph < 6.0:
            recommendations.append("Consider adding lime to increase soil pH")
        elif ph > 7.5:
            recommendations.append("Consider adding sulfur to decrease soil pH")
        
        fert_usage = float(data.get('fertilizer_usage', 1.0))
        if fert_usage > 1.5:
            recommendations.append("Reduce fertilizer usage to improve sustainability")
        
        irrigation = float(data.get('irrigation_quality', 0.7))
        if irrigation < 0.6:
            recommendations.append("Improve irrigation efficiency with drip or sprinkler systems")
        
        if score < 60:
            recommendations.append("Consider implementing crop rotation to improve soil health")
            recommendations.append("Explore organic farming practices")
        
        return recommendations if recommendations else ["Continue current sustainable practices"]
    
    def _fallback_calculation(self, data):
        """Fallback calculation when model is not available"""
        component_scores = self._calculate_components(data)
        overall_score = sum(component_scores.values()) / len(component_scores)
        
        if overall_score >= 80:
            rating = 'Excellent'
        elif overall_score >= 60:
            rating = 'Good'
        elif overall_score >= 40:
            rating = 'Moderate'
        else:
            rating = 'Needs Improvement'
        
        return {
            'overall_score': round(overall_score, 2),
            'rating': rating,
            'component_scores': component_scores,
            'recommendations': self._generate_recommendations(data, overall_score)
        }
    
    def get_required_parameters(self):
        return ['crop', 'N', 'P', 'K', 'ph', 'rainfall', 'humidity',
                'farm_size', 'irrigation_quality', 'fertilizer_usage']
