# composable-keybindings

Helps to define custom keybindings and how they interact with one another. Usable in Node or web browsers. Inspired by Vim.

General idea:

```js
const { Keybinder } = require('composable-keydindings');

const myMap = new Map([
  ['t', { name: 'test' }]
]);

const keybinder = new Keybinder(myMap, myListener);
keybinder.handleKey('t');

function myListener(type, keybinding, status) {
  console.log(type, keybinding, status);
  // 'keybinding',
  // {
  //   keys: ['t'],
  //   countChars: [],
  //   get count: 1,
  //   action: { name: 'test' },
  //   store: {}
  // },
  // 5
};
```

<details>
  <summary>Node example</summary>

  ```js
  const { Keybinder, nodeListener } = require('composable-keydindings');

  const myMap = new Map([['t', { name: 'test' }]]);
  const keybinder = new Keybinder(myMap, myListener);

  const listener = nodeListener(onKeypress, { autoFormat: true });
  function onKeypress(char, key) {
    keybinder.handleKey(key.formatted);
  }
  ```
</details>

<details>
  <summary>Browser example</summary>

  ```js
  const { Keybinder } = require('composable-keydindings');
  const keybinder = new Keybinder(myMap, myListener);

  window.addEventListener('keydown', e => {
    keybinder.handleKey(e);
  });
  ```
</details>

TODO: explain better, host playground on gh-pages
