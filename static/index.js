// "a submarine as an oilpainting"
const predictionID = "caol2b2hyndgvo67uqaxjl64dy";

var prompt, promptValue, started, draw;

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
  console.log("step")
  try {
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
  } catch (error) {
    started = false;
    console.log("Caught error:", error);
    return;
  }
  paths = resp["output"];
  step(paths);
  display(paths);
}

function display(paths) {
  draw.clear();
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var pathString = pathToSVGPathString(path);
    draw.path(pathString).attr({
      stroke: strokeColorToSVGStroke(path.stroke_color),
      fill: "none",
      "stroke-width": 2 * path.stroke_width,
      "stroke-opacity": path.stroke_color[3],
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
  }
}

async function changePrompt() {
  promptValue = prompt.value;
  if (!started) {
    started = true;
    step();
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
