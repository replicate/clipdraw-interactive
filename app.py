import time
import os
import requests
from flask import Flask, jsonify, render_template, send_from_directory, request, abort

app = Flask(__name__)

token = os.environ["REPLICATE_API_TOKEN"]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/predict", methods=["POST"])
def start_prediction():
    body = request.get_json()
    prompt = body["prompt"]
    starting_paths = body.get("starting_paths", "")

    resp = requests.post(
        "https://api.replicate.com/v1/predictions",
        json={
            "input": {
                "prompt": prompt,
                "num_iterations": 5,
                "display_frequency": 5,
                "num_paths": 236,
                "starting_paths": starting_paths,
            },
            "version": "9c193bfa1213b1656dedb3055d349df4b71c1b859ad6c7c564141a36a78fa898",
        },
        headers={
            "Authorization": "Token " + token,
            "Content-Type": "application/json",
        },
    ).json()
    prediction_url = resp["urls"]["get"]

    print("prediction_url", prediction_url)

    while True:
        resp = requests.get(prediction_url)
        try:
            prediction = resp.json()
        except Exception:
            import ipdb; ipdb.set_trace(context=11)
        status = prediction["status"]
        if status == "succeeded":
            return jsonify({"output": prediction["output"][-1]})
        if status in ("failed", "cancelled"):
            import ipdb; ipdb.set_trace(context=11)
            abort(500)

        time.sleep(.1)
        print("status", status)


@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)


if __name__ == "__main__":
    app.run(debug=True)
