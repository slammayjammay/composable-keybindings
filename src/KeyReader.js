class KeyReader {
	constructor(count, doneCb) {
		this.count = count;
		this.doneCb = doneCb;
		this.keys = [];
	}

	reset(count = this.count) {
		this.count = count;
		this.keys = [];
	}

	handleKey(key) {
		this.keys.push(key);

		if (this.keys.length === this.count) {
			this.doneCb(this.keys);
		}
	}

	destroy() {
		this.count = this.doneCb = this.keys = null;
	}
}

export default KeyReader;
