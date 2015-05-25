/* globals $ */

// http://stackoverflow.com/questions/15642968/soundcloud-waveform-json-api
// http://www.waveformjs.org/w?url=...&callback=...

function WaveformBars(options) {
  this.bars = [];
  this.progress = 0;
  this.hoverProgress = -1;

  this.barCount = options.barCount || 100;
  this.barMargin = options.barMargin || 1;

  this.defaultColor = options.defaultColor || '#FF851B';
  this.playedColor = options.playedColor || '#FFDC00';
  this.hoverColor = options.hoverColor || '#FF4136';

  this.apiEndpoint = 'http://www.waveformjs.org/w';

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
    if (this.mouseDown === true || this.playing === true) {
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
  this.draw();
};
WaveformBars.prototype.setBarCount = function(count) {
  this.barCount = count;
  this.setData(this.data);
};

WaveformBars.prototype.setTrack = function(track) {
  $.ajax({
    method: 'GET',
    url: this.apiEndpoint + '?url=' + encodeURIComponent(track.waveform_url),
    dataType: 'jsonp'
  })
    .done($.proxy(function(data) {
      this.setData(data);
    }, this))
    .fail(function() {});
};

WaveformBars.prototype.getStreamOptions = function() {
  var that = this;
  return {
    whileplaying: function() {
      that.progress = this.position / this.durationEstimate;
      that.draw();
    },
    whileloading: function() {
      that.playing = true;
      $(that.canvas).addClass('active');
    }
  };
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
  var height = this.canvas.height;


  var bars = this.bars;
  var barCount = bars.length;
  var barMargin = this.barMargin;
  var barWidth = (this.canvas.width - (barMargin * (barCount + 1))) / barCount;

  var shadowMargin = barMargin;
  var shadowRatio = 0.4; // percentage of bar height
  var shadowPart = shadowRatio * 10;

  var barMaxHeight    = (height - shadowMargin) * (10 / (10 + shadowPart));
  var barBottomY = barMaxHeight;
  var shadowTopY = barMaxHeight + shadowMargin;

  var defaultColor = this.defaultColor;
  var defaultColorShadow = lightenHex(defaultColor, 0.7);

  var playedColor = this.playedColor;
  var playedColorShadow = lightenHex(playedColor, 0.7);

  var hoverColor = lerpHex(defaultColor, playedColor, 0.5);

  var sweep = 1 / barCount;
  var progress = this.progress;

  ctx.clearRect(0, 0, this.canvas.width, height);
  for (var i = 0; i < barCount; i++) {

    var barIndex = i / barCount;
    var lerp = (progress - barIndex) / sweep;
    lerp = Math.min(Math.max(lerp, 0), 1);

    var fill = lerpHex(defaultColor, playedColor, lerp);

    var barHeight = barMaxHeight * bars[i];
    var x = i * barWidth +  i * barMargin + barMargin;

    ctx.fillStyle = fill;
    ctx.fillRect(
      x,
      barBottomY - barHeight,
      barWidth,
      barHeight
    );

    ctx.fillStyle = lightenHex(fill, 0.7);
    ctx.fillRect(
      x,
      shadowTopY,
      barWidth,
      barHeight * shadowRatio
    );
  }
};


function lightenHex(hexVal, ratio) {
  if (hexVal[0] === '#') {
    hexVal = hexVal.substr(1);
  }

  var res = '#';
  for (var i = 0, sweep = hexVal.length / 3; i < hexVal.length; i += sweep) {
    var val = parseInt(hexVal.substr(i, sweep), 16); // convert to number
    val *= ratio; // lighten by ratio
    res += hexFromDec(val);
  }

  return res;
}
function lerpHex(hexA, hexB, t) {
  if (hexA[0] === '#') { hexA = hexA.substr(1); }
  if (hexB[0] === '#') { hexB = hexB.substr(1); }

  var res = '#';

  for (var i = 0; i < 6; i+= 2) {
    var a = parseInt(hexA.substr(i, 2), 16);
    var b = parseInt(hexB.substr(i, 2), 16);
    var lerp = a + (b - a) * t;
    res += hexFromDec(lerp);
  }

  return res;
}
function hexFromDec(b) {
  b = Math.min(Math.max(Math.round(b), 0), 255).toString(16);
  return b.length === 1 ? '0' + b : b;
}