# ed

A quora like editor. **WIP**

I am sorry that you can't customize anything! And you will never be able
to customize anything.

## Installation

Install with [component(1)](http://component.io):

    $ component install lepture/ed

## API

```js
var ed = require('ed')
ed(document.querySelectory('#editor'), {
  path: '/upload'
})
```

### Options

All options are related to image uploading.

1. path: upload url path

### .value()

```js
var html = ed.value()
```

Get sanitized html of the content.

## License

MIT
