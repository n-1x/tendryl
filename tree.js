class Seed {
  constructor(pos, angle, speed, maxDistance, lastPos = null, level = 0) {
    this.pos = pos.copy()
    this.lastPos = lastPos
    this.angle = angle
    this.level = level
    this.maxDistance = maxDistance
    this.speed = speed
    
    this.distance = 0
    this.dead = false
    //used to track the value for the perlin noise
    this.noiseTracker = Math.random() * 100
  }


  update() {
    //the amount to shift from the tendril's angle by
    let angle = this.angle
    
    if (moveWithNoise) {
      const randomShift = noise(this.noiseTracker) * Math.PI - (Math.PI / 2)
      angle += randomShift
    }

    const vel = createVector(this.speed * cos(angle), this.speed * sin(angle))
    
    this.noiseTracker += 0.01 * this.speed
    this.distance += this.speed

    this.lastPos = this.pos.copy()
    this.pos.add(vel)

    if (this.distance >= this.maxDistance) {
      this.dead = true
    }
  } 
}


class SeedCluster {
  constructor(startPos, numSeeds, circleRadius, splitDistance, lengthRatio, angleOffset, speed, maxLevel) {
    this.center = startPos.copy()
    this.numSeeds = numSeeds
    this.circleRadius = circleRadius
    this.splitDistance = splitDistance
    this.lengthRatio = lengthRatio
    this.angleOffset = angleOffset
    this.speed = speed
    this.maxLevel = maxLevel

    this.seeds = []
    this.distance = 0

    this.generateSeeds()
  }


  generateSeeds() {
    for (let i = 0; i < this.numSeeds; ++i) {
      const angle = i / this.numSeeds * Math.PI * 2
      const pos = createVector(this.circleRadius * cos(angle), this.circleRadius * sin(angle))

      pos.add(this.center)

      this.seeds.push(new Seed(pos, angle + this.angleOffset, this.speed, this.splitDistance))
    }
  }


  updateAndDraw() {
    if (this.seeds.length > 0) {
      this.distance += this.speed

      this.seeds.forEach((s, index) => {
        s.update()
  
        if (s.dead) {
          //spawn new seeds if not at max level
          if (s.level < this.maxLevel) {
            const dist = s.maxDistance * this.lengthRatio
            let dAngle = minSplitAngle

            if (randomiseSplitAngle) {
              dAngle += Math.random() * (maxSplitAngle - minSplitAngle)
            }

            this.seeds.push(new Seed(s.pos.copy(), s.angle + dAngle, s.speed, dist, s.lastPos.copy(), s.level + 1))
            this.seeds.push(new Seed(s.pos.copy(), s.angle - dAngle, s.speed, dist, s.lastPos.copy(), s.level + 1))
          }
  
          //remove the dead seed
          this.seeds.splice(index, 1)
        }

        //draw the seed
        strokeWeight(Math.max(maxThickness - s.level, minThickness))

        let dist
        if (resetColourOnBranch) {
          dist = s.distance / s.maxDistance
        }
        else {
          dist = this.distance / maxLength
        }

        if (s.level !== maxBranches || !colourTips) {
          stroke(colourMix(startColour, endColour, dist))
        }
        else {
          stroke(tipColour)
        }

        if (s.lastPos) {
          line(s.lastPos.x, s.lastPos.y, s.pos.x, s.pos.y)
        }
      })
    }
    
  }
}


//blend between two colours, amount should be from 0 to 1
//0 will return col1, 1 will return col2
function colourMix(col1, col2, amount) {
  const a = createVector(col1[0], col1[1], col1[2])
  const b = createVector(col2[0], col2[1], col2[2])
  
  b.sub(a)
  b.mult(amount)
  a.add(b)
  
  return [a.x, a.y, a.z]
}



//variables to be set by the options form
let bgColour
let startColour
let endColour
let tipColour
let colourTips
let resetColourOnBranch
let moveWithNoise
let randomiseSplitAngle
let initialSeeds
let maxBranches
let innerCircleRadius
let splitDist
let ratio
let angleOffset
let minSplitAngle
let maxSplitAngle
let minThickness
let maxThickness

//fixed/calculated variables
const width = window.innerWidth
const height = window.innerHeight
let maxLength
const speed = 3

let clusters = []

function setup() {
  createCanvas(width, height)
  textSize(50)
  strokeWeight(4)
  noFill()
  
  readOptionsForm()
}


function draw() {
  for (const s of clusters) {
    s.updateAndDraw()
  }
}


function keyPressed() {
  if (keyCode == ('R').charCodeAt(0)) {
    start()
    return false
  }
}


function start() {
  const center = createVector(width/2, height/2)

  readOptionsForm()
  background(bgColour)

  clusters = []
  clusters.push(new SeedCluster(center, initialSeeds, innerCircleR, 
    splitDist, ratio, angleOffset, speed, maxBranches))
}


function readOptionsForm() {
  const form = document.optionsForm
  const a = Math.PI/180 //mult to convert deg to rad

  bgColour = textToArray(form.bgColour.value)
  startColour = textToArray(form.startColour.value)
  endColour = textToArray(form.endColour.value)
  tipColour = textToArray(form.tipColour.value)
  colourTips = form.colourTips.checked
  resetColourOnBranch = form.resetColourOnBranch.checked
  moveWithNoise = form.moveWithNoise.checked
  randomiseSplitAngle = form.randomiseSplitAngle.checked
  initialSeeds = parseInt(form.initialSeeds.value)
  maxBranches = parseInt(form.maxBranches.value)
  innerCircleR = parseInt(form.innerCircleR.value)
  splitDist = parseInt(form.splitDist.value)
  ratio = parseFloat(form.ratio.value)
  angleOffset = parseInt(form.angleOffset.value) * a
  minSplitAngle = parseInt(form.minSplitAngle.value) * a
  maxSplitAngle = parseInt(form.maxSplitAngle.value) * a
  minThickness = parseFloat(form.minThickness.value)
  maxThickness = parseFloat(form.maxThickness.value)

  console.log(splitDist);

  //reset max length in case a significant variable changed
  maxLength = estimateLength(maxBranches)
}


function textToArray(text) {
  const a = []
  let indexCount = 0
  let temp = ""

  text.replace('#', '').split('').forEach((char, i) => {
    temp += char

    if ((i+1)%2==0) {
      a[indexCount] = parseInt(temp, 16)
      temp = ""
      ++indexCount
    }
  })

  return a
}

function estimateLength(n) {
  if (n == 0) {
    return splitDist
  }
  else {
    return splitDist * Math.pow(ratio, n) + estimateLength(n-1)
  }
}