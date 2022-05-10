import os
import requests
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__)

token = os.environ["REPLICATE_API_TOKEN"]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/start", methods=["POST"])
def start_prediction():
    resp = requests.post(
        "https://api.replicate.com/v1/predictions",
        json={
            "input": {"prompt": "a submarine as an oilpainting"},
            "version": "9c193bfa1213b1656dedb3055d349df4b71c1b859ad6c7c564141a36a78fa898",
        },
        headers={
            "Authorization": "Token " + token,
            "Content-Type": "application/json",
        },
    )
    return jsonify(resp.json())


@app.route("/api/get/<prediction_id>")
def get_prediction(prediction_id):
    resp = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}")
    return jsonify(resp.json())


@app.route("/static/<path:path>")
def send_report(path):
    return send_from_directory("static", path)


if __name__ == "__main__":
    app.run(debug=True)
