var Project = () => {
  console.error('In this version of Woof, please use "Woof.Project" instead of "Project"');
};

var Woof = {};

Woof.keyCodeToString = keyCode => {
  if (keyCode == 38) {
    return "UP";
  } else if (keyCode == 37) {
    return "LEFT";
  } else if (keyCode == 39) {
    return "RIGHT";
  } else if (keyCode == 40) {
    return "DOWN";
  } else {
    return String.fromCharCode(keyCode);
  }
};

Woof.unitsToMiliseconds = (time, units) => {
  if (units == "milliseconds" || units == "millisecond") {
    return time;
  } else if (units == "seconds" || units == "second") {
    return time * 1000;
  } else if (units == "minutes" || units == "minute") {
    return time * 1000 * 60;
  } else {
    throw Error("Unrecognized Time");
  }
};

Woof.randomInt = (low, high) => {
  return Math.floor(Math.random() * high + low);
};

Woof.Project = function (canvasId) {
  this.sprites = [];
  this.backdrops = [];
  this.backdrop = 0;

  try {
    this._canvas = document.getElementById(canvasId);
  } catch (e) {
    console.error(e);
    console.error("Could not find a canvas on the page with id " + canvasId);
    return null;
  }
  this._context = this._canvas.getContext("2d");
  this.height = this._canvas.height;
  this.width = this._canvas.width;

  this._render = function () {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._renderBackdrop();
    this._renderSprites();
  };

  this._renderBackdrop = function () {
    if (this.backdrops[this.backdrop]) {
      var image = this.backdrops[this.backdrop];
      this._context.drawImage(image, 0, 0);
    }
  };

  this._renderSprites = () => {
    this.sprites.forEach(sprite => {
      sprite._render(this);
    });
  };

  this.addSprite = function () {
    var sprite = new Woof.Sprite(this);
    this.sprites.push(sprite);
    return sprite;
  };

  this.addTextSprite = function () {
    var sprite = new Woof.TextSprite(this);
    this.sprites.push(sprite);
    return sprite;
  };

  this.addCircleSprite = function () {
    var sprite = new Woof.CircleSprite(this);
    this.sprites.push(sprite);
    return sprite;
  };

  this.addBackdropURL = function (url) {
    var backdrop = new Image();
    backdrop.src = url;
    this.backdrops.push(backdrop);
  };

  this.stopAll = () => {
    this._render();
    clearInterval(renderInterval);

    this._everys.forEach(clearInterval);
    this._afters.forEach(clearInterval);

    this.sprites.forEach(sprite => sprite.delete());
  };

  this.mouseDown = false;
  this.mouseX = 0;
  this.mouseY = 0;
  this._canvas.addEventListener("mousedown", event => {
    this.mouseDown = true;
    this.mouseX = event.clientX - this._canvas.offsetLeft;
    this.mouseY = event.clientY - this._canvas.offsetTop;
  });
  this._canvas.addEventListener("mouseup", event => {
    this.mouseDown = false;
    this.mouseX = event.clientX - this._canvas.offsetLeft;
    this.mouseY = event.clientY - this._canvas.offsetTop;
  });
  this._canvas.addEventListener("touchstart", event => {
    this.mouseDown = true;
    this.mouseX = event.targetTouches[0].clientX - this._canvas.offsetLeft;
    this.mouseY = event.targetTouches[0].clientY - this._canvas.offsetTop;
  });
  this._canvas.addEventListener("touchend", event => {
    // for some reason touchend events are firing too quickly
    // and are not getting picked up in 40 ms every-if's
    // so this setTimeout slows things down just enouch so
    // touch events mirror mouse events
    setTimeout(() => {
      this.mouseDown = false;
    }, 0);
  });
  this._canvas.addEventListener("mousemove", event => {
    this.mouseX = event.clientX - this._canvas.offsetLeft;
    this.mouseY = event.clientY - this._canvas.offsetTop;
  });
  this._canvas.addEventListener("touchmove", event => {
    this.mouseX = event.targetTouches[0].clientX - this._canvas.offsetLeft;
    this.mouseY = event.targetTouches[0].clientY - this._canvas.offsetTop;
    event.preventDefault();
  });

  this.keysDown = [];
  this._canvas.addEventListener("keydown", event => {
    var key = Woof.keyCodeToString(event.keyCode);
    if (!this.keysDown.includes(key)) {
      this.keysDown.push(key);
    }
  });
  this._canvas.addEventListener("keyup", event => {
    var key = Woof.keyCodeToString(event.keyCode);
    if (this.keysDown.includes(key)) {
      this.keysDown.splice(this.keysDown.indexOf(key), 1);
    }
  });

  this._everys = [];
  this.every = (time, units, func) => {
    func();
    this._everys.push(setInterval(func, Woof.unitsToMiliseconds(time, units)));
  };

  this._afters = [];
  this.after = (time, units, func) => {
    this._afters.push(setTimeout(func, Woof.unitsToMiliseconds(time, units)));
  };

  this._onloads = [];
  document.body.addEventListener("onload", event => {
    this._onloads.forEach(func => {
      func.call();
    });
  });

  var renderInterval = setInterval(() => {
    try {
      this._render();
    } catch (e) {
      console.error(e);
      console.error("Error in render: " + e.message);
      clearInterval(renderInterval);
    }
  }, 40);
};

Woof.Sprite = function (project) {
  this.project = project;

  this.xPosition = 0;
  this.yPosition = 0;

  this.angle = 0;

  this.costumes = [];
  this.costume = 0;
  this.height = null;
  this.width = null;

  this.rotationStyle = "ROTATE";

  this.showing = true;

  this.addCostumeURL = function (url) {
    var costume = new Image();
    costume.src = url;
    this.costumes.push(costume);
    return this.costumes.length - 1;
  };

  this._render = function () {
    var angle;
    if (this.rotationStyle == "ROTATE") {
      angle = this.angle;
    } else if (this.rotationStyle == "NO ROTATE") {
      angle = 0;
    }

    if (this.showing) {
      this.project._context.save();
      this.project._context.translate(this.xPosition, this.yPosition);
      this.project._context.rotate(angle * Math.PI / 180);

      if (this.currentCostume() && this.currentCostume().nodeName == "IMG") {
        this.project._context.drawImage(this.currentCostume(), -this.width() / 2, -this.height() / 2);
      } else if (this instanceof Woof.TextSprite) {
        this.textRender();
      } else if (this instanceof Woof.CircleSprite) {
        this.circleRender();
      }
      this.project._context.restore();
    }
  };

  this.move = function (steps) {
    this.xPosition += steps * Math.cos(this.angle * Math.PI / 180);
    this.yPosition += steps * Math.sin(this.angle * Math.PI / 180);
  };

  this.setRotationStyle = style => {
    if (style == "ROTATE") {
      this.rotationStyle = "ROTATE";
    } else if (style == "NO ROTATE") {
      this.rotationStyle = "NO ROTATE";
    } else {
      throw Error("Unrecognized rotation style: " + style);
    }
  };

  this.bounds = () => {
    var leftBounds = this.xPosition - this.width() / 2;
    var rightBounds = this.xPosition + this.width() / 2;
    var topBounds = this.yPosition - this.height() / 2;
    var bottomBounds = this.yPosition + this.height() / 2;
    return { left: leftBounds, right: rightBounds, top: topBounds, bottom: bottomBounds };
  };

  this.touching = sprite => {
    var r1 = this.bounds();
    var r2 = sprite.bounds();

    return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
  };

  this.mouseOver = function () {
    // TODO account for rotation
    var belowTop = this.project.mouseY >= this.yPosition - this.height() / 2;
    var aboveBottom = this.project.mouseY <= this.yPosition + this.height() / 2;
    var rightLeft = this.project.mouseX >= this.xPosition - this.width() / 2;
    var leftRight = this.project.mouseX <= this.xPosition + this.width() / 2;
    return belowTop && aboveBottom && rightLeft && leftRight;
  };

  this.currentCostume = () => {
    return this.costumes[this.costume];
  };

  this.sendToBack = () => {
    var sprites = this.project.sprites;
    sprites.splice(0, 0, sprites.splice(sprites.indexOf(this), 1)[0]);
  };

  this.sendToFront = () => {
    var sprites = this.project.sprites;
    sprites.splice(sprites.length, 0, sprites.splice(sprites.indexOf(this), 1)[0]);
  };

  this.pointTowards = (x2, y2) => {
    var x1 = this.xPosition;
    var y1 = this.yPosition;

    this.angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  };

  this.height = () => {
    return this.currentCostume().height;
  };

  this.width = () => {
    return this.currentCostume().width;
  };

  this.delete = () => {
    if (this.project.sprites.includes(this)) {
      this.project.sprites.splice(this.project.sprites.indexOf(this), 1);
      this._everys.forEach(clearInterval);
      this._afters.forEach(clearInterval);
    }
  };
};

Woof.TextSprite = function (project) {
  Woof.Sprite.call(this, project);
  this.text = "";
  this.fontSize = 12;
  this.fontColor = "black";
  this.fontFamily = "Arial";
  this.textAlign = "left";

  this.width = () => {
    var width;
    this._applyInContext(() => {
      width = this.project._context.measureText(this.text).width;
    });
    return width;
  };

  this.height = () => {
    var height;
    this._applyInContext(() => {
      height = this.project._context.measureText("M").width;
    });
    return height;
  };

  this._applyInContext = func => {
    this.project._context.save();

    this.project._context.font = this.fontSize + "px " + this.fontFamily;
    this.project._context.fillStyle = this.fontColor;
    this.project._context.textAlign = this.textAlign;

    func();

    this.project._context.restore();
  };

  this.textRender = () => {
    this._applyInContext(() => {
      this.project._context.fillText(this.text, 0, 0);
    });
  };
};

Woof.CircleSprite = function (project) {
  Woof.Sprite.call(this, project);
  this.radius = 10;
  this.color = "black";

  this.width = () => {
    return 2 * this.radius;
  };

  this.height = () => {
    return 2 * this.radius;
  };

  this.circleRender = () => {
    this.project._context.beginPath();
    this.project._context.arc(0, 0, this.radius, 0, 2 * Math.PI);
    this.project._context.fillStyle = this.color;
    this.project._context.fill();
  };
};
