import Interpreter from './Interpreter.js';

export default class Keybinder {
	static handleKeys(keys, ...args) {
		const keybinder = new this(...args);
		keybinder.handleKeys(keys);
		return keybinder;
	}

	constructor(map = new Map(), cb, options) {
		this.map = map;
		this.interpreter = new Interpreter(this.map, cb, options);
	}

	handleKey = (key) => {
		return this.interpreter.handleKey(key);
	}

	handleKeys = (keys) => {
		return this.interpreter.handleKeys(keys);
	}

	cancel = () => {
		this.interpreter.cancel();
	}

	reset = () => {
		this.interpreter.reset();
	}

	destroy = () => {
		this.interpreter.destroy();
		this.map.clear();
		this.interpreter = this.map = null;
	}
}
