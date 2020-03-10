class KeyReader {
	constructor() {
		this.reset();
	}

	reset() {
		this._resolve = this._count = null;
		this._keys = [];
	}

	begin(count = 1) {
		return new Promise(resolve => {
			this._count = 1;
			this._resolve = resolve;
		});
	}

	handleKey(key) {
		this._keys.push(key);

		if (this._keys.length === this._count) {
			this._resolve(this._keys);
			this.reset();
		}
	}

	destroy() {
		this._resolve = this._count = this._count = null;
	}
}

module.exports = KeyReader;
