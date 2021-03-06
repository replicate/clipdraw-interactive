import json
import replicate
from flask import (
    Flask,
    jsonify,
    render_template,
    send_from_directory,
    request,
)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/predict", methods=["POST"])
def predict():
    body = request.get_json()
    prompt = body["prompt"]
    starting_paths = body.get("starting_paths", "")
    starting_paths = hack_ints_to_floats(starting_paths)

    model = replicate.models.get("evilstreak/clipdraw-interactive")
    version = model.versions.get(
        "8feca8c65270d6ea1b30080a5dc31382afc8316c895299add625ff97a789554c"
    )

    prediction = replicate.predictions.create(
        version=version,
        input={
            "prompt": prompt,
            "num_iterations": 20,
            "num_paths": 64,
            "starting_paths": starting_paths,
        },
    )

    return jsonify({"prediction_id": prediction.id})


@app.route("/api/predictions/<prediction_id>", methods=["GET"])
def get_prediction(prediction_id):
    prediction = replicate.predictions.get(prediction_id)
    output = None
    if prediction.output:
        output = json.loads(prediction.output)
    return jsonify({"output": output, "status": prediction.status})


@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)


def hack_ints_to_floats(starting_paths):
    if starting_paths:
        # hack json to all be floating points.
        # TODO: this should happen in the model itself
        for path in starting_paths:
            if path["stroke_width"] == int(path["stroke_width"]):
                path["stroke_width"] += 0.00001
            for i, color in enumerate(path["stroke_color"]):
                if color == int(color):
                    path["stroke_color"][i] += 0.00001
            for i, point in enumerate(path["points"]):
                for j, p in enumerate(point):
                    if p == int(p):
                        path["points"][i][j] += 0.00001

        return json.dumps(starting_paths)


if __name__ == "__main__":
    app.run(debug=True)
