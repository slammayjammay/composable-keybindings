# composable-keybindings

Define complex keybindings, inspired by Vim's.

Provide a map outlining keybinding behavior and a callback function to handle
events. Then call `keybinder.handleKey()` when keys are pressed.

## At a glance

```js
import { Keybinder } = from 'composable-keybindings';

// define keybinding structure.
// keys are (not-necessarily) strings representing keypresses.
// values are the actions associated with the key.
const keybindings = new Map([
  ['t', { name: 'test' }],
  ['ctrl+f', { name: 'find' }],
  ['z', {
    name: 'z',
    keybindings: new Map([
      ['t', { name: 'nested-t' }]
    ])
  }],
  ['r', {
    behavior: (instructions, kb) => {
      instructions.read(2, keys => {
        kb.store.read = keys;
      });
    }
  }]
]);

// init, giving keybinding map and callback
const keybinder = new Keybinder(keybindings, (type, keybinding) => {
  if (type === 'keybinding') {
    // a keybinding is found
    console.log(keybinding);
  }
});

// 1. input key 't'
// 2. 't' is defined in `keybindings` so a keybinding will be emitted
// 3. a keybinding object is generated
// 4. callback function is called with type 'keybinding' and the generated
//    keybinding object
keybinder.handleKey('t');
// generated keybinding object is logged:
// {
//   keys: ['t'], // all keys associated with this keybinding
//   count: 1, // the keybinding count
//   countChars: [], // all characters associated with keybinding count
//   action: { name: 'test' }, // found action (defined in keybinding map)
//   store: {} // any other data associated with keybinding
// }
```

## Keybinding map

Recommended to use strings as keys and objects as values. Keybinding actions
(map values) accept 3 special fields:

- `keybindings` -- defines [nested keybindings](#nested-keybindings)
- `behavior` -- defines dynamic [behavior](#behavior-function)
- `interprets` -- used in conjuction with `behavior`

### Nested keybindings

Allows one keybinding event to fire after inputting multiple keys.

For example, to fire a keybinding after inputting `brb`:

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
```

The first `b` does not fire a keybinding event because the field `keybindings`
points to a map. We "cd" into the map and wait for more input. Same thing with
`r`. The last `b` has no nested keybindings (or behavior function), so a
keybinding event is finally fired.

```js
// type 'keybinding'
{
  keys: ['b', 'r', 'b'],
  count: 1,
  countChars: [],
  action: { name: 'be-right-back' },
  store: {}
}
```

### Keybinding count

Number characters are interpreted as count. Consider:

```js
new Map([
  ['b', { name: 'back' }]
])
```

Inputting keys `30b` will emit one keybinding event:

```js
// type 'keybinding'
{
  keys: ['3', '0', 'b'],
  count: 30,
  countChars: ['3', '0'],
  action: { name: 'back' },
  store: {}
}
```

### Behavior Function

The `behavior` function is used for more dynamic behavior. Simple outline:

```js
new Map(['g', {
  name: 'read-three',
  behavior: (instructions, kb) => {
    instructions.read(3, keys => instructions.done());
  }
}]);

keybinder.handleKeys(['g', 'x', 'y', 'z']);
// emits one keybinding event:
// type 'keybinding'
// {
//   keys: ['g', 'x', 'y', 'z'],
//   count: 1,
//   countChars: [],
//   action: { name: 'read-three', behavior: [Function: behavior] },
//   store: {}
// }
```

The function takes in an instructions API and the current keybinding that's
being generated. 3 instructions are available:
- <a href="#instructions-read">read</a>
- <a href="#instructions-interpret">interpret</a>
- <a href="#instructions-done">done</a>

Nested keybindings take priority over the behavior function.

#### `instructions.read`

Waits for more keys to be inputted, then calls the callback. Requires 2
arguments: the count and callback function. Callback function is called with
the array of inputted keys.

`instructions.done()` must be called to complete the behavior function.

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

The callback function is called given the same arguments as the <a
href="#keybinder-listener">keybinder listener</a>, the `type` and `keybinding`
of the sub-event.

The filter function is called given the found sub-action and returns a boolean
`true` if OK to continue and `false` if the keybinding should be cancelled.

`instructions.interpret()` will interpret any defined keybindings "above" the
action it's defined in. To scope keybindings inside an action or override
"above" actions, specify an `interprets` map.

Actions are not allowed to interpret themselves in order to avoid endless
loops. In this case the `'cancel'` event would emit.

`instructions.done()` must be called to complete the behavior function.

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

#### `instructions.done`

Must be called to signal the behavior function is finished. If this keybinding
is being "interpreted" by another behavior function, calling this will bubble
up to the parent's `interpret()` callback function, otherwise an event will
emitted with type either `'keybinding'`, `'unrecognized'`, or `'cancel'`.

Optionally takes in an argument:
- `'unrecognized'` -- Signifiy that the current keybinding being generated
  should end and no keybinding event should emit.
- `'cancel'` -- Same as `'unrecognized'` with slightly different nuance.
- `'resume'` or `1` -- Avoid emitting a keybinding event and continue building
  on the current generated keybinding object.

### Keybinding store

Any other data you want associated with the keybinding event. An example:

```js
new Map([
  ['r', {
    name: 'read-1-key',
    behavior: (instructions, kb) => {
      instructions.read(1, keys => {
        kb.store.r = keys[0];
      });
    }
  }],
  ['n', {
    name: 'n',
    behavior: (instructions, kb) => {
      instructions.interpret((type, subKb) => {
        type === 'keybinding' ? instructions.done() : instructions.done('unrecognized');
      });
    }
  }]
]);

// Inputting keys `nrq` emits this keybinding:
// {
//   keys: ['n', 'r', 'q']
//   count: 1,
//   countChars: [],
//   action: { name: 'n', behavior: [Function: behavior] },
//   store: { r: 'q' }
// }
```

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
  see <a href="#instructions-interpret">instructions.interpret()</a>.
