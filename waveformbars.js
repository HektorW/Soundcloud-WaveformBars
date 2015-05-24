

function WaveformBars(options) {
  this.bars = [];
  this.progress = 0;
  this.hoverProgress = -1;

  this.barCount = options.barCount || 100;
  this.barMargin = options.barMargin || 1;

  this.defaultColor = options.defaultColor || '#FF851B';
  this.playedColor = options.playedColor || '#FFDC00';
  this.hoverColor = options.hoverColor || '#FF4136';

  this.canvas = options.canvas;
  this.ctx = this.canvas.getContext('2d');

  if (options.data) {
    this.setData(options.data);
  }

  this.bindEvents();
}

WaveformBars.prototype.bindEvents = function() {
  var $canvas = $(this.canvas);

  var mousemove = $.proxy(function(event) {
    if (this.mouseDown === true) {
      var offset = $canvas.offset();
      this.hoverProgress = Math.min(event.pageX - offset.left, this.canvas.width) / this.canvas.width;
      this.draw();
    }
  }, this);

  $canvas.on('mousemove', mousemove);

  $canvas.on('mousedown', $.proxy(function(event) {
    this.mouseDown = true;
    mousemove(event);
  }, this));
  $(window).on('mouseup', $.proxy(function(event) {
    if (this.mouseDown) {
      this.mouseDown = false;
      this.progress = this.hoverProgress;
      this.hoverProgress = -1;
      this.draw();
    }
  }, this));
};

WaveformBars.prototype.setData = function(data) {
  this.data = data;
  this.bars = this.calulcateBars(data, this.barCount);
};

WaveformBars.prototype.calulcateBars = function(data, barCount) {
  var bars = new Array(barCount);

  var sweep = data.length / barCount;
  var current = 0.0;
  for (var i = 0; i < barCount; i++) {

    var sweepLeft = sweep;
    var barTotal = 0.0;

    while (sweepLeft > 0) {
      var amount = Math.min(sweepLeft, toNextInt(current));
      barTotal += data[Math.floor(current)] * amount;
      current += amount;
      sweepLeft -= amount;
    }

    bars[i] = barTotal / sweep;
  }

  function toNextInt(n) {
    return n % 1 === 0 ? 1 : (n - Math.floor(n));
  }

  return bars;
};


WaveformBars.prototype.draw = function() {
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  var bars = this.bars;
  var barMargin = this.barMargin;
  var barWidth = (this.canvas.width - (barMargin * (bars.length + 1))) / bars.length;

  var height = this.canvas.height;

  for (var i = 0; i < bars.length; i++) {

    if (i / bars.length < this.progress) {
      ctx.fillStyle = this.playedColor;
    } else if (i / bars.length <= this.hoverProgress) {
      ctx.fillStyle = this.hoverColor;
    } else {
      ctx.fillStyle = this.defaultColor;
    }

    var h = height * bars[i];
    var x = i * barWidth +  i * barMargin + barMargin;
    var y = height - h;
    ctx.fillRect(
      x,
      y,
      barWidth,
      h
    );
  }
};