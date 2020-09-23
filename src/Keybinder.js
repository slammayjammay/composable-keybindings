const Interpreter = require('./Interpreter');

class Keybinder {
	static handleKeys(keys, ...args) {
		const keybinder = new this(...args);
		keys.forEach(key => keybinder.handleKey(key));
	}

	constructor(map, cb, options) {
		this.originalMap = map ? map : new Map();
		this.map = new Map([...this.originalMap]);
		this.interpreter = new Interpreter(this.map, cb, options);
	}

	handleKey(key) {
		return this.interpreter.handleKey(key);
	}

	handleKeys(keys, cb) {
		return this.constructor.handleKeys(keys, new Map([...this.originalMap]), cb);
	}

	destroy() {
		this.interpreter.destroy();
		this.interpreter = null;
		this.map.clear();
		this.map = this.originalMap = null;
	}
}

module.exports = Keybinder;
