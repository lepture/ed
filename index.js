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
  this.setupToolbar();
}

Editor.prototype.setupToolbar = function() {
  var me = this;

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
      me.content.focus();
    });

    me.toolbar.appendChild(button);
    return button;
  }

  var input = document.createElement('input');
  input.className = 'ed-link-input';
  input.placeholder = 'http://';

  createButton('a', 'Insert a link', function(e) {
    classes(me.toolbar).toggle('ed-link-input-active');
  });

  me.toolbar.appendChild(input);

  createButton('bold');
  createButton('italic');
  createButton('strike');
  createButton('underline');

  createButton('blockquote', 'Blockquote text');
  createButton('ul', 'Unordered List');
  createButton('ol', 'Ordered List');

  createButton('img', 'Insert an image');
};
Editor.prototype.setupContent = function() {
};
Editor.prototype.handleUpload = function() {
};

module.exports = Editor;
