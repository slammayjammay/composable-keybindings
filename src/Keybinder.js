const { EventEmitter } = require('events');
const Interpreter = require('./Interpreter');

const SHIFTABLE_KEYS = new Set([
	'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'
]);

const NODE_KEY_CONVERSION = {
	return: 'enter'
};

class Keybinder extends EventEmitter {
	/**
	 * When creating a keybinding, prepending "shift+" only makes sense when
	 * these special keys are pressed. When normal keys are pressed, just add
	 * that character instead. For example, "N" is valid whereas "shift+n" is
	 * not.
	 */
	static get SHIFTABLE_KEYS() {
		return SHIFTABLE_KEYS;
	}

	/**
	 * Node's char/key to represent a keypress is annoying. Instead, convert
	 * char/key to one string.
	 *
	 * Keys are the strings present in `key.name`, values are what will be used
	 * in the final keypress string. If `char` is empty but `key.name` is present
	 * (e.g. "escape"), and `key.name` is not present in this object, then
	 * `key.name` will be used in the keypress string.
	 *
	 * See #formatCharKey
	 */
	static get NODE_KEY_CONVERSION() {
		return NODE_KEY_CONVERSION;
	}

	constructor() {
		super();

		this.map = new Map();

		this.onKeybindingFound = this.onKeybindingFound.bind(this);
		this.onKeybindingCancelled = this.onKeybindingCancelled.bind(this);

		this.reset();
	}

	reset() {
		if (this.interpreter) {
			this.interpreter = null;
			this.store = null;
		}
		this.store = {};
		this.interpreter = new Interpreter(this.map);
		this.interpreter.begin(this.store)
			.then(this.onKeybindingFound)
			.catch(this.onKeybindingCancelled);
	}

	hasKeybinding() { return this.map.has(...arguments); }
	getKeybinding() { return this.map.get(...arguments); }
	setKeybinding() { return this.map.set(...arguments); }
	deleteKeybinding() { return this.map.delete(...arguments); }
	clearKeybindings() { return this.map.clear(...arguments); }

	setKeybindings(map) {
		for (const [key, keybinding] of map.entries()) {
			this.setKeybinding(key, keybinding);
		}
	}

	onKeybindingFound(keybinding) {
		this.emit('keybinding', keybinding);
		this.reset();
	}

	onKeybindingCancelled(keybinding) {
		if (keybinding instanceof Error) {
			this.emit('keybinding-error', keybinding);
		} else {
			this.emit('keybinding-cancel', keybinding);
		}

		this.reset();
	}

	formatCharKey(char, key) {
		let formatted;

		if (key.ctrl || key.meta) {
			formatted = key.name;
		} else if (char === key.sequence) {
			formatted = char;
		} else {
			formatted = key.name;
		}

		if (this.constructor.NODE_KEY_CONVERSION[key.name]) {
			formatted = this.constructor.NODE_KEY_CONVERSION[key.name];
		}

		// order matters!
		if (key.ctrl) formatted = `ctrl+${formatted}`;
		if (key.option) formatted = `option+${formatted}`;
		if (key.meta && formatted !== 'escape') formatted = `meta+${formatted}`;

		// should not add shift when normal characters are pressed (e.g. "N").
		// also, node sometimes does not set `key.shift` as true -- e.g. on
		// shift+enter, `key.shift` is false. That is node's problem -- enter is
		// still a "shiftable" key in this context.
		if (key.shift && this.constructor.SHIFTABLE_KEYS.has(key.name)) {
			formatted = `shift+${formatted}`;
		}

		return formatted;
	}

	handleCharKey(char, key) {
		const formatted = this.formatCharKey(char, key);
		return this.handleKey(formatted);
	}

	/**
	 * @return {object|boolean} - If a keybinding is found, returns a keybinding
	 * object. If no keybinding is found, or if additional keys are needed to
	 * complete a keybinding, returns null.
	 */
	handleKey(formatted) {
		return this.interpreter.handleKey(formatted);
	}

	async handleCharKeys(array) {
		for (let i = 0, l = array.length; i < l; i++) {
			this.handleCharKey(array[i]);
			await new Promise(process.nextTick);
		}
	}

	// TODO
	async handleKeys(array) {
		for (let i = 0, l = array.length; i < l; i++) {
			this.handleKey(array[i]);
			await new Promise(process.nextTick);
		}
	}

	destroy() {
		this.removeAllListeners();
		this.map.clear();
		this.map = null;
	}
}

module.exports = Keybinder;
