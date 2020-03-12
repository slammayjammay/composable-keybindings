const util = require('util');
const { emitKeypressEvents } = require('readline');
const Keybinder = require('../src');
const seeds = require('./seeds');

class Playground {
	constructor() {
		this._onKeypress = this._onKeypress.bind(this);
		this._onKeybinding = this._onKeybinding.bind(this);
		this._onKeybindingCancel = this._onKeybindingCancel.bind(this);
		this._onKeybindingError = this._onKeybindingError.bind(this);

		emitKeypressEvents(process.stdin);
		process.stdin.resume();
		process.stdin.setRawMode(true);
		process.stdin.addListener('keypress', this._onKeypress);

		this.keybinder = new Keybinder();
		this.keybinder.setKeybindings(seeds);
		this.keybinder.on('keybinding', this._onKeybinding);
		this.keybinder.on('keybinding-cancel', this._onKeybindingCancel);
		this.keybinder.on('keybinding-error', this._onKeybindingError);
	}

	_onKeypress(char, key) {
		// ctrl+c -- SIGINT
		if (key.sequence === '\u0003') {
			process.kill(process.pid, 'SIGINT');
			return;
		}

		this.keybinder.handleCharKey(char, key);
	}

	_onKeybinding(stuff) {
		console.log(util.inspect(stuff, { depth: 10, colors: true }), '\n');
	}

	_onKeybindingCancel(stuff) {
		console.log('cancel', stuff);
	}

	_onKeybindingError(e) {
		console.log(e);
	}
}

console.log('-- Entering Playground Mode --');
new Playground();
