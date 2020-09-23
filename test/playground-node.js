const util = require('util');
const { Keybinder, nodeListener, formatCharKey } = require('../src');
const keybindings = require('./keybindings');

class Playground {
	constructor() {
		this.onKeypress = this.onKeypress.bind(this);
		this.onKeybinding = this.onKeybinding.bind(this);

		this.listener = nodeListener(this.onKeypress, { autoFormat: true });
		this.keybinder = new Keybinder(keybindings, this.onKeybinding);
	}

	onKeypress(_, key) {
		if (key.formatted === 'meta+backspace') {
			this.listener.end();
			return;
		}

		this.keybinder.handleKey(key.formatted);
	}

	onKeybinding(type, kb, status) {
		console.log(type, util.inspect(kb, { depth: 10, colors: true }));
	}
}

console.log('-- Playground Mode --');
new Playground();
