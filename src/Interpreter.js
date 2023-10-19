import Keybinding from './Keybinding.js';
import KeyReader from './KeyReader.js';
import STATUS from './status.js';
import getMapDiff from './utils/get-map-diff.js';

const DEFAULTS = {
	getKeybinding: (key, map) => map.get(key),
	isKeyNumber: key => /\d/.test(key),
	isKeyEscape: key => key === 'escape',
	store: {},
	filter: null
};

class Interpreter {
	constructor(map, doneCb = (() => {}), options = {}) {
		this.map = map;
		this.doneCb = doneCb;
		this.options = { ...DEFAULTS, ...options };

		this.read = this.read.bind(this);
		this.interpret = this.interpret.bind(this);
		this.done = this.done.bind(this);

		this.kb = new Keybinding({ store: this.options.store });

		this.cds = [{ action: null }];
		this.keyReader = this.interpreter = null;

		this.status = STATUS.WAITING;
	}

	reset() {
		this.cdToRoot();
		this.status = STATUS.WAITING;
		this.kb = new Keybinding();
	}

	handleKeys(keys) {
		keys.forEach(key => this.handleKey(key));
	}

	handleKey(key) {
		if (this.options.isKeyEscape(key)) {
			return this.onDone('cancel');
		}

		if (this.status === STATUS.NEEDS_KEY) {
			return this.onNeededKey(key);
		}

		this.kb.keys.push(key);

		if (this.status === STATUS.WAITING) {
			this.onWaiting(key);
		} else if (this.status === STATUS.IS_READING) {
			this.keyReader.handleKey(key);
		} else if (this.status === STATUS.IS_INTERPRETING) {
			this.interpreter.handleKey(key);
		}
	}

	onWaiting(key) {
		const action = this.options.getKeybinding(key, this.map);

		if (this.options.isKeyNumber(key) && !(this.kb.countChars.length === 0 && action)) {
			this.onNumber(key);
		} else if (!action) {
			this.onUnrecognized(this.kb);
		} else if (this.options.filter && !this.options.filter(action)) {
			this.onDone('unrecognized', action);
		} else {
			this.kb.action = action;

			if (action.keybindings instanceof Map && typeof action.behavior === 'function') {
				this.onNeedsKey(action);
			} else if (action.keybindings instanceof Map) {
				this.onKeybindingMap(action);
			} else if (typeof action.behavior === 'function') {
				this.onBehavior(action);
			} else {
				this.onDone('keybinding');
			}
		}
	}

	onNumber(key) {
		this.kb.addCountChar(key);
	}

	onUnrecognized(kb) {
		this.onDone('unrecognized', kb);
	}

	onNeedsKey(action) {
		this.status = STATUS.NEEDS_KEY;
		this.cdIntoAction(action);
	}

	onNeededKey(key) {
		const action = this.getCurrentAction();

		if (action.keybindings instanceof Map && action.keybindings.has(key)) {
			this.onKeybindingMap(action);
		} else if (typeof action.behavior === 'function') {
			this.onBehavior(action);
		}

		this.handleKey(key);
	}

	onKeybindingMap(action) {
		this.status = STATUS.WAITING;
		this.cdIntoAction(action);
	}

	onBehavior(action) {
		this.status = STATUS.WAITING;
		this.cdIntoAction(action);
		const { read, interpret, done } = this;
		action.behavior({ read, interpret, done }, this.kb);
		// TODO: check if return value is promise
	}

	read(count, cb) {
		this.status = STATUS.IS_READING;
		this.keyReader = new KeyReader(count, keys => {
			this.status = STATUS.WAITING;
			this.keyReader.destroy();
			this.keyReader = null;
			cb(keys);
		});
	}

	interpret(cb, filter) {
		this.status = STATUS.IS_INTERPRETING;

		const doneCb = (...args) => {
			this.status = STATUS.WAITING;
			this.interpreter.cdToRoot();
			this.interpreter.destroy();
			this.interpreter = null;
			cb(...args);
		};

		const { store } = this.kb;
		this.interpreter = new Interpreter(this.map, doneCb, { ...this.options, store, filter });
	}

	done(type = 'keybinding', data = this.getCurrentAction(), status = STATUS.DONE) {
		// support done('resume') or done(STATUS.WAITING)
		if (type === STATUS.WAITING || type === 'resume') {
			type = 'keybinding';
			status = STATUS.WAITING;
		}

		this.onDone(type, data, status);
	}

	// types
	// - keybinding
	// - unrecognized
	// - cancel
	onDone(type = 'keybinding', data = this.getCurrentAction(), status = STATUS.DONE) {
		this.status = status;

		if (this.status === STATUS.DONE) {
			this.doneCb(type, this.kb);
			this.reset();
		}
	}

	cdIntoAction(action) {
		if (this.getCurrentAction() === action) {
			return;
		}

		const props = ['interprets', 'keybindings'];
		const maps = props.map(p => action[p]).filter(m => m instanceof Map);

		const [replaced, added] = getMapDiff(this.map, ...maps);

		maps.forEach(map => map.forEach((val, key) => this.map.set(key, val)));

		this.cds.push({ action, replaced, added });
	}

	getCurrentAction() {
		return this.cds[this.cds.length - 1].action;
	}

	cdUp() {
		const { action, replaced, added } = this.cds.pop();

		replaced.forEach((val, key) => this.map.set(key, val));
		added.forEach((_, key) => this.map.delete(key));

		replaced.clear();
		added.clear();
	}

	cdToRoot() {
		while (this.cds.length > 1) {
			this.cdUp();
		}
	}

	destroy() {
		this.keyReader && this.keyReader.destroy();
		this.interpreter && this.interpreter.cdToRoot();
		this.interpreter && this.interpreter.destroy();

		this.map = this.store = this.doneCb = null;
		this.kb = null;
		this.keyReader = this.interpreter = null;
	}
}

export default Interpreter;
