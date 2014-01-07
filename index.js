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
  events.bind(content, 'click', refreshStatus(buttons));
  events.bind(content, 'keyup', refreshStatus(buttons));
  events.bind(toolbar, 'click', refreshStatus(buttons));
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
      var node = me.caret.parent();
      if (url) {
        if (!/https?:\/\//.test(url)) {
          url = 'http://' + url;
        }
        if (node.tagName.toLowerCase() === 'a') {
          node.href = url;
        } else {
          format.a(url);
        }
      } else {
        format.unlink();
      }
    }
  }
  events.bind(input, 'blur', linky);
  events.bind(input, 'keydown', linky);
}

function refreshStatus(buttons) {
  return function() {
    for (var i = 0; i < buttons.length; i++) {
      (function(button) {
        if (format.is(button.name)) {
          classes(button).add('ed-button-active');
        } else {
          classes(button).remove('ed-button-active');
        }
      })(buttons[i]);
    }
  };
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
