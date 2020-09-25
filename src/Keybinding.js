module.exports = class Keybinding {
	constructor(options = {}) {
		this.keys = options.keys || [];
		this.countChars = options.countChars || [];
		this.action = options.action;
		this.store = options.store || {};
		this.count = 1;
	}

	addCountChar(char) {
		this.countChars.push(char);
		this.count = parseInt(this.countChars.join(''));
	}
}
