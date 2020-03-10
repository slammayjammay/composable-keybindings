const util = require('util');
const { emitKeypressEvents } = require('readline');
const Keybinder = require('../src');

class Tester {
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
		this.keybinder.on('keybinding', this._onKeybinding);
		this.keybinder.on('keybinding-cancel', this._onKeybindingCancel);
		this.keybinder.on('keybinding-error', this._onKeybindingError);

		setKeybindings(this.keybinder);
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
		console.log('\n\n', util.inspect(stuff, { depth: 10, colors: true }));
	}

	_onKeybindingCancel(stuff) {
		console.log('cancel', stuff);
	}

	_onKeybindingError(e) {
		console.log(e);
	}
}

new Tester();

function setKeybindings(keybinder) {
	keybinder.setKeybindings(new Map([
		['t', { name: 'test' }],
		['f', {
			name: 'find',
			type: 'motion',
			behavior: ({ read }, store) => {
				return read(1).then(keys => store.find = keys[0]);
			}
		}],
		['d', {
			name: 'delete',
			keybindings: new Map([
				['d', { name: 'delete-line' }]
			]),
			behavior: ({ interpret }, store) => {
				const filter = kb => ['textObject', 'motion'].includes(kb.type);
				return interpret(filter).then(kb => store[kb.action.type] = kb);
			},
			interprets: new Map([
				['i', {
					name: 'inner',
					type: 'textObject',
					behavior: async ({ read }, store) => {
						store.inner = (await read(1))[0];
					}
				}]
			])
		}],
		['y', {
			name: 'yank',
			keybindings: new Map([
				['y', { name: 'yank-line' }],
				['z', { name: 'zzzzzzzzzzzz' }],
			])
		}],
		['i', { name: 'insert' }],
		['j', { name: 'cursor-down', type: 'motion' }],
		['"', {
			name: 'register',
			supplemental: true,
			behavior: async ({ read }, store) => {
				store.register = (await read(1))[0];
			}
		}]
	]));
}
