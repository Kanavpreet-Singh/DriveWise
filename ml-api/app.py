import os
from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    features = np.array(data['features']).reshape(1, -1)
    prediction = model.predict(features)
    return jsonify({'predicted_price': float(prediction[0])})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use Render's PORT
    app.run(host='0.0.0.0', port=port)