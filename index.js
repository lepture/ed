var format = require('format');
var Caret = require('caret');
var events = require('event');
var classes = require('classes');

/**
 * The interface of Editor
 */
function Editor(element, options) {
  if (!(this instanceof Editor)) {
    return new Editor(element, options);
  }

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

module.exports = Editor;

function setupToolbar(me) {
  var toolbar = me.toolbar;

  // buttons in toolbar with binding events
  function createButton(name, title, func) {
    // button will not lose caret selection
    var button = document.createElement('button');
    button.className = 'ed-button icon-' + name + ' ed-button-' + name;
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

  createButton('a', 'Insert a link', function(e) {
    e.preventDefault();
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

  createButton('img', 'Insert an image');

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
