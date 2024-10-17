from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bmi_results.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define the BMIResult model
class BMIResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    weight = db.Column(db.Float, nullable=False)
    height = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'weight': self.weight,
            'height': self.height,
            'bmi': self.bmi,
            'category': self.category,
            'color': self.color,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }

@app.route('/')
def index():
    return render_template('bmi.html')

@app.route('/calculate', methods=['POST'])
def calculate_bmi():
    try:
        data = request.get_json()
        weight = float(data.get('weight'))
        height = float(data.get('height')) / 100  # Convert cm to meters

        if height <= 0 or weight <= 0:
            return jsonify({'error': 'Height and weight must be positive numbers.'}), 400

        bmi = round(weight / (height ** 2), 2)

        # Determine the category
        if bmi < 18.5:
            category = "Underweight"
            color = "#f0ad4e"  # Orange
        elif 18.5 <= bmi < 24.9:
            category = "Normal weight"
            color = "#5cb85c"  # Green
        elif 25 <= bmi < 29.9:
            category = "Overweight"
            color = "#f0ad4e"  # Orange
        else:
            category = "Obesity"
            color = "#d9534f"  # Red

        # Save the result to the database
        bmi_result = BMIResult(weight=weight, height=height, bmi=bmi, category=category, color=color)
        db.session.add(bmi_result)
        db.session.commit()

        return jsonify({'bmi': bmi, 'category': category, 'color': color}), 200

    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid input. Please enter numeric values for weight and height.'}), 400

@app.route('/history', methods=['GET'])
def get_history():
    # Retrieve the last 10 BMI results
    results = BMIResult.query.order_by(BMIResult.timestamp.desc()).limit(10).all()
    results_list = [result.to_dict() for result in results]
    return jsonify(results_list), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

