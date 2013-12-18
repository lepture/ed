var format = require('format');
var Caret = require('caret');
var events = require('event');

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

  this.setupToolbar();
}

Editor.prototype.setupToolbar = function() {
  var me = this;

  // buttons in toolbar with binding events
  function createButton(name, title) {
    // button will not lose caret selection
    var button = document.createElement('button');
    button.className = 'ed-button icon-' + name + ' ed-button-' + name;
    if (title) {
      button.title = title;
    }
    button.name = name;

    events.bind(button, 'click', function() {
      me.caret.save();
      if (name === 'a') {
        me.caret.restore();
      } else if (name === 'img') {
      } else {
        format(name);
      }
      me.content.focus();
    });

    me.toolbar.appendChild(button);
    return button;
  }

  createButton('bold');
  createButton('italic');
  createButton('strike');
  createButton('underline');

  createButton('blockquote', 'Blockquote text');
  createButton('ul', 'Unordered List');
  createButton('ol', 'Ordered List');

  createButton('a', 'Insert a link');
  createButton('img', 'Insert an image');
};
Editor.prototype.setupContent = function() {
};
Editor.prototype.handleUpload = function() {
};

module.exports = Editor;
