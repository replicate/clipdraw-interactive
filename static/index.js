// "a submarine as an oilpainting"
const predictionID = "caol2b2hyndgvo67uqaxjl64dy";

window.onload = async function() {
  const resp = await fetchPrediction(predictionID);
  console.log("Number of outputs:", resp.output.length)

  const paths = JSON.parse(resp.output[resp.output.length - 1]);

  var draw = SVG().addTo('body').attr({
    viewBox: "-50 -50 324 324",
    width: "100%",
    height: "100%",
  });

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

async function fetchPrediction(predictionID) {
  while (true) {
    var resp = await fetch("/api/get/" + predictionID);
    resp = await resp.json();
    if (resp.status != "starting" && resp.output) {
      return resp
    }
    await new Promise(r => setTimeout(r, 1000));
    console.log("starting...");
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
