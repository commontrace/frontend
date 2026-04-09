(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.HeroAnimation = function () {};
    return;
  }

  var LIGHT_COLORS = [
    { r: 51, g: 102, b: 204 },   // Wikipedia blue
    { r: 70, g: 130, b: 180 },   // Steel blue
    { r: 100, g: 149, b: 237 },  // Cornflower
    { r: 180, g: 155, b: 80 },   // Antique gold
    { r: 160, g: 140, b: 100 },  // Muted gold
    { r: 121, g: 92, b: 178 },   // Muted purple
  ];

  var DARK_COLORS = [
    { r: 88, g: 166, b: 255 },   // Bright blue
    { r: 121, g: 192, b: 255 },  // Light blue
    { r: 139, g: 233, b: 253 },  // Cyan
    { r: 188, g: 140, b: 255 },  // Purple
    { r: 210, g: 168, b: 255 },  // Soft purple
    { r: 180, g: 155, b: 80 },   // Antique gold
  ];

  function isDarkTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  var CONFIG = {
    layers: 7,
    nodesPerLayer: [6, 10, 14, 16, 14, 10, 6],
    nodeMinSize: 2,
    nodeMaxSize: 4,
    connectionOpacity: 0.06,
    connectionMouseOpacity: 0.22,
    mouseRadius: 200,
    mouseRadiusMobile: 130,
    floatAmplitude: 8,
    floatSpeed: 0.003,
    pulseSpeed: 0.008,
    fps: 60,
  };

  function HeroAnimation(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.nodes = [];
    this.connections = [];
    this.mouse = { x: -1000, y: -1000, active: false };
    this.raf = null;
    this.lastFrame = 0;
    this.frameInterval = 1000 / CONFIG.fps;
    this.isMobile = window.innerWidth < 768;
    this.pulseWaves = [];
    this.time = 0;

    this._resize();
    this._createNetwork();
    this._bindEvents();
    this._observeTheme();
    this._loop();
  }

  HeroAnimation.prototype._resize = function () {
    var rect = this.canvas.parentElement.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.isMobile = window.innerWidth < 768;
  };

  HeroAnimation.prototype._createNetwork = function () {
    var colors = isDarkTheme() ? DARK_COLORS : LIGHT_COLORS;
    var layers = this.isMobile ? 5 : CONFIG.layers;
    var nodesPerLayer = this.isMobile
      ? [4, 6, 8, 6, 4]
      : CONFIG.nodesPerLayer;
    var w = this.width;
    var h = this.height;
    var marginX = w * 0.08;
    var layerSpacing = (w - marginX * 2) / (layers - 1);

    this.nodes = [];
    this.connections = [];

    // Create nodes in layers
    for (var l = 0; l < layers; l++) {
      var count = nodesPerLayer[l];
      var x = marginX + l * layerSpacing;
      var totalH = h * 0.7;
      var startY = (h - totalH) / 2;
      var nodeSpacing = totalH / (count + 1);

      for (var n = 0; n < count; n++) {
        var y = startY + (n + 1) * nodeSpacing;
        var color = colors[Math.floor(Math.random() * colors.length)];
        this.nodes.push({
          baseX: x,
          baseY: y,
          x: x,
          y: y,
          layer: l,
          size: CONFIG.nodeMinSize + Math.random() * (CONFIG.nodeMaxSize - CONFIG.nodeMinSize),
          baseAlpha: isDarkTheme() ? (0.3 + Math.random() * 0.4) : (0.2 + Math.random() * 0.35),
          alpha: 0,
          color: color,
          phase: Math.random() * Math.PI * 2,
          floatPhaseX: Math.random() * Math.PI * 2,
          floatPhaseY: Math.random() * Math.PI * 2,
          renderSize: 0,
        });
      }
    }

    // Create connections between adjacent layers (random subset)
    for (var i = 0; i < this.nodes.length; i++) {
      for (var j = i + 1; j < this.nodes.length; j++) {
        var a = this.nodes[i];
        var b = this.nodes[j];
        // Only connect adjacent layers
        if (Math.abs(a.layer - b.layer) !== 1) continue;
        // Random subset: ~40% of possible connections
        if (Math.random() > 0.4) continue;
        this.connections.push({ from: i, to: j });
      }
    }
  };

  HeroAnimation.prototype._update = function () {
    this.time += 1;
    var mouseR = this.isMobile ? CONFIG.mouseRadiusMobile : CONFIG.mouseRadius;

    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];

      // Gentle floating
      node.x = node.baseX + Math.sin(this.time * CONFIG.floatSpeed + node.floatPhaseX) * CONFIG.floatAmplitude;
      node.y = node.baseY + Math.cos(this.time * CONFIG.floatSpeed * 0.7 + node.floatPhaseY) * CONFIG.floatAmplitude * 0.6;

      // Pulse alpha
      node.phase += CONFIG.pulseSpeed;
      node.alpha = node.baseAlpha + Math.sin(node.phase) * 0.08;
      node.renderSize = node.size;

      // Mouse interaction
      if (this.mouse.active) {
        var dx = this.mouse.x - node.x;
        var dy = this.mouse.y - node.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseR) {
          var factor = 1 - dist / mouseR;
          node.alpha = Math.min(0.9, node.alpha + factor * 0.45);
          node.renderSize = node.size * (1 + factor * 1.2);
          // Slight attraction
          node.x += dx * factor * 0.015;
          node.y += dy * factor * 0.015;
        }
      }
    }
  };

  HeroAnimation.prototype._drawConnections = function () {
    var ctx = this.ctx;
    var mouseR = this.isMobile ? CONFIG.mouseRadiusMobile : CONFIG.mouseRadius;

    for (var i = 0; i < this.connections.length; i++) {
      var conn = this.connections[i];
      var a = this.nodes[conn.from];
      var b = this.nodes[conn.to];

      var opacity = CONFIG.connectionOpacity;

      // Boost near mouse
      if (this.mouse.active) {
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var md = Math.sqrt(
          (mx - this.mouse.x) * (mx - this.mouse.x) +
          (my - this.mouse.y) * (my - this.mouse.y)
        );
        if (md < mouseR) {
          opacity += (1 - md / mouseR) * CONFIG.connectionMouseOpacity;
        }
      }

      // Blend colors
      var r = Math.round((a.color.r + b.color.r) / 2);
      var g = Math.round((a.color.g + b.color.g) / 2);
      var bl = Math.round((a.color.b + b.color.b) / 2);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "rgba(" + r + "," + g + "," + bl + "," + opacity + ")";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  };

  HeroAnimation.prototype._drawNodes = function () {
    var ctx = this.ctx;
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.renderSize, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + n.color.r + "," + n.color.g + "," + n.color.b + "," + n.alpha + ")";
      ctx.fill();

      // Glow for bright nodes
      if (n.alpha > 0.45) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.renderSize * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + n.color.r + "," + n.color.g + "," + n.color.b + "," + (n.alpha * 0.1) + ")";
        ctx.fill();
      }
    }
  };

  HeroAnimation.prototype._drawPulseWaves = function () {
    var ctx = this.ctx;
    for (var i = this.pulseWaves.length - 1; i >= 0; i--) {
      var w = this.pulseWaves[i];
      w.radius += 2;
      w.alpha -= 0.008;
      if (w.alpha <= 0) {
        this.pulseWaves.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(51,102,204," + w.alpha + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  HeroAnimation.prototype._loop = function () {
    var self = this;
    this.raf = requestAnimationFrame(function (ts) {
      self._loop();
      if (ts - self.lastFrame < self.frameInterval) return;
      self.lastFrame = ts;

      self.ctx.clearRect(0, 0, self.width, self.height);
      self._update();
      self._drawConnections();
      self._drawPulseWaves();
      self._drawNodes();
    });
  };

  HeroAnimation.prototype._updateThemeColors = function () {
    var newColors = isDarkTheme() ? DARK_COLORS : LIGHT_COLORS;
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].color = newColors[Math.floor(Math.random() * newColors.length)];
      this.nodes[i].baseAlpha = isDarkTheme() ? (0.3 + Math.random() * 0.4) : (0.2 + Math.random() * 0.35);
    }
  };

  HeroAnimation.prototype._observeTheme = function () {
    var self = this;
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-theme') {
          self._updateThemeColors();
          break;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  HeroAnimation.prototype._bindEvents = function () {
    var self = this;
    var rafMouse = null;

    function onMove(x, y) {
      if (rafMouse) return;
      rafMouse = requestAnimationFrame(function () {
        var rect = self.canvas.getBoundingClientRect();
        self.mouse.x = x - rect.left;
        self.mouse.y = y - rect.top;
        self.mouse.active = true;
        rafMouse = null;
      });
    }

    this.canvas.parentElement.addEventListener("mousemove", function (e) {
      onMove(e.clientX, e.clientY);
    });

    this.canvas.parentElement.addEventListener("mouseleave", function () {
      self.mouse.active = false;
    });

    this.canvas.parentElement.addEventListener("touchmove", function (e) {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.parentElement.addEventListener("touchend", function () {
      self.mouse.active = false;
    });

    this.canvas.parentElement.addEventListener("click", function (e) {
      var rect = self.canvas.getBoundingClientRect();
      self.pulseWaves.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 5,
        alpha: 0.3,
      });
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        self._resize();
        self._createNetwork();
      }, 200);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (self.raf) cancelAnimationFrame(self.raf);
      } else {
        self.lastFrame = 0;
        self._loop();
      }
    });
  };

  window.HeroAnimation = HeroAnimation;
})();
