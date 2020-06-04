const { promiseable } = require('./utils');

class KeyReader {
	constructor() {
		this.reset();
	}

	reset() {
		this.count = this.doneCb = null;
		this.keys = [];
	}

	read(count, doneCb) {
		this.count = count;

		const usePromise = typeof doneCb !== 'function';

		if (usePromise) {
			return new Promise(resolve => this.doneCb = resolve);
		} else {
			this.doneCb = doneCb;
		}
	}

	handleKey(key) {
		this.keys.push(key);

		if (this.keys.length === this.count) {
			this.doneCb(this.keys);
			this.reset();
		}
	}

	destroy() {
		this.count = this.doneCb = this.keys = null;
	}
}

module.exports = KeyReader;
