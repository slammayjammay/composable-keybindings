const util = require('util');
const { emitKeypressEvents } = require('readline');
const Keybinder = require('../src');
const formatCharKey = require('../src/utils/format-char-key');
const keybindings = require('./keybindings');

class Playground {
	constructor() {
		this._onKeypress = this._onKeypress.bind(this);
		this._onKeybinding = this._onKeybinding.bind(this);

		emitKeypressEvents(process.stdin, { escapeCodeTimeout: 50 });
		process.stdin.resume();
		process.stdin.setRawMode(true);
		process.stdin.addListener('keypress', this._onKeypress);

		this.keybinder = new Keybinder(keybindings, this._onKeybinding, {
			getKeybinding: (key, map) => map.get(key.formatted),
			isKeyNumber: key => /\d/.test(key.formatted),
			isKeyEscape: key => key.formatted === 'escape'
		});
	}

	_onKeypress(char, key) {
		// ctrl+c -- SIGINT
		if (key.sequence === '\u0003') {
			process.kill(process.pid, 'SIGINT');
			return;
		}

		key.formatted = formatCharKey.toString(char, key);
		this.keybinder.handleKey(key);
	}

	_onKeybinding(type, kb, status) {
		console.log(type, util.inspect(kb, { depth: 10, colors: true }));
	}
}

console.log('-- Playground Mode --');
new Playground();
