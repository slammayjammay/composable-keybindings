# composable-keybindings

Define complex keybindings, inspired by Vim.

## At a glance

```js
import { Keybinder } = from 'composable-keybindings';

const keybindings = new Map([
  ['t', { name: 'test' }],
  ['ctrl+f', { name: 'find' }],
  ['z', {
    name: 'z',
    keybindings: new Map([
      ['t', { name: 'nested-t' }]
    ])
  }]
]);

const keybinder = new Keybinder(keybindings, (type, keybinding) => {
  if (type === 'keybinding') {
    console.log('found keybinding', keybinding);
  } else if (type === 'unrecognized') {
    console.log('unrecognized');
  }
});

keybinder.handleKey('t');
// {
//   keys: ['t'],
//   count: 1,
//   countChars: [],
//   action: { name: 'test' },
//   store: {}
// }
```

## Keybinding map

Recommended to use strings as keys and objects as values. Keybinding actions
(map values) accept 3 special fields:

- `keybindings` -- defines [nested keybindings](#nested-keybindings)
- `behavior` -- defines dynamic [behavior](#behavior-function)
- `interprets` -- used in conjuction with `behavior`

### Nested keybindings

Allows multiple keys to be inputted before firing an event.

```js
new Map([
  ['b', {
    keybindings: new Map([
      ['r', {
        keybindings: new Map([
          ['b', { name: 'be-right-back' }]
        ])
      }]
    ])
  }]
]);

// inputting `brb` emits:
// keybinding
// {
//   keys: ['b', 'r', 'b'],
//   count: 1,
//   countChars: [],
//   action: { name: 'be-right-back' },
//   store: {}
// }
```

### Keybinding count

Number characters are interpreted as count and by default do not fire
keybindings when inputted.

```js
new Map([['t', { name: 'test' }]])

// inputting `30t` emits:
// type 'keybinding'
// {
//   keys: ['3', '0', 't'],
//   count: 30,
//   countChars: ['3', '0'],
//   action: { name: 'test' },
//   store: {}
// }
```

`isKeyNumber` in [keybinder options](#keybinder-options) dictates whether
number characters are interpreted as count.

### Behavior Function

The `behavior` function is used for more dynamic behavior.

```js
new Map(['g', {
  name: 'read-three',
  behavior: (instructions, kb) => {
    instructions.read(3, keys => {
      kb.store.readThree = keys;
      instructions.done();
    });
  }
}]);

keybinder.handleKeys(['g', 'x', 'y', 'z']);
// emits:
// type 'keybinding'
// {
//   keys: ['g', 'x', 'y', 'z'],
//   count: 1,
//   countChars: [],
//   action: { name: 'read-three', behavior: [Function: behavior] },
//   store: { readThree: ['x', 'y', 'z'] }
// }
```

The function takes in an instructions API and the current keybinding that's
being generated. 3 instructions are available:
- [read](#instructionsread)
- [interpret](#instructionsinterpret)
- [emit](#instructionsemit)
- [done](#instructionsdone)

`instructions.done()` must be called to complete the behavior function.

Nested keybindings take priority over the behavior function. Extending the
above example, if `gx` was defined as a nested keybinding the behavior function
would not be called.

#### `instructions.read`

Waits for more keys to be inputted, then calls the callback. Requires 2
arguments: the count and callback function. Callback function is called with
the array of inputted keys.

```js
instructions.read(1, keys => {
  console.log(keys.length); // 1
  instructions.done();
});
```

#### `instructions.interpret`

Waits for the next inputted key, then checks if it points to an action in the
keybinding map. If so, that action's `behavior` function is entered. It
requires a callback function and optionally a filter function.

The callback function is called given the same arguments as the [keybinder
listener](#keybinder-listener), the `type` and `keybinding` of the sub-event.

The filter function is called given the found sub-action and should return a
boolean `true` if OK to continue and `false` if the keybinding should be
cancelled.

`instructions.interpret()` will interpret any defined keybindings "above" the
action it's defined in. To scope keybindings inside an action or override
"above" actions, specify an `interprets` map.

Actions are not allowed to interpret themselves in order to avoid endless
loops. In that case the `'cancel'` event would emit.

```js
new Map([
  // root 'a'
  ['a', {
    behavior: (instructions, kb) => {
      // `instructions.interpret()` here can look up all "above" actions (root
      // 'b' and root 'c'), as well as scoped `interprets` ('d'). However a
      // filter is given that explicity ignores 'c'
      instructions.interpret((type, subKeybinding) => {
        instructions.done();
      }, (action) => action.name !== 'c')
    },
    inteprets: new Map([
      // scoped and overrided 'b'
      ['b', {
        behavior: (instructions, kb) => {
          // inputting keys `ab` will begin to read 2 keys, not 1
          instructions.read(2, keys => instructions.done());
        }
      }],
      // scoped 'd'
      ['d', {
        behavior: (instructions, kb) => {
          instructions.done();
        }
      }]
    ])
  }],

  // root 'b'
  ['b', {
    behavior: (instructions, kb) => {
      instructions.read(1, keys => instructions.done());
    }
  }],

  // root 'c'
  ['c', {
    name: 'c',
    behavior: (instructions, kb) => {
      instructions.done();
    }
  }],
])
```

#### `instructions.emit`

Calls the listener function given with the given arguments. Similar to
`instructions.done` but doesn't reset the key map.

#### `instructions.done`

Must be called to signal the behavior function is finished. If this keybinding
is being "interpreted" by another behavior function, calling this will bubble
up to the parent's `interpret()` callback function, otherwise an event will
emitted with type either `'keybinding'`, `'unrecognized'`, or `'cancel'`.

Optionally takes an options object:
- `type`: `'keybinding'`, `'unrecognized'`, or `'cancel'` (default
  `'keybinding'`)
- `status`: one of the status [enums](src/status.js) (default `STATUS.DONE`)

If a string is given instead of an options object, it represents `type`.

`type` can also be `'resume'` or `STATUS.WAITING`, which will avoid emitting a
keybinding event and continue building on the current generated keybinding
object.

### Keybinding store

Any other data you want associated with the keybinding event used in conjuction
with the behavior function. The store can have any data in it and is not used
internally.

## Keybinder listener

The listener is called whenever something happens. It's called with the event
type and the associated generated keybinding object.

```js
// type: 'keybinding', 'unrecognized', or 'cancel'
// keybinding: generated keybinding object
new Keybinder(map, (type, keybinding) => {
  if (type === 'keybinding') {
    console.log('keybinding event emitted', keybinding);
  } else if (type === 'unrecognized') {
    console.log('no defined keybinding for the inputted keys', keybinding);
  } else if (type === 'cancel') {
    console.log('keybinding was cancelled', keybinding);
  }
});
```

## Keybinder options

Defaults, all optional:

```js
const DEFAULTS = {
	getKeybinding: (key, map) => map.get(key),
	isKeyNumber: key => /\d/.test(key),
	isKeyEscape: key => key === 'escape',
	store: {},
	filter: null
};
```

- `getKeybinding`: an intermediary step to map keypress info into the keys
inside the keybinding map.
- `isKeyNumber`: an intermediary step to map keypress info into whether it's a
  number.
- `isKeyEscape`: an intermediary step to map keypress info into whether it's
  the escape key.
- `store`: any associated data to be attached to keybinding events (used
  internally).
- `filter`: a function to filter out unwanted keybindings (used internally),
  see [instructions.interpret()](#instructionsinterpret).

## Keypress listeners

You will need to set up your own keypress listeners and call
`keybinder.handleKey()` inside them.

The argument to `handleKey()` should be a key that can be looked up in the
keybinding map, i.e. if the map keys are strings and a browser's
`KeyboardEvent` is fired, you need to transform the event into a string.

Alternatively use the `getKeybinding` option in [keybinder
options](#keybinder-options).

There are a couple helpers to format keypress events in the
[browser](src/utils/format-keyboard-event.js) and
[Node](src/utils/format-char-key.js) to serve as starting points. TODO complete
these.

There is also a [Node listener](src/utils/NodeListener.js) to help with the
boilerplate of keypress in Node.

## Playground

[Playground](https://slammayjammay.github.io/composable-keybindings/test/playground-browser/)
