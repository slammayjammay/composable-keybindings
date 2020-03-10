const KeyReader = require('./KeyReader');

class Interpreter {
	constructor(map) {
		this.map = map;

		this.read = this.read.bind(this);
		this.interpret = this.interpret.bind(this);
		this.end = this.end.bind(this);

		this.replaced = new Map();

		this.reset();
	}

	reset(keepState) {
		for (const [key, val] of this.replaced.entries()) {
			this.map.set(key, val);
		}
		this.replaced.clear();

		this.store = this.filter = null;
		this._resolve = this._reject = null;
		this._isReading = this._isInterpreting = false;
		this._interpreter = null;

		if (!keepState) {
			this._keysEntered = [];
			this._count = '';
		}
	}

	begin(store, filter) {
		return new Promise((resolve, reject) => {
			this.store = store;
			this.filter = filter;
			this._resolve = resolve;
			this._reject = reject;
		}).then(keybinding => {
			return keybinding.action.supplemental ?
				this.begin(store, filter) : Promise.resolve(keybinding);
		});
	}

	handleKey(key) {
		this._keysEntered.push(key);

		if (this._isReading) {
			return this._keyReader.handleKey(key);
		} else if (this._isInterpreting) {
			return this._interpreter.handleKey(key);
		}

		this.encounter(key);
	}

	async encounter(key) {
		const isNumber = /^\d$/.test(key);

		if (isNumber) {
			const numIsKeybinding = isNumber && this.map.has(key) && this._keysEntered.length === 1;

			if (!numIsKeybinding) {
				this._count += key;
				return;
			}
		}

		if (!this.map.has(key)) {
			return this.end();
		}

		const action = this.map.get(key);

		if (this.filter && !this.filter(action)) {
			this.end();
			return;
		}

		let readKey;

		if (action.keybindings instanceof Map && action.keybindings.size > 0) {
			await this.read(1);
			readKey = this._keysEntered.pop();

			if (action.keybindings.has(readKey)) {
				this.replaceMap(action);
				this.handleKey(readKey);
				return;
			}
		}

		if (typeof action.behavior === 'function') {
			this.followInstructions(action)
				.then(() => this.end(true, this._getKeybindingObject(action)))
				.catch(() => this.end(false, this._getKeybindingObject(action)));

			readKey && this.handleKey(readKey);
		} else {
			this.end(true, this._getKeybindingObject(action));
		}
	}

	followInstructions(action) {
		this.replaceMap(action);
		const { read, interpret } = this;
		return action.behavior({ read, interpret }, this.store);
	}

	replaceMap(action) {
		const replace = (action, prop) => {
			if (action[prop] instanceof Map) {
				for (const [key, val] of action[prop].entries()) {
					if (this.map.has(key)) {
						this.replaced.set(key, this.map.get(key));
					}

					this.map.set(key, val);
				}
			}
		};

		['interprets', 'keybindings'].forEach(prop => replace(action, prop));
	}

	async read(count) {
		this._isReading = true;
		this._keyReader = new KeyReader();

		const keys = await this._keyReader.begin(count);

		this._isReading = false;
		this._keyReader = null;

		return keys;
	}

	/**
	 * @param {function} [filter] - A function to filter unwanted keybindings.
	 */
	async interpret(filter) {
		this._isInterpreting = true;
		this._interpreter = new Interpreter(this.map);

		return this._interpreter.begin(this.store, ...arguments).then((...args) => {
			this._isInterpreting = false;
			this._interpreter = null;
			return Promise.resolve(...args);
		});
	}

	end(success = false, ...args) {
		(success ? this._resolve : this._reject)(...args);
		this.reset(success);
	}

	_getKeybindingObject(action) {
		return {
			action,
			count: this._count === '' ? 1 : parseInt(this._count),
			keysEntered: this._keysEntered,
			store: this.store
		};
	}

	destroy() {
		this.map = this.store = this.filter = null;
		this._resolve = this._reject = null;
		this._isReading = this._isInterpreting = false;
		this._interpreter = null;
		this._keysEntered = this._count = null;
	}
}

module.exports = Interpreter;
