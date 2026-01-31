import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import json

MODEL_PATH = "models/best_disease_model.keras"
IMAGE_PATH = "Disease.jpg"
IMG_SIZE = (224, 224) 
CLASS_NAMES = ["Pepper__bell___Bacterial_spot", "class1", "class2", "class3", "class4", "class5", "class6", "class7", "class8", "class9", "class10", "class11", "class12", "class13", "class14"]
with open("models/disease_params.json") as f:
    params = json.load(f)
    CLASS_NAMES = [params["idx_to_class"][str(i)] for i in range(len(params["idx_to_class"]))]

model = tf.keras.models.load_model(MODEL_PATH)

img = image.load_img(IMAGE_PATH, target_size=IMG_SIZE)
img_array = image.img_to_array(img)
img_array = img_array / 255.0      
img_array = np.expand_dims(img_array, axis=0) 

predictions = model.predict(img_array)

print("Prediction shape:", predictions.shape)

if predictions.shape[-1] == 1:
    confidence = predictions[0][0]
    predicted_class = CLASS_NAMES[int(confidence > 0.5)]
else:
    class_id = int(np.argmax(predictions))
    predicted_class = CLASS_NAMES[class_id]
    confidence = predictions[0][class_id]

print("Predicted:", predicted_class)
print("Confidence:", confidence)