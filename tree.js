//variables to be set by the options form
let bgColour = NaN;
let startColour = NaN;
let endColour = NaN;
let tipColour = NaN;
let colourTips = NaN;
let resetColourOnBranch = NaN;
let moveWithNoise = NaN;
let randomiseSplitAngle = NaN;
let initialSeeds = NaN;
let maxBranches = NaN;
let innerCircleRadius = NaN;
let splitDist = NaN;
let ratio = NaN;
let angleOffset = NaN;
let minSplitAngle = NaN;
let maxSplitAngle = NaN;
let startThickness = NaN;
let endThickness = NaN;

const width = window.innerWidth;
const height = window.innerHeight;
let maxLength;
const speed = 6;

let ctx = null;
let clusters = [];
let lastFrameTimestamp = 0;

class Seed {
  constructor(pos, angle, speed, maxDistance, lastPos = null, level = 0) {
    this.pos = pos;
    this.lastPos = lastPos;
    this.angle = angle;
    this.level = level;
    this.maxDistance = maxDistance;
    this.speed = speed;
    
    this.distance = 0;
    this.dead = false;
    //used to track the value for the perlin noise
    this.noiseTracker = Math.random() * 100.;
  }


  update(dt) {
    //the amount to shift from the tendril's angle by
    let angle = this.angle;
    
    if (moveWithNoise) {
      alert("NYI: noise");
      const randomShift = 0;//noise(this.noiseTracker) * Math.PI - (Math.PI / 2.);
      angle += randomShift;
    }
    const vel = [this.speed * Math.cos(angle), this.speed * Math.sin(angle)];
    
    this.noiseTracker += 0.01 * this.speed;
    this.distance += this.speed;

    this.lastPos = this.pos;
    this.pos = arrayAdd(this.pos, vel);

    if (this.distance >= this.maxDistance) {
      this.dead = true;
    }
  } 
}


class SeedCluster {
  constructor(startPos, numSeeds, circleRadius, splitDistance, lengthRatio, angleOffset, speed, maxLevel) {
    this.center = startPos;
    this.numSeeds = numSeeds;
    this.circleRadius = circleRadius;
    this.splitDistance = splitDistance;
    this.lengthRatio = lengthRatio;
    this.angleOffset = angleOffset;
    this.speed = speed;
    this.maxLevel = maxLevel;

    this.seeds = [];
    this.distance = 0;

    this.generateSeeds();
  }


  generateSeeds() {
    for (let i = 0.; i < this.numSeeds; ++i) {
      const angle = i / this.numSeeds * Math.PI * 2.;
      let pos = [
        this.circleRadius * Math.cos(angle), 
        this.circleRadius * Math.sin(angle)
      ];

      pos = arrayAdd(pos, this.center);

      this.seeds.push(new Seed(pos, angle + this.angleOffset, this.speed, this.splitDistance))
    }
  }


  updateAndDraw(dt) {
    if (this.seeds.length > 0) {
      this.distance += this.speed

      this.seeds.forEach((s, index) => {
        s.update(dt)
  
        if (s.dead) {
          //spawn new seeds if not at max level
          if (s.level < this.maxLevel) {
            const dist = s.maxDistance * this.lengthRatio
            let dAngle = minSplitAngle

            if (randomiseSplitAngle) {
              dAngle += Math.random() * (maxSplitAngle - minSplitAngle)
            }

            this.seeds.push(new Seed(s.pos, s.angle + dAngle, s.speed, dist, s.lastPos, s.level + 1))
            this.seeds.push(new Seed(s.pos, s.angle - dAngle, s.speed, dist, s.lastPos, s.level + 1))
          }
  
          //remove the dead seed
          this.seeds.splice(index, 1)
        }

        ctx.lineWidth = lerp(startThickness, endThickness, s.level / maxBranches);
 
        const dist = resetColourOnBranch ? 
          s.distance / s.maxDistance :
          this.distance / maxLength;

        if (s.level !== maxBranches || !colourTips) {
          const l = arrayIntLerp(startColour, endColour, dist);
          const t = arrayToText(l);
          ctx.strokeStyle = t;
        }
        else {
          ctx.strokeStyle = arrayToText(tipColour);
        }

        if (s.lastPos) {
          ctx.beginPath();
          ctx.moveTo(s.lastPos[0], s.lastPos[1]);
          ctx.lineTo(s.pos[0], s.pos[1]);
          ctx.stroke();
        }
      })
    }
    
  }
}


window.addEventListener("DOMContentLoaded", () => {
  ctx = canv.getContext("2d");
  start();
  window.requestAnimationFrame(draw);
});


window.onresize = () => {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  start();
};


document.addEventListener("keypress", e => {
  if (e.key.toLowerCase() === ('r')) {
    start();
    return false;
  }
});


function start() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  ctx.font = "1rem Monospace";
  ctx.lineJoin = "miter";
  ctx.lineCap = "round";
  
  const center = [ctx.canvas.width/2., ctx.canvas.height/2.];
  readOptionsForm();
  ctx.fillStyle = arrayToText(bgColour);
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  clusters = [];
  clusters.push(new SeedCluster(center, initialSeeds, innerCircleR, 
    splitDist, ratio, angleOffset, speed, maxBranches));

  lastFrameTimestamp = 0;
}


function draw(timestamp) {
  const dt = (timestamp - lastFrameTimestamp) / 1000.;
  lastFrameTimestamp = timestamp;

  for (const s of clusters) {
    s.updateAndDraw();
  }
  
  window.requestAnimationFrame(draw);
}


function readOptionsForm() {
  const form = document.optionsForm;
  const a = Math.PI/180; //mult to convert deg to rad

  bgColour = textToArray(form.bgColour.value);
  startColour = textToArray(form.startColour.value);
  endColour = textToArray(form.endColour.value);
  tipColour = textToArray(form.tipColour.value);
  colourTips = form.colourTips.checked;
  resetColourOnBranch = form.resetColourOnBranch.checked;
  moveWithNoise = form.moveWithNoise.checked;
  randomiseSplitAngle = form.randomiseSplitAngle.checked;
  initialSeeds = parseInt(form.initialSeeds.value);
  maxBranches = parseInt(form.maxBranches.value);
  innerCircleR = parseInt(form.innerCircleR.value);
  splitDist = parseInt(form.splitDist.value);
  ratio = parseFloat(form.ratio.value);
  angleOffset = parseInt(form.angleOffset.value) * a;
  minSplitAngle = parseInt(form.minSplitAngle.value) * a;
  maxSplitAngle = parseInt(form.maxSplitAngle.value) * a;
  startThickness = parseFloat(form.startThickness.value);
  endThickness = parseFloat(form.endThickness.value);

  //reset max length in case a significant variable changed
  maxLength = estimateLength(maxBranches);
}


// used for converting a hex colourString e.g. "#2a002a"
// to an array of colour values.
function textToArray(text) {
  const a = [];
  let indexCount = 0;
  let temp = "";

  text.substring(1).split('').forEach((char, i) => {
    temp += char;

    if ((i + 1) % 2 === 0) {
      a[indexCount] = parseInt(temp, 16);
      temp = "";
      ++indexCount;
    }
  })

  return a;
}


//used to convert back from array of colour values to a 
//hex string. Array should only contain numbers
//from 0 - 255, but no checks are done
function arrayToText(array) {
  return "#" + array.map(x => x.toString(16).padStart(2, "0")).join("");
}


function estimateLength(n) {
  if (n == 0) {
    return splitDist;
  }
  else {
    return splitDist * Math.pow(ratio, n) + estimateLength(n-1);
  }
}


function lerp(a, b, x) {
  return a + (b-a) * x;
}


//lerp two arrays, for mixing colours
function arrayIntLerp(a, b, x) {
  return a.map((v, i) => Math.round(lerp(v, b[i], x)));
}


function arrayAdd(a, b) {
  return a.map((x, i) => x + b[i]);
}