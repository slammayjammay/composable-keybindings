# `composable-keybindings`

Create composable keybindings, usable in Node or the browser.

Types of keybindings:

| behavior | description
| - | - |
| 1-to-1 | one key fires one keybinding
| nested | multiple keys fire one keybinding
| read additional | keybinding is recognized, but will read additional key(s) before firing
| interpret additional | keybinding is recognized, but will interpret additional key(s) before firing
| supplemental | keybinding does not fire when recognized but can be combined with others

"Reading" additional keys means that the next key pressed will be directly passed: pressing `j` will pass the key `j`.

"Interpreting" additional keys means that the keybinding associated with the next key pressed will be passed: pressing `j` will pass the `j` keybinding.

## How to define

```js
vats.setKeybinding(key: String, options: Object);
```

- `key` - must be a correctly formatted character string. See `InputHandler#formatCharKey` for more info.
- `options` -
  - `keybindings` -- (map, optional) nested keys scoped under this keybinding.
  - `interprets` -- (map, optional) keybindings available for interpret, in addition to root keybinding map.
  - `behavior` -- (function, optional) behavior for this keybinding. called with an instructions object and a store object. must return a promise that when resolved finishes the keybinding.
  - `supplemental` -- (boolean, default `false`) no keybinding event is fired when detected

<details>
<summary>More about options</summary>

### `options.keybindings`

Nested keybindings allows a sequence of inputted keys to fire one keybinding event. For example keybinding `t` can have a nested keybinding `a`, such that the `nested-keybinding` event will fire when the user presses `t` then `a`.

```js
vats.setKeybinding('t', {
  name: 'test',
  keybindings: new Map([
    ['a', { name: 'nested-keybinding' }]
  ])
});
```

### `options.interprets`

Applicable when calling `interpret()` in the behavior function. Any keybindings inside `options.interprets` are now available in additional to all keybindings defined in the root map.

This is different from `options.keybindings` in that the interpreted keybinding is not the one that is fired in the event. E.g. defining the keybinding below and pressing `ta` will fire the `test` keybinding:

```js
vats.setKeybinding('t', {
  name: 'test',
  interprets: new Map([
    ['a', { name: 'nested-interpret' }]
  ]),
  behavior: ({ interpret }, store) => {
    return interpret().then(keybinding => {
      store.keybinding = keybinding;
    });
  }
});
```

### `options.behavior`

When this function is given, the keybinding does not immediately fire when detected. Instead, this function is called and a promise is returned. If rejected, the keybinding resets. Otherwise additional keys can be read/interpreted, or other custom keybinding behavior occurs, then the promise resolves and the keybinding will fire.

```js
behavior(instructions: Object, store: Object): Promise
```

- `instructions` - includes some helper functions (`read`, `interpret`)
- `store` - plain object to store additional keybinding info
- returns Promise - resolves when behavior is finished or rejects to cancel

```js
read(count: Number): Promise
```

- `count` - number of keys to read
- returns Promise<array> - resolves with an array of keys when reading is finished. Doesn't reject.

```js
interpret(filter?: Function): Promise
```

- `filter` - filter function to weed out undesired keybindings.
- returns Promise - resolves with a found keybinding, or rejects if none is found.

### `options.supplemental`

A value of `true` means that keybindings will fire after their behavior function finishes. When `false`, the behavior function is still called but instead of firing, another keybinding will be interpreted. The last non-supplemental keybinding to be recognized is the one that will fire.
</details>

## How it works

0. Define all keybindings in a Map.
1. When the user presses a key, a keybinding is found.
2. If there are nested keybindings, wait for more keys to be inputted to determine the desired keybinding.
3. Once the correct one is found, its `behavior` function is called, which may require more keys to be inputted.
4. Once the `behavior` function finishes, the keybinding ends (but does not fire) with either success or failure (resolve or reject).
5. If not `supplemental`, fire the keybinding. Otherwise, repeat entire process from step 1.

## Listeners

Keybinding listeners are called given one object argument with these keys:

- `action` -- (string) name of the keybinding
- `count` -- (number) count associated with keybinding
- `store` -- (object) any additional info associated with keybinding
- `keysEntered` -- (array<string>) all keys entered

## Examples

<details>
<summary>1-to-1</summary>

Set `j` to fire keybinding `cursor-down`:

```js
vats.setKeybinding('j', { name: 'cursor-down' });
vats.on('keybinding', console.log);

// output when user presses `j`:
// {
//   action: { name: 'cursor-down' },
//   count: 1,
//   store: {},
//   keysEntered: ['j']
// }
```
</details>

<details>
<summary>Nested keybindings</summary>

Set `y`, when pressed twice, to fire keybinding `yank-line`.

```js
vats.setKeybinding('y y', { name: 'yank-line' });
vats.on('keybinding', console.log);

// output when user presses `2yy`:
// {
//   action: { name: 'yank-line' },
//   count: 2,
//   store: {},
//   keysEntered: ['2', 'y', 'y']
// }
```

Above is a shortcut. Here is another way to define `yy` using nested keybindings:

```js
vats.setKeybinding('y', {
  name: 'yank',
  keybindings: new Map([
    ['y', { name: 'yank-line' }]
  ])
});
```
</details>

<details>
<summary>Behavior function</summary>

### read

Set `f` to read a key and then fire keybinding `find`.

```js
vats.setKeybinding('f', {
  name: 'find',
  behavior: ({ read }, store) => {
    return read(1).then(keys => {
      store.foundKey = keys[0];
    });
  }
});

vats.on('keybinding', console.log);

// output when user presses `fa`:
// {
//   action: { name: 'find' },
//   count: 1,
//   store: {},
//   keysEntered: ['f', 'a']
// }
```

### interpret

Set `d` to interpret a keybinding and fire keybinding `delete`.

```js
// simplified version
vats.setKeybinding('d', {
  name: 'delete',
  behavior: async ({ interpret }, store) => {
    return interpret().then(keybinding => {
      store.motion = keybinding;
    });
  }
});

vats.setKeybinding('j', { name: 'cursor-down', type: 'motion' });

vats.on('keybinding', console.log);

// output when user presses `d2j`:
// {
//   action: { name: 'delete' },
//   count: 1,
//   store: {
//     motion: {
//       action: { name: 'cursor-down', type: 'motion' },
//       count: 2,
//       store: {},
//       keysEntered: ['2', 'j']
//     }
//   }
//   keysEntered: ['d', '2', 'j']
// }
```

</details>

<details>
<summary>Supplemental</summary>

```js
vats.setKeybinding('t', { name: 'test' });

vats.setKeybinding('"', {
  name: 'register',
  supplemental: true,
  behavior: ({ read }, store) => {
    return read(1).then(keys => store.register = keys[0]);
  }
});

vats.on('keybinding', console.log);

// output when user presses `2"at`:
// {
//   action: { name: 'test' },
//   count: 2,
//   store: { register: 'a' },
//   keysEntered: ['2', '"', 'a', 't']
// }
```

Note that two keybindings are recognized, `"` and then `t`, but the keybinding event is associated with `t`. This is because `"` has the `supplemental` flag, which means it does not fire a keybinding event when recognized. Instead it adds a property to `store` and more keys will be read before an event is fired.
</details>

<details>
<summary>Complicated</summary>

Let's fully implement Vim's `delete` keybinding, which makes use of multiple features.

- when pressed twice, deletes entire line (`dd`)
- can be composed with cursor motion keybindings (`dj`)
- can be composed with text object keybindings (`diw`)
- keybinding is cancelled when a key combo is not recognized (e.g. `dy`)

Let's assume that the `j` or `cursor-down` keybinding is already defined.

```js
vats.setKeybinding('d', {
  name: 'delete',
  keybindings: new Map([['d', { name: 'delete-line' }]]),
  behavior: ({ interpret }, store) => {
    return new Promise((resolve, reject) => {
      const filter = kb => ['motion', 'text-object'].includes(kb.type);

      interpret(filter).then(keybinding => {
        store[keybinding.type] = keybinding;
        resolve();
      }).catch(reject);
    });
  },
  interprets: new Map([
    ['i', {
      name: 'inner',
      type: 'text-object',
      behavior: ({ read }, store) => {
        return read(1).then(keys => store.inner = keys[0]);
      }
    }]
  ])
});
```

This is one way to define the keybinding behavior. To actually make use of inputted keys there will have to be a listener attached to determine the behavior. Below is a possibility.

```js
vats.on('keybinding', (obj) => {
  if (obj.action.name === 'delete-line') {
    __deleteLinePseudo(obj.count);
  } else if (obj.action.name === 'delete') {
    __deletePseudo(obj);
  }
});

function __deleteLinePseudo(count) {
  for (let i = 0; i < count; i++) {
    __deleteCurrentLinePseudo();
  }
}

function __deletePseudo({ action, count, store, keysEntered }) {
  if (store.motion) {
    const start = __getCursorPos();
    const end = __getNewPosFromKeybinding(store.motion);
    __deleteFromStartToEnd(start, end, count);
  } else if (store['text-object']) {
    const textObject = __getTextObject(store, count);
    __deleteTextObject(textObject);
  }
}
```

<details>
<summary>Keypress walkthrough</summary>

### `dd`

1. user presses `d`
    - `delete` keybinding is recognized. `keybindings` and/or `behavior` is present, so more keys need to be read.
2. user presses `d`
    - `d` is inside `delete`'s keybindings map, so detect it.
    - `delete-line` does not need more input, so fire `delete-line` immediately.
3. keybinding fires

### `dj`

1. user presses `d`
    - `delete` keybinding is recognized. `keybindings` and/or `behavior` is present, so more keys need to be read.
2. user presses `j`
    - `j` is not inside `delete`'s keybindings map, so call `behavior` function.
    - `interpret` is called, `j` is interpreted, and `interpret` resolves with the `cursor-down` keybinding. `delete` modifies `store` and resolves successfully.
3. keybinding fires

### `diw`

1. user presses `d`
    - `delete` keybinding is recognized. `keybindings` and/or `behavior` is present, so more keys need to be read.
2. user presses `i`
    - `i` is not inside `delete`'s keybindings map, so call `behavior` function
    - `interpret` is called and `i` is interpreted.
    - `i` is inside `delete`'s `interprets` map, so call `inner` `behavior` function.
    - `read` is called, so wait for user to press a key
3. user presses `w`
    - `read` resolves with `['w']`; `inner` modifies `store` and resolves successfully.
    - pop back up to `delete`'s `behavior` function, where `interpret` resolves with the `inner` keybinding. `delete` modifies `store` and resolves successfully.
4. keybinding fires

### `dy`

Assume `y` keybinding is not defined and its behavior is identical to Vim's `y` keybinding.

1. user presses `d`
    - `delete` keybinding is recognized. `keybindings` and/or `behavior` is present, so more keys need to be read.
2. user presses `y`
    - `y` is not inside `delete`'s keybindings map, so call `behavior` function.
    - `interpret` is called and `y` is interpreted.
    - `y` is not of type `motion` or `text-object`, so the promise rejects and the keybinding cancels.

</details>

</details>
