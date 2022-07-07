// "a submarine as an oilpainting"
const predictionID = "caol2b2hyndgvo67uqaxjl64dy";

var prompt, promptValue, started, draw, svgPaths;

window.onload = async function() {
  draw = SVG().addTo('body').attr({
    viewBox: "-10 -10 234 234",
    width: "100%",
    height: "100%",
  });

  prompt = document.querySelector("#prompt");
  prompt.onblur = changePrompt;
  prompt.onkeypress = (e) => {
    if (e.code == "Enter") {
      prompt.blur();
    }
  };
}

async function step(paths) {
  console.log("step");
  try {
    const predictionID = await startPrediction(paths);
    paths = await waitForPrediction(predictionID);
  } catch (error) {
    started = false;
    svgPaths = null;
    console.log("Caught error:", error);
    return;
  }
  step(paths);
  display(paths);
}

async function startPrediction(paths) {
  var resp = await fetch("/api/predict", {
    method: "POST",
    body: JSON.stringify({
      prompt: promptValue,
      starting_paths: paths,
    }),
    headers: {
      "Content-type": "application/json"
    }
  })
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  resp = await resp.json();
  return resp["prediction_id"]
}

async function waitForPrediction(predictionID) {
  while (true) {
    var resp = await fetch(`/api/predictions/${predictionID}`);
    var resp = await resp.json();
    const status = resp["status"]
    switch (status) {
      case "succeeded":
        return resp["output"];
      case "failed":
      case "canceled":
        throw new Error("Prediction " + status);
      case "starting":
        await new Promise(r => setTimeout(r, 1000));
        break;
      default:
        await new Promise(r => setTimeout(r, 100));
    }
  }
}

function display(paths) {
  if (svgPaths == null) {
    document.getElementById("loading").classList.remove("shown");
    draw.clear();
    svgPaths = [];
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var pathString = pathToSVGPathString(path);
      const svgPath = draw.path(pathString).attr({
        stroke: strokeColorToSVGStroke(path.stroke_color),
        fill: "none",
        "stroke-width": 2 * path.stroke_width,
        "stroke-opacity": path.stroke_color[3],
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      svgPaths.push(svgPath);
    }
  } else {
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var pathString = pathToSVGPathString(path);
      const svgPath = svgPaths[i];
      svgPath.animate(7000, 0, "now").ease("-").plot(pathString);
      svgPath.animate(7000, 0, "now").attr({
        stroke: strokeColorToSVGStroke(path.stroke_color),
        "stroke-width": 2 * path.stroke_width,
        "stroke-opacity": path.stroke_color[3],
      });
    }
  }
}

async function changePrompt() {
  promptValue = prompt.value;
  if (!started) {
    started = true;
    step();
    document.getElementById("loading").classList.add("shown");
  }
}

function strokeColorToSVGStroke(strokeColor) {
  return "rgb(" + strokeColor.slice(0, 3).map(c => Math.floor(c * 255)).join(",") + ")";
}

function pathToSVGPathString(path) {
  const points = path.points;
  var s = "M " + points[0][0] + " " + points[0][1];
  for (var i = 0; i < path.num_control_points.length; i++) {
    s += " C"
      + " " + points[i * 3 + 1][0]
      + " " + points[i * 3 + 1][1]
      + " " + points[i * 3 + 2][0]
      + " " + points[i * 3 + 2][1]
      + " " + points[i * 3 + 3][0]
      + " " + points[i * 3 + 3][1];
  }
  return s;
}
