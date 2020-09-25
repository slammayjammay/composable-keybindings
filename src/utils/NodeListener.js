const { emitKeypressEvents } = require('readline');
const formatCharKey = require('./format-char-key');

const DEFAULTS = {
	escapeCodeTimeout: 50,
	autoFormat: false,
	onSigStop: null
};

module.exports = class NodeListener {
	constructor(cb, options) {
		this.cb = cb;
		this.options = { ...DEFAULTS, ...options };

		this.listener = this.listener.bind(this);

		this.start();

		// ensure raw mode is set correctly on SIGCONT
		process.on('SIGCONT', () => {
			if (process.stdin.isRaw) {
				process.stdin.setRawMode(false);
				process.stdin.setRawMode(true);
			}
		});
	}

	start() {
		emitKeypressEvents(process.stdin, {
			escapeCodeTimeout: this.options.escapeCodeTimeout
		});
		!process.stdin.isRaw && process.stdin.setRawMode(true);
		process.stdin.isPaused() && process.stdin.resume();
		this.addListener();
	}

	end() {
		this.removeListener();
		process.stdin.isRaw && process.stdin.setRawMode(false);
		!process.stdin.isPaused() && process.stdin.pause();
	}

	addListener() {
		process.stdin.addListener('keypress', this.listener);
	}

	removeListener() {
		process.stdin.removeListener('keypress', this.listener);
	}

	listener(char, key) {
		if (key.sequence === '\u0003') {
			process.kill(process.pid, 'SIGINT'); // ctrl+c
		} else if (key.sequence === '\u001a') {
			this.options.onSigStop && this.options.onSigStop(char, key);
			process.kill(process.pid, 'SIGSTOP'); // ctrl+z
		} else {
			if (this.options.autoFormat) {
				key.formatted = formatCharKey.toString(char, key);
			}
			this.cb(char, key);
		}
	}

	destroy() {
		this.cb = this.options = null;
	}
};
