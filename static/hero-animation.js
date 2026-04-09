(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.HeroAnimation = function () {};
    return;
  }

  var LIGHT_COLORS = [
    { r: 51, g: 102, b: 204 },  // Wikipedia blue
    { r: 70, g: 130, b: 180 },  // Steel blue
    { r: 100, g: 149, b: 237 }, // Cornflower
    { r: 180, g: 155, b: 80 },  // Antique gold
    { r: 160, g: 140, b: 100 }, // Muted gold
    { r: 121, g: 92, b: 178 },  // Muted purple
  ];

  var DARK_COLORS = [
    { r: 88, g: 166, b: 255 },  // Bright blue
    { r: 121, g: 192, b: 255 }, // Light blue
    { r: 139, g: 233, b: 253 }, // Cyan
    { r: 188, g: 140, b: 255 }, // Purple
    { r: 210, g: 168, b: 255 }, // Soft purple
    { r: 180, g: 155, b: 80 },  // Antique gold
  ];

  function isDarkTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  var CONFIG = {
    particleCount: 240,
    particleCountMobile: 100,
    connectionDistance: 130,
    mouseRadius: 200,
    mouseRadiusMobile: 130,
    baseSpeed: 0.2,
    mouseInfluence: 0.008,
    particleMinSize: 1,
    particleMaxSize: 2.8,
    connectionOpacity: 0.07,
    connectionMouseOpacity: 0.25,
    fps: 60,
    colors: isDarkTheme() ? DARK_COLORS : LIGHT_COLORS,
  };

  function HeroAnimation(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, active: false };
    this.raf = null;
    this.lastFrame = 0;
    this.frameInterval = 1000 / CONFIG.fps;
    this.isMobile = window.innerWidth < 768;
    this.pulseWaves = [];

    this._resize();
    this._createParticles();
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

  HeroAnimation.prototype._createParticles = function () {
    var count = this.isMobile ? CONFIG.particleCountMobile : CONFIG.particleCount;
    this.particles = [];
    for (var i = 0; i < count; i++) {
      var color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed * 2,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed * 2,
        size: CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize),
        baseAlpha: isDarkTheme() ? (0.25 + Math.random() * 0.4) : (0.15 + Math.random() * 0.35),
        alpha: 0,
        color: color,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        floatX: Math.random() * Math.PI * 2,
        floatY: Math.random() * Math.PI * 2,
      });
    }
  };

  HeroAnimation.prototype._updateParticle = function (p) {
    p.floatX += 0.003;
    p.floatY += 0.004;
    p.x += p.vx + Math.sin(p.floatX) * 0.15;
    p.y += p.vy + Math.cos(p.floatY) * 0.15;

    p.phase += p.pulseSpeed;
    p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.05;

    var mouseR = this.isMobile ? CONFIG.mouseRadiusMobile : CONFIG.mouseRadius;
    if (this.mouse.active) {
      var dx = this.mouse.x - p.x;
      var dy = this.mouse.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouseR && dist > 5) {
        var force = (1 - dist / mouseR) * CONFIG.mouseInfluence;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        p.alpha = Math.min(0.85, p.alpha + (1 - dist / mouseR) * 0.4);
        p.renderSize = p.size * (1 + (1 - dist / mouseR) * 0.8);
      } else {
        p.renderSize = p.size;
      }
    } else {
      p.renderSize = p.size;
    }

    p.vx *= 0.997;
    p.vy *= 0.997;

    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var maxSpeed = CONFIG.baseSpeed * 3;
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    var pad = 20;
    if (p.x < -pad) p.x = this.width + pad;
    if (p.x > this.width + pad) p.x = -pad;
    if (p.y < -pad) p.y = this.height + pad;
    if (p.y > this.height + pad) p.y = -pad;
  };

  HeroAnimation.prototype._drawParticle = function (p) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.renderSize || p.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + p.color.r + "," + p.color.g + "," + p.color.b + "," + p.alpha + ")";
    ctx.fill();

    if (p.alpha > 0.45) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.renderSize || p.size) * 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + p.color.r + "," + p.color.g + "," + p.color.b + "," + (p.alpha * 0.12) + ")";
      ctx.fill();
    }
  };

  HeroAnimation.prototype._drawConnections = function () {
    var ctx = this.ctx;
    var particles = this.particles;
    var mouseR = this.isMobile ? CONFIG.mouseRadiusMobile : CONFIG.mouseRadius;

    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDistance) {
          var opacity = CONFIG.connectionOpacity * (1 - dist / CONFIG.connectionDistance);

          if (this.mouse.active) {
            var mx = (particles[i].x + particles[j].x) / 2;
            var my = (particles[i].y + particles[j].y) / 2;
            var md = Math.sqrt(
              (mx - this.mouse.x) * (mx - this.mouse.x) +
              (my - this.mouse.y) * (my - this.mouse.y)
            );
            if (md < mouseR) {
              var boost = (1 - md / mouseR);
              opacity = opacity + boost * CONFIG.connectionMouseOpacity;
            }
          }

          var c1 = particles[i].color;
          var c2 = particles[j].color;
          var r = Math.round((c1.r + c2.r) / 2);
          var g = Math.round((c1.g + c2.g) / 2);
          var b = Math.round((c1.b + c2.b) / 2);

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
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

      for (var i = 0; i < self.particles.length; i++) {
        self._updateParticle(self.particles[i]);
      }

      self._drawConnections();
      self._drawPulseWaves();

      for (var j = 0; j < self.particles.length; j++) {
        self._drawParticle(self.particles[j]);
      }
    });
  };

  HeroAnimation.prototype._updateThemeColors = function () {
    var newColors = isDarkTheme() ? DARK_COLORS : LIGHT_COLORS;
    CONFIG.colors = newColors;
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].color = newColors[Math.floor(Math.random() * newColors.length)];
      this.particles[i].baseAlpha = isDarkTheme() ? (0.25 + Math.random() * 0.4) : (0.15 + Math.random() * 0.35);
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
        self._createParticles();
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
