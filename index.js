
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
}

Editor.prototype.setupToolbar = function() {
};
Editor.prototype.setupContent = function() {
};
Editor.prototype.handleUpload = function() {
};

module.exports = Editor;
