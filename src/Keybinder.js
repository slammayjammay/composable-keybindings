import Interpreter from './Interpreter.js';

class Keybinder {
	static handleKeys(keys, ...args) {
		const keybinder = new this(...args);
		keybinder.handleKeys(keys);
		return keybinder;
	}

	constructor(map, cb, options) {
		this.originalMap = map ? map : new Map();
		this.map = new Map([...this.originalMap]);
		this.interpreter = new Interpreter(this.map, cb, options);
	}

	handleKey(key) {
		return this.interpreter.handleKey(key);
	}

	handleKeys(keys) {
		return this.interpreter.handleKeys(keys);
	}

	cancel() {
		this.interpreter.cancel();
	}

	destroy() {
		this.interpreter.destroy();
		this.interpreter = null;
		this.map.clear();
		this.map = this.originalMap = null;
	}
}

export default Keybinder;
