/* jshint ignore: start */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'jquery.transit'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'), require('jquery.transit'));
  } else {
    root.Debut = factory(root.jQuery, root.jQuery.transit);
  }
}(this, function(jQuery, __transit) {
var __debut;
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _animations = require('./animations');

var _animations2 = _interopRequireDefault(_animations);

var $ = jQuery;

/**
 * @constructor
 *
 * The Animation object represents a single animation in the animation queue.
 * It contains all options for a single animation, such as the kind of animation, and the direction it is going in.
 * It is responsible for running an animation, and eventually getting a callback back to the Debut instance
 */
var Animation = function Animation(definition, options) {
  this.options = $.extend({}, Animation.defaultOptions, definition.defaultOptions || {}, options);
  this.definition = definition;

  this.easing = this.options.easing;
  this.duration = this.options.duration;
  this.delay = this.options.delay;
  this.start = this.options.start;
  this.element = this.options.element;
  this.$element = $(this.element);
  this.direction = this.options.direction * (this.options.reverse ? -1 : 1);
  this.isJQuery = this.element instanceof $;
  this.isOnDOM = this.element instanceof HTMLElement || this.isJQuery; // Not always true but we will continue
  this.firstRun = true;
  this.store = {};

  if (this.isHidden() && this.direction === 1) {
    this.$element.css('visibility', 'hidden');
  }
};

Animation.prototype.run = function run(context, callback) {
  callback = callback || function () {};

  if (this.firstRun && !context.reversed && this.definition.beforeState) {
    this.definition.beforeState.call(this, context);
    this.firstRun = false;
  }

  if (this.definition.prepare) {
    this.definition.prepare.call(this, context);
  }

  if (this.isHidden()) {
    if (context.direction === 1) {
      this.$element.css('visibility', '');
    } else {
      var oldCallback = callback;
      callback = (function callback() {
        this.$element.css('visibility', 'hidden');
        oldCallback();
      }).bind(this);
    }
  }

  this.definition.call(this, context, callback);
};

/**
 * Determine if the animation should toggle the visibility state of the object.
 *
 * @returns {bool} Whether the animation should toggle the visibility state.
 */
Animation.prototype.isHidden = function isHidden() {
  return this.isOnDOM && this.options.entrance;
};

Animation.defaultOptions = {
  easing: 'easeInOutCubic',
  duration: 500,
  delay: 0,
  start: 'step',
  element: null,
  entrance: false,
  reverse: false,
  direction: 1
};

Animation.animations = _animations2['default'];

exports['default'] = Animation;
module.exports = exports['default'];

},{"./animations":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var $ = jQuery;

var animations = {};

/**
 * The appear animation is the most simple. All it does is make the element appear.
 * The logic is empty because animations naturally handle hiding and showing entrance animations.
 */
animations.appear = function (context, callback) {
  setTimeout(callback.bind(this), this.duration);
};

animations.appear.beforeState = function beforeState(context) {};

animations.appear.defaultOptions = {
  entrance: true,
  duration: 0
};

/**
 * Slides the element in from a side of the screen
 */
animations.slide = function slide(context, callback) {
  this.$element.transit({
    x: "+=" + -context.direction * this.store.leftShift,
    y: "+=" + -context.direction * this.store.topShift
  }, this.options.duration, this.options.easing, callback);
};

animations.slide.prepare = function prepare(context) {
  var leftShift = 0;
  var topShift = 0;

  if (context.direction === 1) {
    console.log("I do");
    this.$element.css({
      x: this.store.x,
      y: this.store.y
    });
  }

  var position = context.debut.offset(this.$element);

  switch (this.options.from) {
    default:
    case "left":
      leftShift = -(this.$element.width() + position.left);
      break;
    case "right":
      leftShift = context.debut.bounds.visibleWidth - position.left;
      break;
    case "top":
      topShift = -(this.$element.height() + position.top);
      break;
    case "bottom":
      topShift = context.debut.bounds.visibleHeight - position.top;
      break;
  }

  if (context.direction === 1) {
    this.$element.css({
      x: "+=" + context.direction * leftShift,
      y: "+=" + context.direction * topShift
    });
  }

  this.store.leftShift = leftShift;
  this.store.topShift = topShift;
};

animations.slide.beforeState = function beforeState(context) {
  this.store.x = this.$element.css("x");
  this.store.y = this.$element.css("y");
};

animations.slide.defaultOptions = {
  entrance: true,
  from: "left"
};

exports["default"] = animations;
module.exports = exports["default"];

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _animation = require('./animation');

var _animation2 = _interopRequireDefault(_animation);

// Reminder: All external dependencies are globals
var $ = jQuery;

/**
 * The primary Debut object is responsible for handling the presentation.
 */
var Debut = function Debut(element, options) {
  // Store jQuery objects for later reference
  this.$ = {};
  this.elements = {};

  this.options = $.extend({}, Debut.defaultOptions, options);

  this.elements.container = element;
  this.$.container = $(this.elements.container);

  this.$.container.addClass('debut-container');
  this.$.container.attr('tabindex', '1');
  this.$.innerContainer = this.$.container.wrapInner('<div class="debut-container-inner">').children();
  this.$.innerContainer.css({ width: this.options.baseWidth, height: this.options.baseWidth / this.options.aspect });
  this.elements.innerContainer = this.$.innerContainer[0];

  this.bounds = {};

  this.animationQueue = [];
  this.animationIndex = 0;

  if (this.options.full) {
    this.$.container.addClass('debut-full');
  }

  if (this.options.letterbox) {
    this.$.container.addClass('debut-letterbox');
  }

  this._addEventListeners();
};

/**
 * Updates the width and height of the presentation based on the size of its container.
 * Called automatically on window resize. In other cases, you will need to call it yourself
 */
Debut.prototype.resize = function resize(event) {
  this.bounds.width = this.$.innerContainer.width();
  this.bounds.height = this.$.innerContainer.height();
  this.bounds.outerWidth = this.$.container.width();
  this.bounds.outerHeight = this.$.container.height();
  this.bounds.aspect = this.bounds.outerWidth / this.bounds.outerHeight;

  if (this.options.letterbox) {
    this.bounds.visibleWidth = this.bounds.width;
    this.bounds.visibleHeight = this.bounds.height;
  } else {
    this.bounds.visibleWidth = this.bounds.outerWidth;
    this.bounds.visibleHeight = this.bounds.outerHeight;
  }

  if (this.bounds.aspect > this.options.aspect) {
    this.bounds.scale = this.bounds.outerHeight / (this.options.baseWidth / this.options.aspect);
    this.bounds.top = 0;
    this.bounds.left = (this.bounds.outerWidth - this.options.baseWidth * this.bounds.scale) / 2;
  } else {
    this.bounds.scale = this.bounds.outerWidth / this.options.baseWidth;
    this.bounds.top = (this.bounds.outerHeight - this.options.baseWidth / this.options.aspect * this.bounds.scale) / 2;
    this.bounds.left = 0;
  }

  this.$.innerContainer.css({ scale: this.bounds.scale, top: this.bounds.top, left: this.bounds.left });
};

/**
 * Listens to relevant events and binds callbacks
 * @private
 */
Debut.prototype._addEventListeners = function addEventListeners() {
  var self = this;
  this.resize();
  $(window).on('resize', this.resize.bind(this));

  this.$.container.click(this.next.bind(this));

  if (this.options.keys) {
    this.$.container.keyup((function (e) {
      this.options.keys.next.forEach(function (key) {
        if (e.which === key) {
          self.next();
        }
      });

      this.options.keys.prev.forEach(function (key) {
        if (e.which === key) {
          self.prev();
        }
      });
    }).bind(this));
  }
};

/**
 * Adds an animation to the animation queue
 */
Debut.prototype.step = function step(element, animation, options) {
  if (typeof element === 'string') {
    element = $(element)[0];
  }

  animation = Debut.animations[animation];
  animation = new _animation2['default'](animation, $.extend({}, { element: element }, options));

  this.animationQueue.push(animation);

  return this;
};

/**
 * Adds an animation to the animation queue that starts with the previous animation
 */
Debut.prototype.and = function and(element, animation, options) {
  options = $.extend({ start: 'with' }, options);

  return this.step(element, animation, options);
};

/**
 * Adds an animation to the queue that starts after the previous animation
 */
Debut.prototype.then = function then(element, animation, options) {
  options = $.extend({ start: 'after' }, options);

  return this.step(element, animation, options);
};

/**
 * Proceed to the next state of the presentation
 */
Debut.prototype.next = function next() {
  if (this.animationIndex < this.animationQueue.length) {
    this.proceed(1);
  }
};

/**
 * Proceed to the previous state of the presentation
 */
Debut.prototype.prev = function prev() {
  if (this.animationIndex > 0) {
    this.proceed(-1);
  }
};

/**
 * Go forwards or backwards in the presentation state
 *
 * @param {Number} direction - Forwards (1) or backwards (-1)?
 * @param {Number} [ind] - The index to start from (for recursive calls)
 *
 * @private
 *
 * TODO: Simplify this somehow?
 */
Debut.prototype.proceed = function proceed(direction, ind) {
  var modifyIndex = false;

  if (typeof ind === 'undefined') {
    ind = this.animationIndex;
    modifyIndex = true;
  }

  if (direction === -1) {
    ind -= 1;
  }

  var animation = this.animationQueue[ind];
  var otherAnimation = null;
  var animationMode = null;

  if (direction === 1) {
    ind += 1;

    // Remember: ind has already been increased
    if (ind < this.animationQueue.length) {
      otherAnimation = this.animationQueue[ind];
      animationMode = otherAnimation.start;
    }
  } else {
    // Remember: ind has already been decreased
    if (ind >= 0) {
      otherAnimation = this.animationQueue[ind - 1];
      animationMode = animation.start;
    }
  }

  var callback;

  if (animationMode == 'after') {
    callback = this.proceed.bind(this, direction, ind);
    var refAnimation = direction === 1 ? otherAnimation : animation;
    if (refAnimation.delay > 0) {
      var oldCallback = callback;
      callback = function () {
        setTimeout(oldCallback, refAnimation.delay);
      };
    }
  }

  var context = {
    debut: this,
    direction: animation.direction * direction,
    reversed: direction === -1
  };

  var next = (function () {
    animation.run(context, callback);

    if (animationMode == 'with') {
      if (direction === 1) {
        if (otherAnimation.delay > 0) {
          setTimeout(this.proceed.bind(this, direction, ind), otherAnimation.delay);
        } else {
          this.proceed(direction, ind);
        }
      } else {
        if (animation.delay > 0) {
          // If this animation was delayed when going forwards,
          // Going backwards, the previous animation needs to be delayed
          var delay = Math.max(animation.delay + animation.duration - otherAnimation.duration, 0);
          console.log(delay, animation, otherAnimation);
          setTimeout(this.proceed.bind(this, direction, ind), delay);
        } else {
          console.log('whoa');
          this.proceed(direction, ind);
        }
      }
    }
  }).bind(this);

  if (animation.delay > 0 && direction === 1 && animation.step === 'start') {
    setTimeout(next, animation.delay);
  } else {
    next();
  }

  // Pre-emptively figure out what the next animation index will be
  if (modifyIndex) {
    var anim = animation;
    var i = ind;

    // Rewind one step
    i -= direction;

    while ((anim = this.getAnimation(i += direction)) && anim.start !== 'step') {}

    ind = Math.max(0, Math.min(i, this.animationQueue.length));

    this.animationIndex = ind;
  }
};

/**
 * Get the animation for a particular index.
 *
 * @param {Number} ind - The index of the animation
 *
 * @returns {Animation|null} The animation if it exists, null if it does not.
 */
Debut.prototype.getAnimation = function getAnimation(ind) {
  if (ind < 0 || ind >= this.animationQueue.length) {
    return null;
  }

  return this.animationQueue[ind];
};

/**
 * Determines the offset of an element in presentation coordinates
 *
 * @returns {Object} offset - Object containing coordinates
 * @returns {Number} offset.left - The left offset in pixels
 * @returns {Number} offset.right - The right offset in pixels
 */
Debut.prototype.offset = function changeOffset(element) {
  if (!(element instanceof $)) {
    element = $(element);
  }

  var offset = element.offset();

  offset.left = (offset.left - this.bounds.left) / this.bounds.scale;
  offset.top = (offset.top - this.bounds.top) / this.bounds.scale;

  return offset;
};

Debut.defaultOptions = {
  full: true,
  fullscreen: false,
  aspect: 16 / 9,
  baseWidth: 1000,
  letterbox: true,
  keys: {
    next: [39 /* Right Arrow */, 34 /* Page Down */],
    prev: [37 /* Left Arrow */, 33 /* Page Up */]
  }
};

Debut.Animation = _animation2['default'];
Debut.animations = _animation2['default'].animations;

exports['default'] = Debut;
module.exports = exports['default'];

},{"./animation":1}],4:[function(require,module,exports){
// The __debut variable is defined in the context of the whole module definition
// Which allows it to export the debut object
'use strict';

__debut = require('./debut'); // jshint ignore:line

},{"./debut":3}]},{},[4]);

return __debut;
}));