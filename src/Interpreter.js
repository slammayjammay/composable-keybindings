const KeyReader = require('./KeyReader');
const { promiseable } = require('./utils');

const STATUS = {
	START: 0,
	// FOLLOWING_INSTRUCTIONS: 0.5,
	IS_READING: 1,
	IS_INTERPRETING: 2,
	NEEDS_KEY: 3,
	DONE: 4
};

class Interpreter {
	static get STATUS() {
		return STATUS;
	}

	constructor(map, store, filter) {
		this.map = map;
		this.store = store;
		this.filter = filter;

		this.followInstructions = this.followInstructions.bind(this);
		this.read = this.read.bind(this);
		this.interpret = this.interpret.bind(this);
		this.end = this.end.bind(this);

		this.replaced = new Map();
		this.added = new Map();

		this.reset();
	}

	reset(keepState) {
		this.undoCd();

		this.replaced.clear();
		this.added.clear();

		this._isReading = this._isInterpreting = false;
		this._keyReader = this._interpreter = null;

		if (!keepState) {
			this._keysEntered = [];
			this._count = '';
		}
	}

	undoCd() {
		this.replaced.forEach((val, key) => this.map.set(key, val));
		this.added.forEach((_, key) => this.map.delete(key));
	}

	// begin(store, filter) {
	// 	return new Promise((resolve, reject) => {
	// 		this.store = store;
	// 		this.filter = filter;
	// 		this._resolve = resolve;
	// 		this._reject = reject;
	// 	}).then(keybinding => {
	// 		return keybinding.action.supplemental ?
	// 			this.begin(store, filter) : Promise.resolve(keybinding);
	// 	});
	// }

	handleKey(key) {
		if (this.status === STATUS.NEEDS_KEY) {
			if (this.foundAction.keybindings.has(key)) {
				this.cdIntoAction(this.foundAction);
			} else {
				if (typeof action.behavior === 'function') {
					promiseable(this.followInstructions, [action], () => {
						this.end(true, this._getKeybindingObject(action);
					});

					readKey && this.handleKey(readKey);
				}
		}

		this._keysEntered.push(key);

		// if (this._isReading) {
		// 	return this._keyReader.handleKey(key);
		// } else if (this._isInterpreting) {
		// 	return this._interpreter.handleKey(key);
		// }

		this.encounter(key);
	}

	encounter(key) {
		const isNumber = /^\d$/.test(key);

		if (isNumber) {
			const numIsKeybinding = isNumber && this.map.has(key) && this._keysEntered.length === 1;

			if (!numIsKeybinding) {
				this._count += key;
				return;
			}
		}

		if (!this.map.has(key)) {
			this.reset();
			this.status = STATUS.START;
			return;
		}

		const action = this.map.get(key);

		if (this.filter && !this.filter(action)) {
			this.reset();
			this.status = STATUS.INTERPRET_FILTERED;
			return;
		}

		// let readKey;

		if (action.keybindings instanceof Map && action.keybindings.size > 0) {
			this.status = STATUS.NEEDS_KEY;
			this._foundAction = action;
		}

		if (typeof action.behavior === 'function') {
			// this.followInstructions(action).then(() => this.end(true, this._getKeybindingObject(action)));

			readKey && this.handleKey(readKey);
		} else {
			this.end(true, this._getKeybindingObject(action));
		}
	}

	followInstructions(action) {
		this.cdIntoAction(action);
		const { read, interpret } = this;
		return action.behavior({ read, interpret }, this.store);
	}

	cdIntoAction(action) {
		const props = ['interprets', 'keybindings'];
		const maps = props.map(p => action[p]).filter(m => m instanceof Map);

		[this.replaced, this.added] = this.getMapDiff(this.map, ...maps);

		maps.forEach(map => {
			map.forEach((val, key) => this.map.set(key, val));
		});
	}

	getMapDiff(original, ...maps) {
		const replaced = new Map();
		const added = new Map();

		maps.forEach(map => {
			for (const [key, val] of map.entries()) {
				if (original.has(key)) {
					replaced.set(key, original.get(key));
				} else {
					added.set(key, val);
				}
			}
		});

		return [replaced, added];
	}

	read(count, cb) {
		this._isReading = true;
		this._keyReader = new KeyReader();

		const fn = this._keyReader.read;
		const usePromise = typeof cb !== 'function';

		const doneCb = (...args) => {
			this._isReading = false;
			this._keyReader = null;
			return usePromise ? Promise.resolve(...args) : cb(...args);
		};

		if (usePromise) {
			return this._keyReader.read(count).then(doneCb);
		} else {
			return this._keyReader.read(count, doneCb);
		}

		return promiseable(this._keyReader.read, [count], doneCb, usePromise);
	}

	/**
	 * @param {function} [filter] - A function to filter unwanted keybindings.
	 */
	interpret(filter, cb) {
		this._isInterpreting = true;
		this._interpreter = new Interpreter(this.map);

		const doneCb = (...args) => {
			this._isInterpreting = false;
			this._interpreter = null;
			return cb(...args);
		};

		promiseable(this._interpreter.begin, [this.store, this.filter], doneCb);
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
		this._keyReader = this._interpreter = null;
		this._keysEntered = this._count = null;
	}
}

module.exports = Interpreter;
