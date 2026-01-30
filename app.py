import os
import json
import csv
from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_cors import CORS
from deep_translator import GoogleTranslator
from werkzeug.utils import secure_filename
from vosk import Model, KaldiRecognizer
import wave
from gtts import gTTS
from io import BytesIO
import base64
from flask_sock import Sock
import requests


from models.crop_recommendation import CropRecommendationModel
from models.yield_profit_prediction import YieldProfitModel
from models.sustainability_scorer import SustainabilityScorer
from models.plant_disease_cnn import PlantDiseaseDetector
from nlp_processor import NLPProcessor
from conversation_manager import ConversationManager, ModelRouter

app = Flask(__name__)
app.secret_key = "your_secret_key"
CORS(app)
sock = Sock(app)

ai_models = {
    'crop_recommendation': CropRecommendationModel(),
    'yield_profit': YieldProfitModel(),
    'sustainability': SustainabilityScorer(),
    'disease_detection': PlantDiseaseDetector()
}

nlp_processor = NLPProcessor()
conversation_manager = ConversationManager()
model_router = ModelRouter(ai_models)

VOSK_MODELS = {
    "en": "vosk-model-small-en-us-0.15",
    "hi": "vosk-model-small-hi-0.22",
    "te": "vosk-model-te-0.4",
    "ta": "vosk-model-ta-0.1",
    "kn": "vosk-model-kn-0.5",
    "ml": "vosk-model-ml-0.4",
    "bn": "vosk-model-bn-0.1",
    "gu": "vosk-model-gu-0.4",
    "pa": "vosk-model-pa-0.5",
    "mr": "vosk-model-mr-0.4",
    "ur": "vosk-model-ur-pk-0.1",
    "or": "vosk-model-or-0.1",
    "as": "vosk-model-as-0.1",
}

def t(text):
    lang = session.get("lang", "en")
    if lang == "en":
        return text
    try:
        translator = GoogleTranslator(source='en', target=lang)
        return translator.translate(text)
    except:
        return text

def detect_crop_disease(image_path):
    model = ai_models.get('disease_detection')
    if not model:
        return {"crop": "Unknown", "status": "Model not loaded", "confidence": "0%"}
    
    result = model.predict_disease(image_path=image_path)
    
    return {
        "crop": result.get('crop', 'Unknown'),
        "status": result.get('status', 'Unknown'),
        "confidence": result.get('confidence_percentage', '0%')
    }

def load_soil_data():
    with open("soil_data.json", "r", encoding="utf-8") as f:
        return json.load(f)

def load_crop_data():
    crops = []
    with open("crop_data.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            crops.append(row)
    return crops

def get_crop_prices():
    return {"Rice":1800, "Wheat":2000, "Maize":1500, "Sugarcane":3200, "Cotton":5500}

def get_vosk_model(lang_code):
    model_name = VOSK_MODELS.get(lang_code, "vosk-model-small-en-us-0.15")
    model_path = os.path.join(os.getcwd(), "models", model_name)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Vosk model not found at {model_path}")
    return Model(model_path)

def speak(text, lang="en"):
    try:
        tts = gTTS(text=text, lang=lang)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return base64.b64encode(fp.read()).decode("utf-8")
    except:
        return ""

def get_soil_ph(lat, lon):
    try:
        response = requests.get(f"https://rest.soilgrids.org/query?lon={lon}&lat={lat}")
        data = response.json()
        ph = data.get("properties", {}).get("phh2o", {}).get("mean", {}).get("value", None)
        return ph
    except:
        return None

with open("states_districts.json", encoding="utf-8") as f:
    states_districts = json.load(f)["states"]

@app.route("/", methods=["GET", "POST"])
def language_selection():
    if request.method == "POST":
        session["lang"] = request.form["language"]
        return redirect(url_for("index"))
    languages = {
        "en": "English",
        "hi": "हिन्दी",
        "te": "తెలుగు",
        "ta": "தமிழ்",
        "kn": "ಕನ್ನಡ",
        "ml": "മലയാളം",
        "bn": "বাংলা",
        "gu": "ગુજરાતી",
        "pa": "ਪੰਜਾਬੀ",
        "mr": "मराठी",
        "ur": "اردو",
        "or": "ଓଡ଼ିଆ",
        "as": "অসমীয়া"
    }
    return render_template("language.html", languages=languages, t=t)

@app.route("/index")
def index():
    return render_template("index.html", t=t, states_districts=states_districts, states_districts_json=json.dumps(states_districts))

@app.route("/recommend", methods=["POST"])
def recommend():
    lat = request.form.get("lat")
    lon = request.form.get("lon")
    state = request.form.get("state")
    district = request.form.get("district")

    soil_data = load_soil_data()
    crops = load_crop_data()
    prices = get_crop_prices()
    recommendations = []

    avg_ph = None
    climate = None

    if lat and lon:
        ph = get_soil_ph(float(lat), float(lon))
        if ph:
            avg_ph = ph

    if avg_ph is None and state and district:
        region = soil_data.get(state, [])
        matched = [d for d in region if d["name"].lower().strip() == district.lower().strip()]
        if matched:
            avg_ph = float(matched[0].get("ph", 0))
            climate = matched[0].get("climate", "").strip()

    for crop in crops:
        try:
            ph_req = float(crop.get("ph", 0))
            crop_climate = crop.get("climate", "").strip().lower()
            if avg_ph is None:
                continue
            if abs(ph_req - avg_ph) <= 0.5 and (climate is None or crop_climate == climate.lower()):
                crop_name = crop.get("crop", "")
                price = prices.get(crop_name, "N/A")
                recommendations.append({"crop": crop_name, "price": price, "climate": climate or crop_climate})
        except:
            continue

    return render_template("index.html", t=t, states_districts=states_districts, states_districts_json=json.dumps(states_districts), recommendations=recommendations)

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.form.get("message", "")
    if not user_msg.strip():
        return jsonify({"reply": t("Please type something."), "audio": ""})
    
    session_id = session.get('session_id', os.urandom(16).hex())
    session['session_id'] = session_id
    
    lang = session.get("lang", "en")
    
    user_msg_lower = user_msg.lower().strip()
    if user_msg_lower in ['cancel', 'reset', 'start over', 'new query']:
        conversation_manager.handle_new_query(session_id)
        reply = "Conversation reset. How can I help you today?"
        audio = speak(reply, lang)
        return jsonify({"reply": reply, "audio": audio})
    
    if conversation_manager.is_collecting_params(session_id):
        current_param = conversation_manager.get_current_param(session_id)
        
        value = nlp_processor.extract_single_value(user_msg, current_param)
        
        if value is not None:
            conversation_manager.add_parameter(session_id, current_param, value)
            conversation_manager.pop_current_param(session_id)
            
            missing = conversation_manager.get_missing_params(session_id)
            
            if not missing:
                conversation_manager.mark_ready(session_id)
                intent = conversation_manager.get_intent(session_id)
                parameters = conversation_manager.get_parameters(session_id)
                
                result = model_router.route_to_model(intent, parameters)
                reply = model_router.format_response(intent, result)
                
                conversation_manager.clear_conversation(session_id)
            else:
                reply = nlp_processor.generate_follow_up_question(missing)
        else:
            reply = f"I couldn't understand that. {nlp_processor.generate_follow_up_question([current_param])}"
    
    else:
        processed = nlp_processor.process_query(user_msg)
        intent = processed['intent']
        parameters = processed['parameters']
        
        if intent == 'general' or not intent:
            reply = "I can help you with:\n• Crop recommendations\n• Yield and profit predictions\n• Sustainability scoring\n• Disease detection\n\nWhat would you like to know?"
        else:
            conversation_manager.set_intent(session_id, intent)
            conversation_manager.add_parameters(session_id, parameters)
            
            missing = nlp_processor.get_missing_parameters(intent, parameters)
            
            if missing:
                conversation_manager.set_missing_params(session_id, missing)
                reply = f"I understand you want {intent.replace('_', ' ')}. "
                reply += nlp_processor.generate_follow_up_question(missing)
            else:
                result = model_router.route_to_model(intent, parameters)
                reply = model_router.format_response(intent, result)
    
    if lang != "en":
        try:
            translator = GoogleTranslator(source='en', target=lang)
            reply = translator.translate(reply)
        except:
            pass
    
    audio = speak(reply, lang)
    return jsonify({"reply": reply, "audio": audio})

@app.route("/voice", methods=["POST"])
def voice():
    if "file" not in request.files:
        return jsonify({"error": "No audio uploaded"})
    file = request.files["file"]
    filepath = os.path.join("static", "uploads", "voice.webm")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    wav_path = filepath.replace(".webm", ".wav")
    os.system(f"ffmpeg -i {filepath} -ar 16000 -ac 1 {wav_path} -y")

    lang = session.get("lang", "en")
    try:
        vosk_model = get_vosk_model(lang)
    except Exception as e:
        return jsonify({"error": str(e)})

    wf = wave.open(wav_path, "rb")
    rec = KaldiRecognizer(vosk_model, wf.getframerate())
    spoken_text = ""
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            spoken_text += " " + result.get("text", "")
    wf.close()
    spoken_text = spoken_text.strip()
    if not spoken_text:
        return jsonify({"error": t("Could not recognize speech")})

    reply = f"You said: {spoken_text}"
    if lang != "en":
        try:
            translator = GoogleTranslator(source='en', target=lang)
            reply = translator.translate(reply)
        except:
            pass
    audio = speak(reply, lang)
    return jsonify({"reply": reply, "audio": audio})

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": t("No file uploaded")})
    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join("static", "uploads", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    result = detect_crop_disease(filepath)
    result["crop"] = t(result["crop"])
    result["status"] = t(result["status"])
    return jsonify(result)

@app.route("/api/query", methods=["POST"])
def api_query():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    processed = nlp_processor.process_query(text)
    intent = processed['intent']
    parameters = processed['parameters']
    
    missing = nlp_processor.get_missing_parameters(intent, parameters)
    
    if missing:
        return jsonify({
            "status": "missing_parameters",
            "intent": intent,
            "collected_parameters": parameters,
            "missing_parameters": missing,
            "next_question": nlp_processor.generate_follow_up_question(missing)
        })
    
    result = model_router.route_to_model(intent, parameters)
    
    return jsonify({
        "status": "success",
        "intent": intent,
        "parameters": parameters,
        "result": result
    })

@app.route("/api/crop_recommendation", methods=["POST"])
def api_crop_recommendation():
    data = request.json
    model = ai_models['crop_recommendation']
    result = model.predict(data)
    return jsonify(result)

@app.route("/api/yield_profit", methods=["POST"])
def api_yield_profit():
    data = request.json
    model = ai_models['yield_profit']
    result = model.predict(data)
    return jsonify(result)

@app.route("/api/sustainability", methods=["POST"])
def api_sustainability():
    data = request.json
    model = ai_models['sustainability']
    result = model.calculate_sustainability_score(data)
    return jsonify(result)

@app.route("/api/disease_detection", methods=["POST"])
def api_disease_detection():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join("static", "uploads", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    
    model = ai_models['disease_detection']
    result = model.predict_disease(image_path=filepath)
    return jsonify(result)

@app.route("/api/model_info", methods=["GET"])
def api_model_info():
    info = {}
    for model_name, model in ai_models.items():
        if hasattr(model, 'get_required_parameters'):
            info[model_name] = {
                'required_parameters': model.get_required_parameters(),
                'is_trained': getattr(model, 'is_trained', True)
            }
    return jsonify(info)

if __name__ == "__main__":
    app.run(debug=True)
