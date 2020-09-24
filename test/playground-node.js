const util = require('util');
const { Keybinder } = require('../src');
const nodeListener = require('../src/utils/node-listener');
const keybindings = require('./keybindings');

class Playground {
	constructor() {
		this.onKeypress = this.onKeypress.bind(this);
		this.onKeybinding = this.onKeybinding.bind(this);

		this.listener = nodeListener(this.onKeypress, { autoFormat: true });
		this.keybinder = new Keybinder(keybindings, this.onKeybinding);
	}

	onKeypress(_, key) {
		this.keybinder.handleKey(key.formatted);
	}

	onKeybinding(type, kb, status) {
		console.log(type, util.inspect(kb, { depth: 10, colors: true }));
	}
}

console.log('-- Playground Mode --');
new Playground();
