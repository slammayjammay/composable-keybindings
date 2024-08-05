import Keybinding from './Keybinding.js';
import KeyReader from './KeyReader.js';
import STATUS from './status.js';
import getMapDiff from './utils/get-map-diff.js';

const DEFAULTS = {
	getKeybinding: (key, map) => map.get(key),
	isKeyNumber: key => /\d/.test(key),
	isKeyEscape: key => key === 'escape',
	store: null, // {}
	filter: null // function
};

export default class Interpreter {
	constructor(map, listener = (() => {}), options = {}) {
		this.map = map;
		this.listener = listener;
		this.options = { ...DEFAULTS, ...options };

		this.cds = [{ action: null }];
		this.keyReader = this.interpreter = null;

		this.status = STATUS.WAITING;
		this.kb = new Keybinding({ store: this.options.store || {} });
	}

	reset = () => {
		this.cdToRoot();
		this.status = STATUS.WAITING;
		this.kb = new Keybinding({ store: this.options.store || {} });
	}

	cancel = () => {
		this.onDone({ type: 'cancel' });
	}

	handleKeys = (keys) => {
		keys.forEach(key => this.handleKey(key));
	}

	handleKey = (key) => {
		if (this.options.isKeyEscape(key)) {
			return this.onDone({ type: 'cancel' });
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

	onWaiting = (key) => {
		const action = this.options.getKeybinding(key, this.map);

		if (this.options.isKeyNumber(key) && !(this.kb.countChars.length === 0 && action)) {
			this.onNumber(key);
		} else if (!action) {
			this.onUnrecognized(this.kb);
		} else if (this.options.filter && !this.options.filter(action)) {
			this.onDone({ type: 'cancel' });
		} else {
			this.kb.action = action;

			if (action.keybindings instanceof Map && typeof action.behavior === 'function') {
				this.onNeedsKey(key);
			} else if (action.keybindings instanceof Map) {
				this.onKeybindingMap(key);
			} else if (typeof action.behavior === 'function') {
				this.cdInto(key);
				this.onBehavior();
			} else {
				this.onDone({ type: 'keybinding' });
			}
		}
	}

	onNumber = (key) => {
		this.kb.addCountChar(key);
	}

	onUnrecognized = (kb) => {
		this.onDone({ type: 'unrecognized' });
	}

	onNeedsKey = (key) => {
		this.status = STATUS.NEEDS_KEY;
		this.cdInto(key);
	}

	onNeededKey = (key) => {
		const action = this.getCurrentAction();

		if (action.keybindings instanceof Map && action.keybindings.has(key)) {
			this.status = STATUS.WAITING;
		} else if (typeof action.behavior === 'function') {
			this.onBehavior();
		}

		this.handleKey(key);
	}

	onKeybindingMap = (key) => {
		this.status = STATUS.WAITING;
		this.cdInto(key);
	}

	onBehavior = (action = this.getCurrentAction()) => {
		this.status = STATUS.WAITING;
		const { read, interpret, emit, done } = this;
		action.behavior({ read, interpret, emit, done }, this.kb);
	}

	read = (count, cb) => {
		this.status = STATUS.IS_READING;
		this.keyReader = new KeyReader(count, keys => {
			this.status = STATUS.WAITING;
			this.keyReader = this.keyReader.destroy();
			cb(keys);
		});
	}

	interpret = (cb, filter) => {
		this.status = STATUS.IS_INTERPRETING;
		const { store } = this.kb;
		this.interpreter = new Interpreter(this.map, cb, { ...this.options, store, filter });
	}

	emit = (...args) => {
		this.listener(...args);
	}

	// accepts an object:
	//   - type: type of event or a flag (see below)
	//   - status: status of current keybinding
	// if a string is given it represents the type.
	// `type` can be an event type (see `onDone`) or one of these flags:
	//   - resume: supports supplemental keybindings. if given, sets
	//     type=keybinding and status=WAITING
	done = (options) => {
		this.keyReader = this.keyReader?.destroy();
		this.interpreter = this.interpreter?.destroy();

		const defaults = { type: 'keybinding', status: STATUS.DONE };
		options ??= defaults;

		if (typeof options === 'string') {
			options = { ...defaults, type: options };
		}

		let { type, status } = options;

		if (typeof type === 'string') {
			status = {
				resume: STATUS.WAITING
			}[type] || status;

			type = {
				resume: 'keybinding'
			}[status] || type;
		}

		this.onDone({ type, status });
	}

	onDone = ({ type = 'keybinding', status = STATUS.DONE }) => {
		this.status = status;

		if (this.status === STATUS.DONE) {
			const kb = this.kb;
			this.reset();
			this.listener(type, kb);
		}
	}

	cdInto = (key) => {
		const action = this.options.getKeybinding(key, this.map);

		if (this.getCurrentAction() === action) {
			return;
		}

		const props = ['interprets', 'keybindings'];
		const maps = props.map(p => action[p]).filter(m => m instanceof Map);

		const [replaced, added] = getMapDiff(this.map, ...maps);

		const removed = new Map([[key, action]]);
		this.map.delete(key);
		maps.forEach(map => map.forEach((val, key) => this.map.set(key, val)));

		this.cds.push({ action, replaced, added, removed });
	}

	getCurrentAction = () => {
		return this.cds[this.cds.length - 1].action;
	}

	cdUp = () => {
		const { action, replaced, added, removed } = this.cds.pop();

		replaced.forEach((val, key) => this.map.set(key, val));
		added.forEach((_, key) => this.map.delete(key));
		removed.forEach((val, key) => this.map.set(key, val));

		replaced.clear();
		added.clear();
	}

	cdToRoot = () => {
		while (this.cds.length > 1) {
			this.cdUp();
		}
	}

	destroy = () => {
		this.keyReader && this.keyReader.destroy();
		this.interpreter && this.interpreter.destroy();

		this.map = this.store = this.listener = null;
		this.kb = null;
		this.keyReader = this.interpreter = null;
	}
}
