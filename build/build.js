
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("lepture-caret/index.js", function(exports, require, module){
/**
 * Caret
 *
 * Listen to and manipulate the text caret.
 *
 * Copyright (c) 2013 by Hsiaoming Yang.
 */

var event = require('event');
var emitter = require('emitter');

module.exports = Caret;

function Caret(element) {
  this.element = element;

  bindMouse(this);

  if (element) {
    var caret = this;
    event.bind(element, 'keyup', function() {
      caret.emit('change');
    });
  }
}
emitter(Caret.prototype);


/**
 * Get the current selection
 */
Caret.prototype.selection = function() {
  var sel = document.getSelection();
  if (!this.element) {
    return sel;
  }
  var el = this.element;
  // only when the selection in element
  if (isChildOf(sel.anchorNode, el) && isChildOf(sel.focusNode, el)) {
    return sel;
  }
  return null;
};


/**
 * Get the current selection range
 */
Caret.prototype.range = function() {
  var sel = this.selection();
  if (!sel) {
    return null;
  }

  if (sel.rangeCount) {
    return sel.getRangeAt(0);
  }
  return null;
};


/**
 * The nearest parent node
 */
Caret.prototype.parent = function() {
  var range = this.range();
  if (!range) {
    return null;
  }
  var node = range.startContainer;
  if (node.nodeType === document.ELEMENT_NODE) {
    return node;
  }
  return node.parentElement || node.parentNode;
};


/**
 * Find the block level parent node of caret
 */
Caret.prototype.blockParent = function() {
  var parent = this.parent();
  if (!parent) {
    return null;
  }
  return getBlockElement(parent, this.element);
};


/**
 * Save caret position
 */
Caret.prototype.save = function(range) {
  range = range || this.range();
  if (range) {
    this._range = range;
  }
};


/**
 * Restore caret position
 */
Caret.prototype.restore = function(range) {
  var r = document.createRange();
  var sel = document.getSelection();

  range = range || this._range;
  if (range) {
    r.setStart(range.startContainer, range.startOffset);
    r.setEnd(range.endContainer, range.endOffset);
    sel.removeAllRanges();
    sel.addRange(r);
  } else {
    sel.selectAllChildren(this.element);
    sel.collapseToEnd();
  }
};


/**
 * Bind mouse and emit select event
 */
function bindMouse(caret) {
  var body = document.body;

  var timer;
  event.bind(body, 'mouseup', function(e) {
    // caret has changed
    caret.emit('change');

    timer = setTimeout(function() {
      var sel = document.getSelection();
      if (sel && sel.toString().trim()) {
        caret.emit('select', e, sel);
      }
    }, 50);
  });

  event.bind(body, 'mousedown', function() {
    clearTimeout(timer);
  });
}



/**
 * Find the block level parent node
 */
function getBlockElement(el, parent) {
  if (parent && el === parent) {
    return null;
  }

  var style;
  if (window.getComputedStyle) {
    style = window.getComputedStyle(el);
  } else {
    style = el.currentStyle;
  }

  var display = style.display;
  if (display === 'block' || display === 'table') {
    return el;
  }

  return getBlockElement(el.parentElement || el.parentNode);
}


/**
 * Check if the element is the child of the node
 */
function isChildOf(el, parent) {
  if (!el) {
    return false;
  }
  while (el = el.parentNode) {
    if (el === document.body) {
      return false;
    }
    if (el === parent) {
      return true;
    }
  }
  return false;
}
Caret.isChildOf = isChildOf;
Caret.getBlockElement = getBlockElement;

});
require.register("lepture-format/index.js", function(exports, require, module){
/**
 * Format
 *
 * An easy way for formatting in content editable.
 *
 * Copyright (c) 2013 by Hsiaoming Yang.
 */
var Caret = require('caret');
var Emitter = require('emitter');
var emitter = new Emitter();

function format(name) {
  // exclude none commands
  if (~['on', 'once', 'off', 'is', '_'].indexOf(name)) {
    return null;
  }
  var fn = format[name];
  if (fn) {
    return fn();
  }
  return null;
}

// pass caret to format for reuse
var caret = format.caret || new Caret();

format.bold = command('bold');
format.italic = command('italic');
format.strike = command('strikethrough');
format.sub = command('subscript');
format.sup = command('superscript');
format.underline = command('underline');

format.p = command('formatblock', '<p>');

format.h1 = formatblock('h1');
format.h2 = formatblock('h2');
format.h3 = formatblock('h3');
format.h4 = formatblock('h4');
format.h5 = formatblock('h5');
format.h6 = formatblock('h6');
format.blockquote = formatblock('blockquote');
format.div = formatblock('div');

format.ol = function() {
  command('insertOrderedList')();
  if (!format.is.ol()) {
    return format.p();
  }
  fixList('ol');
};

format.ul = function() {
  command('insertUnorderedList')();
  if (!format.is.ul()) {
    return format.p();
  }
  fixList('ul');
};

format.indent = command('indent');
format.outdent = command('outdent');
format.clear = command('removeformat');

format.hr = command('inserthorizontalrule');
format.a = command('createLink');
format.img = command('insertimage');
format.br = command('inserthtml', '<br>');

format.html = command('inserthtml');
format.unlink = command('unlink');

/**
 * Check formatting of current caret.
 */
format.is = function(name) {
  var fn = format.is[name];
  if (fn) {
    return fn();
  }
  return null;
};
format.is.bold = function() {
  return query('bold')() || hasParent('b', true)() || hasParent('strong', true)();
};
format.is.italic = function() {
  return query('italic')() || hasParent('i', true)() || hasParent('em', true)();
};
format.is.strike = query('strikethrough');
format.is.sub = query('subscript');
format.is.sup = query('superscript');
format.is.underline = query('underline');

format.is.p = hasParent('p');
format.is.h1 = hasParent('h1');
format.is.h2 = hasParent('h2');
format.is.h3 = hasParent('h3');
format.is.h4 = hasParent('h4');
format.is.h5 = hasParent('h5');
format.is.h6 = hasParent('h6');
format.is.blockquote = hasParent('blockquote');
format.is.div = hasParent('div');

format.is.ul = hasParent('ul');
format.is.ol = hasParent('ol');

format.is.a = hasParent('a', true);
format.is.img = hasParent('img', true);


/**
 * Function factory for execCommand.
 */
function command(name, param) {
  return function(args) {
    var ret = document.execCommand(name, false, param || args);
    emitter.emit(name, param);
    // emit * event so that you can listen all events
    emitter.emit('*', name, param);
    return ret;
  };
}

/**
 * Function factory for creating format block.
 */
function formatblock(name) {
  return function() {
    var el = caret.blockParent();
    name = name.replace(/^</, '').replace(/>$/, '');
    if (format.is(name) || el.nodeName.toLowerCase() === name.toLowerCase()) {
      // toggle off this block format
      format.p();
      return format.outdent();
    } else {
      if (format.is('ul')) {
        // toggle off ul
        format.ul();
      } else if (format.is('ol')) {
        // toggle off ol
        format.ol();
      }
      // compatible for IE
      name = '<' + name + '>';
      return command('formatblock', name)();
    }
  };
}

/**
 * Function factory for queryCommandValue
 */
function query(name) {
  return function() {
    var value = document.queryCommandValue(name);
    // Webkit/Firefox return values are strings: "true", "false"
    // IE returns booleans. IE rocks.
    return value === "true" || value === true;
  };
}

function hasParent(name, spanlevel) {
  return function() {
    var el;
    if (spanlevel) {
      el = caret.parent();
    } else {
      el = caret.blockParent();
    }
    if (el) {
      return el.nodeName.toLowerCase() === name.toLowerCase();
    }
    return null;
  };
}

function fixList(type) {
  var r = caret.range();
  var el = r.commonAncestorContainer;

  while (el = el.parentNode) {
    var tag = el.tagName.toLowerCase();
    if (!el || tag === 'div' || el.id || el.className || el === caret.element) {
      break;
    }
    if (tag === type) {
      el = el.parentNode;
      if (el.tagName.toLowerCase() === 'p') {
        caret.save();
        for (var i = 0; i < el.childNodes.length; i++) {
          el.parentNode.insertBefore(el.childNodes[i], el);
        }
        el.parentNode.removeChild(el);
        caret.restore();
        break;
      }
    }
  }
}

// extends format with utilities.
format._ = {
  command: command,
  formatblock: formatblock,
  query: query,
  hasParent: hasParent,
  emitter: emitter
};
format.on = function(event, fn) {
  return emitter.on(event, fn);
};
format.once = function(event, fn) {
  return emitter.once(event, fn);
};
format.off = function(event, fn) {
  return emitter.off(event, fn);
};

// Reset default paragraph separator.
command('defaultParagraphSeparator', 'p')();

module.exports = format;

});
require.register("lepture-k-format/index.js", function(exports, require, module){
/**
 * keyboard format
 *
 * Fix keyboard behavior for editable format.
 *
 * Copyright (c) 2013 - 2014 by Hsiaoming Yang.
 */

var keyboard = require('k');
var format = require('format');
var Caret = require('caret');


module.exports = function(editable, options) {
  options = options || {};
  var caret = options.caret || new Caret(editable);
  var k = keyboard(editable);

  var spanformats  = ['bold', 'italic', 'strike', 'underline'];

  k('backspace', function(e) {
    if (isblank(editable)) {
      e.preventDefault();
      if (!format.is.p()) {
        format.p();
      }
    }
  });

  k('enter', function(e) {
    // corret enter behavior
    if (format.is.div()) {
      // div -> p
      format.p();
    }
    for (var i = 0; i < spanformats.length; i++) {
      (function(name) {
        if (format.is(name)) {
          format(name);
        }
      })(spanformats[i]);
    }
    if (!options.blank && isblank(editable)) {
      // don't put too many blank lines
      e.preventDefault();
      return false;
    }

    if (k.shift) {
      // shift + enter is <br>
      return false;
    }

    var curr = caret.blockParent();
    var prev = curr.previousElementSibling;

    if (prev && prev.tagName.toLowerCase() === 'hr' && isblank(curr)) {
      e.preventDefault();
      return false;
    }

    if (format.is.blockquote()) {
      if (!curr.textContent) {
        e.preventDefault();
        return false;
      }
      setTimeout(function() {
        format.blockquote();
        format.p();
      }, 1);
      return true;
    }

    if (format.is.ul() || format.is.ol()) {
      setTimeout(function() {
        if (!format.is.ul() && !format.is.ol()) {
          format.p();
        }
      }, 1);
      return true;
    }

    setTimeout(function() {
      var prev = caret.blockParent().previousElementSibling;
      if (prev && isblank(prev)) {
        prev.parentNode.replaceChild(document.createElement('hr'), prev);
      }
    }, 1);
  });

  // tab only works on list
  k('tab', function(e) {
    e.preventDefault();
    if (format.is.ul() || format.is.ol()) {
      if (k.shift) {
        format.outdent();
      } else {
        format.indent();
      }
    }
    return false;
  });
};


function isblank(el) {
  var html = el.innerHTML;
  html = html.replace(/^\s+/, '').replace(/\s+$/, '');
  return (html === '<p><br></p>' || html === '<br>');
}

});
require.register("lepture-sanitize/index.js", function(exports, require, module){
/**
 * Sanitize
 *
 * sanitize html for safety, clean harmful and noisy nodes.
 *
 * Copyright (c) 2013 - 2014 by Hsiaoming Yang.
 */

var config = {
  keep: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'div', 'p', 'blockquote', 'figure', 'figcaption',
    'ul', 'ol', 'li',
    'pre', 'code',
    'em', 'strong', 'i', 'b',
    'a', 'img', 'hr', 'br',
    'table', 'td', 'th', 'tr', 'tbody', 'thead', 'tfoot'
  ],

  drop: [
    'meta', 'link',
    'script', 'noscript', 'style',
    'embed', 'iframe', 'frame',
    'form', 'input', 'textarea', 'button', 'fieldset'
  ],

  replace: {
    'div': 'p',
    'i': 'em',
    'b': 'strong'
  },

  attributes: {
    '*': [],
    'a': ['href'],
    'img': ['src', 'width', 'height']
  }
};


/**
 * Replace node tag name
 */

function replaceTag(node, tagName) {
  var repl = document.createElement(tagName);
  repl.innerHTML = node.innerHTML;
  node.parentNode.replaceChild(repl, node);
  return repl;
}


/**
 * Trim node attributes
 */

function trimAttributes(node, allowAttrs) {
  allowAttrs = allowAttrs.concat(config.attributes['*']);

  // clone all attrs
  var attrs = Array.prototype.slice.call(node.attributes);

  for (var i = 0; i < attrs.length; i++) {
    (function(attr) {
      if (!~allowAttrs.indexOf(attr.name)) {
        node.removeAttributeNode(attr);
      }
    })(attrs[i]);
  }
  return node;
}


/**
 * Remove this node
 */

function dropNode(node) {
  node.parentNode.removeChild(node);
}


/**
 * Remove the tag of the node
 */

function unwrap(node) {
  var parent = node.parentNode;
  if (!parent) {
    return;
  }
  var children = node.childNodes;
  for (var i = 0; i < children.length; i++) {
    parent.insertBefore(children[i], node);
  }
  parent.removeChild(node);
}


/**
 * Traversal the node tree
 */

function traversal(node, fn, parent) {
  if (!node) {
    return;
  }

  var children = node.childNodes;

  for (var i = 0; i < children.length; i++) {
    fn(children[i]);
    traversal(children[i], fn, node);
  }

  if (parent) {
    fn(node);
  }

  return node;
}


/**
 * Sanitize a node, clean the disaster
 */

function sanitize(node) {
  if (node.nodeType === document.TEXT_NODE) {
    return node;
  }

  if (node.nodeType !== document.ELEMENT_NODE) {
    return dropNode(node);
  }

  var tag = node.nodeName.toLowerCase();
  if (~config.drop.indexOf(tag)) {
    return dropNode(node);
  }
  if (!~config.keep.indexOf(tag)) {
    return unwrap(node);
  }

  if (config.replace[tag]) {
    node = replaceTag(node, config.replace[tag]);
  }

  trimAttributes(node, config.attributes[tag] || []);
  return node;
}


/**
 * Clean empty node
 */

function cleanEmpty(html) {
  var regex = /<(\w+)[^>]*><\/\1>/g;
  return html.replace(regex, '');
}


/**
 * Exports sanitize API
 */

exports = module.exports = function(html) {
  var node;

  if (html.innerHTML) {
    node = html;
  } else {
    node = document.createElement('div');
    node.innerHTML = html;
  }

  node = traversal(node, sanitize);
  return cleanEmpty(node.innerHTML);
};


/**
 * Exports config data
 */

exports.config = config;

});
require.register("lepture-upload/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter');

/**
 * Expose `Upload`.
 */

module.exports = Upload;

/**
 * Initialize a new `Upload` file`.
 * This represents a single file upload.
 *
 * Events:
 *
 *   - `error` an error occurred
 *   - `abort` upload was aborted
 *   - `progress` upload in progress (`e.percent` etc)
 *   - `end` upload is complete
 *
 * @param {File} file
 * @api private
 */

function Upload(file) {
  if (!(this instanceof Upload)) return new Upload(file);
  Emitter.call(this);
  this.file = file;
  file.slice = file.slice || file.webkitSlice;
}

/**
 * Mixin emitter.
 */

Emitter(Upload.prototype);

/**
 * Upload to the given `path`.
 *
 * @param {String} options
 * @param {Function} [fn]
 * @api public
 */

Upload.prototype.to = function(options, fn){
  // TODO: x-browser
  var path;
  if (typeof options == 'string') {
    path = options;
    options = {};
  } else {
    path = options.path;
  }
  var self = this;
  fn = fn || function(){};
  var req = this.req = new XMLHttpRequest;
  req.open('POST', path);
  req.onload = this.onload.bind(this);
  req.onerror = this.onerror.bind(this);
  req.upload.onprogress = this.onprogress.bind(this);
  req.onreadystatechange = function(){
    if (4 == req.readyState) {
      var type = req.status / 100 | 0;
      if (2 == type) return fn(null, req);
      var err = new Error(req.statusText + ': ' + req.response);
      err.status = req.status;
      fn(err);
    }
  };
  var key, headers = options.headers || {};
  for (key in headers) {
    req.setRequestHeader(key, headers[key]);
  }
  var body = new FormData;
  body.append(options.name || 'file', this.file);
  var data = options.data || {};
  for (key in data) {
    body.append(key, data[key]);
  }
  req.send(body);
};

/**
 * Abort the XHR.
 *
 * @api public
 */

Upload.prototype.abort = function(){
  this.emit('abort');
  this.req.abort();
};

/**
 * Error handler.
 *
 * @api private
 */

Upload.prototype.onerror = function(e){
  this.emit('error', e);
};

/**
 * Onload handler.
 *
 * @api private
 */

Upload.prototype.onload = function(e){
  this.emit('end', this.req);
};

/**
 * Progress handler.
 *
 * @api private
 */

Upload.prototype.onprogress = function(e){
  e.percent = e.loaded / e.total * 100;
  this.emit('progress', e);
};

});
require.register("yields-k-sequence/index.js", function(exports, require, module){

/**
 * dependencies
 */

var keycode = require('keycode');

/**
 * Export `sequence`
 */

module.exports = sequence;

/**
 * Create sequence fn with `keys`.
 * optional `ms` which defaults
 * to `500ms` and `fn`.
 *
 * Example:
 *
 *      seq = sequence('a b c', fn);
 *      el.addEventListener('keydown', seq);
 *
 * @param {String} keys
 * @param {Number} ms
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function sequence(keys, ms, fn){
  var codes = keys.split(/ +/).map(keycode)
    , clen = codes.length
    , seq = []
    , i = 0
    , prev;

  if (2 == arguments.length) {
    fn = ms;
    ms = 500;
  }

  return function(e){
    var code = codes[i++];
    if (42 != code && code != e.which) return reset();
    if (prev && new Date - prev > ms) return reset();
    var len = seq.push(e.which);
    prev = new Date;
    if (len != clen) return;
    reset();
    fn(e);
  };

  function reset(){
    prev = null;
    seq = [];
    i = 0;
  }
};

});
require.register("yields-keycode/index.js", function(exports, require, module){

/**
 * map
 */

var map = {
    backspace: 8
  , command: 91
  , tab: 9
  , clear: 12
  , enter: 13
  , shift: 16
  , ctrl: 17
  , alt: 18
  , capslock: 20
  , escape: 27
  , esc: 27
  , space: 32
  , left: 37
  , up: 38
  , right: 39
  , down: 40
  , del: 46
  , comma: 188
  , ',': 188
  , '.': 190
  , '/': 191
  , '`': 192
  , '-': 189
  , '=': 187
  , ';': 186
  , '[': 219
  , '\\': 220
  , ']': 221
  , '\'': 222
};

/**
 * find a keycode.
 *
 * @param {String} name
 * @return {Number}
 */

module.exports = function(name){
  return map[name] || name.toUpperCase().charCodeAt(0);
};

});
require.register("component-bind/index.js", function(exports, require, module){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("component-os/index.js", function(exports, require, module){


module.exports = os();

function os() {
  var ua = navigator.userAgent;
  if (/mac/i.test(ua)) return 'mac';
  if (/win/i.test(ua)) return 'windows';
  if (/linux/i.test(ua)) return 'linux';
}

});
require.register("yields-k/lib/index.js", function(exports, require, module){

/**
 * dependencies.
 */

var event = require('event')
  , proto = require('./proto')
  , bind = require('bind');

/**
 * Create a new dispatcher with `el`.
 *
 * example:
 *
 *      var k = require('k')(window);
 *      k('shift + tab', function(){});
 *
 * @param {Element} el
 * @return {Function}
 * @api public
 */

module.exports = function(el){
  function k(e, fn){ k.handle(e, fn) };
  k._handle = bind(k, proto.handle);
  k._clear = bind(k, proto.clear);
  event.bind(el, 'keydown', k._handle, false);
  event.bind(el, 'keyup', k._handle, false);
  event.bind(el, 'keyup', k._clear, false);
  event.bind(el, 'focus', k._clear, false);
  for (var p in proto) k[p] = proto[p];
  k.listeners = [];
  k.el = el;
  return k;
};

});
require.register("yields-k/lib/proto.js", function(exports, require, module){

/**
 * dependencies
 */

var sequence = require('k-sequence')
  , keycode = require('keycode')
  , event = require('event')
  , os = require('os');

/**
 * modifiers.
 */

var modifiers = {
  91: 'command',
  93: 'command',
  16: 'shift',
  17: 'ctrl',
  18: 'alt'
};

/**
 * Super key.
 */

exports.super = 'mac' == os
  ? 'command'
  : 'ctrl';

/**
 * Handle the given `KeyboardEvent` or bind
 * a new `keys` handler.
 *
 * @param {String|KeyboardEvent} e
 * @param {Function} fn
 * @api private
 */

exports.handle = function(e, fn){
  var ignore = this.ignore;
  var event = e.type;
  var code = e.which;

  // bind
  if (fn) return this.bind(e, fn);

  // modifiers
  var mod = modifiers[code];
  if ('keydown' == event && mod) {
    this.super = exports.super == mod;
    this[mod] = true;
    this.modifiers = true;
    return;
  }

  // ignore
  if (ignore && ignore(e)) return;

  // listeners
  var all = this.listeners;

  // match
  for (var i = 0; i < all.length; ++i) {
    var invoke = true;
    var obj = all[i];
    var seq = obj.seq;
    var mods = obj.mods;
    var fn = seq || obj.fn;

    if (!seq && code != obj.code) continue;
    if (event != obj.event) continue;

    for (var j = 0; j < mods.length; ++j) {
      if (!this[mods[j]]) {
        invoke = null;
        break;
      }
    }

    invoke && fn(e);
  }
};

/**
 * Destroy this `k` dispatcher instance.
 *
 * @api public
 */

exports.destroy = function(){
  event.unbind(this.el, 'keydown', this._handle);
  event.unbind(this.el, 'keyup', this._handle);
  event.unbind(this.el, 'keyup', this._clear);
  event.unbind(this.el, 'focus', this._clear);
  this.listeners = [];
};

/**
 * Unbind the given `keys` with optional `fn`.
 *
 * example:
 *
 *      k.unbind('enter, tab', myListener); // unbind `myListener` from `enter, tab` keys
 *      k.unbind('enter, tab'); // unbind all `enter, tab` listeners
 *      k.unbind(); // unbind all listeners
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.unbind = function(keys, fn){
  var fns = this.listeners
    , len = fns.length
    , all;

  // unbind all
  if (0 == arguments.length) {
    this.listeners = [];
    return this;
  }

  // parse
  all = parseKeys(keys);

  // unbind
  for (var i = 0; i < all.length; ++i) {
    for (var j = 0, obj; j < len; ++j) {
      obj = fns[j];
      if (!obj) continue;
      if (fn && obj.fn != fn) continue;
      if (obj.key != all[i].key) continue;
      if (!matches(obj, all[i])) continue;
      fns.splice(j--, 1);
    }
  }

  return this;
};

/**
 * Bind the given `keys` to `fn` with optional `event`
 *
 * example:
 *
 *      k.bind('shift + tab, ctrl + a', function(e){});
 *
 * @param {String} event
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.bind = function(event, keys, fn){
  var fns = this.listeners
    , len
    , all;

  if (2 == arguments.length) {
    fn = keys;
    keys = event;
    event = 'keydown';
  }

  all = parseKeys(keys);
  len = all.length;

  for (var i = 0; i < len; ++i) {
    var obj = all[i];
    obj.seq = obj.seq && sequence(obj.key, fn);
    obj.event = event;
    obj.fn = fn;
    fns.push(obj);
  }

  return this;
};

/**
 * Bind keyup with `keys` and `fn`.
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.up = function(keys, fn){
  return this.bind('keyup', keys, fn);
};

/**
 * Bind keydown with `keys` and `fn`.
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.down = function(keys, fn){
  return this.bind('keydown', keys, fn);
};

/**
 * Clear all modifiers on `keyup`.
 *
 * @api private
 */

exports.clear = function(e){
  var code = e.keyCode || e.which;
  if (!(code in modifiers)) return;
  this[modifiers[code]] = null;
  this.modifiers = this.command
    || this.shift
    || this.ctrl
    || this.alt;
};

/**
 * Ignore all input elements by default.
 *
 * @param {Event} e
 * @return {Boolean}
 * @api private
 */

exports.ignore = function(e){
  var el = e.target || e.srcElement;
  var name = el.tagName.toLowerCase();
  return 'textarea' == name
    || 'select' == name
    || 'input' == name;
};

/**
 * Parse the given `keys`.
 *
 * @param {String} keys
 * @return {Array}
 * @api private
 */

function parseKeys(keys){
  keys = keys.replace('super', exports.super);

  var all = ',' != keys
    ? keys.split(/ *, */)
    : [','];

  var ret = [];
  for (var i = 0; i < all.length; ++i) {
    if ('' == all[i]) continue;
    var mods = all[i].split(/ *\+ */);
    var key = mods.pop() || ',';

    ret.push({
      seq: !!~ key.indexOf(' '),
      code: keycode(key),
      mods: mods,
      key: key
    });
  }

  return ret;
}

/**
 * Check if the given `a` matches `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 * @api private
 */

function matches(a, b){
  return 0 == b.mods.length || eql(a, b);
}

/**
 * Shallow eql util.
 *
 * TODO: move to yields/eql
 *
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 * @api private
 */

function eql(a, b){
  a = a.mods.sort().toString();
  b = b.mods.sort().toString();
  return a == b;
}

});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("ed/index.js", function(exports, require, module){
var format = require('format');
var Caret = require('caret');
var Upload = require('upload');
var events = require('event');
var classes = require('classes');
var sanitize = require('sanitize');

/**
 * The interface of Editor
 */
function Editor(element, options) {
  if (!(this instanceof Editor)) {
    return new Editor(element, options);
  }
  this.options = options || {};

  var toolbar = document.createElement('div');
  toolbar.className = 'ed-toolbar';
  var content = document.createElement('div');
  content.className = 'ed-content';
  content.contentEditable = true;

  element.className += ' ed-container';
  element.appendChild(toolbar);
  element.appendChild(content);
  this.toolbar = toolbar;
  this.content = content;
  this.container = element;

  this.caret = new Caret(content);

  // fix keyboard behavior
  require('k-format')(content, {caret: this.caret});

  setupToolbar(this);

  var buttons = toolbar.getElementsByTagName('button');
  events.bind(content, 'click', function() {
    refreshStatus(buttons);
  });
  events.bind(content, 'keyup', function() {
    refreshStatus(buttons);
  });
  events.bind(toolbar, 'click', function() {
    refreshStatus(buttons);
  });
}

/**
 * Handle upload images
 */
Editor.prototype.upload = function(image, callback) {
  var me = this;
  var range = me.caret.range();

  // default callback
  callback = callback || function(err, url) {
    if (!err && url) {
      format.img(url);
      me.caret.restore(range);
      me.content.focus();
    }
  };

  var path = me.options.path;
  if (!path) {
    if (!window.FileReader) {
      throw new Error('Your browser does not support uploading image');
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      callback(null, e.target.result);
    };
    reader.readAsDataURL(image);
    return reader;
  }
  if (!window.FormData) {
    throw new Error('Your browser does not support uploading image');
  }

  var resolve = me.options.resolve || function(body) {
    if (!body) return;
    body = JSON.parse(body);
    // guess the name
    return body.url || body.image || body.data;
  };
  var upload = new Upload(image);
  upload.to(me.options, function(err, res) {
    callback(err, resolve(res.response));
  });
  return upload;
};

/**
 * Sanitized html results
 */
Editor.prototype.value = function() {
  return sanitize(this.content);
};

module.exports = Editor;

function setupToolbar(me) {
  var toolbar = me.toolbar;

  // buttons in toolbar with binding events
  function createButton(name, title, func) {
    // button will not lose caret selection
    var button = document.createElement('button');
    button.className = 'ed-button ed-icon-' + name + ' ed-button-' + name;
    if (title) {
      button.title = title;
    }
    button.name = name;

    events.bind(button, 'click', function(e) {
      e.preventDefault();
      if (func) {
        func(e);
      } else {
        format(name);
      }
    });

    toolbar.appendChild(button);
    return button;
  }

  var input = document.createElement('input');
  input.className = 'ed-link-input';
  input.type = 'url';
  input.placeholder = 'http://';

  toolbar._class = classes(toolbar);

  createButton('a', 'Insert a link', function() {
    if (!toolbar._class.has('ed-link-input-active')) {
      toolbar._class.add('ed-link-input-active');
      var node = me.caret.parent();
      if (node.tagName.toLowerCase() === 'a') {
        input.value = node.href;
      } else {
        input.value = '';
        format.a('/');
      }
      me.caret.save();
      input.focus();
    }
  });
  toolbar.appendChild(input);

  createButton('bold');
  createButton('italic');
  createButton('strike');

  createButton('blockquote', 'Blockquote text');
  createButton('ul', 'Unordered List');
  createButton('ol', 'Ordered List');
  createButton('h2', 'Heading');

  var fileInput = createFileInput();
  createButton('img', 'Insert an image', function() {
    fileInput.onchange = function(e) {
      var files = fileInput.files;
      for (var i = 0; i < files.length; i++) {
        (function(file) {
          me.upload(file);
        })(files[i]);
      }
    };
    fileInput.click();
  });

  function linky(e) {
    if (!e.keyCode || e.keyCode === 13) {
      e.preventDefault();
      toolbar._class.remove('ed-link-input-active');
      me.caret.restore();
      var url = input.value;
      if (url) {
        if (!/https?:\/\//.test(url)) {
          url = 'http://' + url;
        }
        format.a(url);
      } else {
        format.unlink();
      }
    }
  }
  events.bind(input, 'blur', linky);
  events.bind(input, 'keydown', linky);
}

function refreshStatus(buttons) {
  for (var i = 0; i < buttons.length; i++) {
    (function(button) {
      if (format.is(button.name)) {
        classes(button).add('ed-button-active');
      } else {
        classes(button).remove('ed-button-active');
      }
    })(buttons[i]);
  }
}

function createFileInput() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.style.position = 'absolute';
  input.style.top = '-999999px';
  input.style.left = '-999999px';
  document.body.appendChild(input);
  return input;
}

});






















require.alias("lepture-caret/index.js", "ed/deps/caret/index.js");
require.alias("lepture-caret/index.js", "ed/deps/caret/index.js");
require.alias("lepture-caret/index.js", "caret/index.js");
require.alias("component-event/index.js", "lepture-caret/deps/event/index.js");

require.alias("component-emitter/index.js", "lepture-caret/deps/emitter/index.js");

require.alias("lepture-caret/index.js", "lepture-caret/index.js");
require.alias("lepture-format/index.js", "ed/deps/format/index.js");
require.alias("lepture-format/index.js", "format/index.js");
require.alias("lepture-caret/index.js", "lepture-format/deps/caret/index.js");
require.alias("lepture-caret/index.js", "lepture-format/deps/caret/index.js");
require.alias("component-event/index.js", "lepture-caret/deps/event/index.js");

require.alias("component-emitter/index.js", "lepture-caret/deps/emitter/index.js");

require.alias("lepture-caret/index.js", "lepture-caret/index.js");
require.alias("component-emitter/index.js", "lepture-format/deps/emitter/index.js");

require.alias("lepture-k-format/index.js", "ed/deps/k-format/index.js");
require.alias("lepture-k-format/index.js", "ed/deps/k-format/index.js");
require.alias("lepture-k-format/index.js", "k-format/index.js");
require.alias("yields-k/lib/index.js", "lepture-k-format/deps/k/lib/index.js");
require.alias("yields-k/lib/proto.js", "lepture-k-format/deps/k/lib/proto.js");
require.alias("yields-k/lib/index.js", "lepture-k-format/deps/k/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k-sequence/deps/keycode/index.js");

require.alias("yields-k-sequence/index.js", "yields-k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k/deps/keycode/index.js");

require.alias("component-event/index.js", "yields-k/deps/event/index.js");

require.alias("component-bind/index.js", "yields-k/deps/bind/index.js");

require.alias("component-os/index.js", "yields-k/deps/os/index.js");

require.alias("yields-k/lib/index.js", "yields-k/index.js");
require.alias("lepture-caret/index.js", "lepture-k-format/deps/caret/index.js");
require.alias("lepture-caret/index.js", "lepture-k-format/deps/caret/index.js");
require.alias("component-event/index.js", "lepture-caret/deps/event/index.js");

require.alias("component-emitter/index.js", "lepture-caret/deps/emitter/index.js");

require.alias("lepture-caret/index.js", "lepture-caret/index.js");
require.alias("lepture-format/index.js", "lepture-k-format/deps/format/index.js");
require.alias("lepture-caret/index.js", "lepture-format/deps/caret/index.js");
require.alias("lepture-caret/index.js", "lepture-format/deps/caret/index.js");
require.alias("component-event/index.js", "lepture-caret/deps/event/index.js");

require.alias("component-emitter/index.js", "lepture-caret/deps/emitter/index.js");

require.alias("lepture-caret/index.js", "lepture-caret/index.js");
require.alias("component-emitter/index.js", "lepture-format/deps/emitter/index.js");

require.alias("lepture-k-format/index.js", "lepture-k-format/index.js");
require.alias("lepture-sanitize/index.js", "ed/deps/sanitize/index.js");
require.alias("lepture-sanitize/index.js", "sanitize/index.js");

require.alias("lepture-upload/index.js", "ed/deps/upload/index.js");
require.alias("lepture-upload/index.js", "upload/index.js");
require.alias("component-emitter/index.js", "lepture-upload/deps/emitter/index.js");

require.alias("yields-k/lib/index.js", "ed/deps/k/lib/index.js");
require.alias("yields-k/lib/proto.js", "ed/deps/k/lib/proto.js");
require.alias("yields-k/lib/index.js", "ed/deps/k/index.js");
require.alias("yields-k/lib/index.js", "k/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k-sequence/deps/keycode/index.js");

require.alias("yields-k-sequence/index.js", "yields-k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k/deps/keycode/index.js");

require.alias("component-event/index.js", "yields-k/deps/event/index.js");

require.alias("component-bind/index.js", "yields-k/deps/bind/index.js");

require.alias("component-os/index.js", "yields-k/deps/os/index.js");

require.alias("yields-k/lib/index.js", "yields-k/index.js");
require.alias("component-event/index.js", "ed/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("component-classes/index.js", "ed/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");
