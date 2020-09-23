module.exports = class Keybinding {
	constructor(options = {}) {
		this.keys = options.keys || [];
		this.countChars = options.countChars || [];
		this.action = options.action;
		this.store = options.store || {};
	}

	get count() {
		return this.countChars.length === 0 ? 1 : parseInt(this.countChars.join(''));
	}
}
