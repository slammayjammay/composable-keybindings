const assert = require('assert');
const Keybinder = require('../src');
const seeds = require('./seeds');

const keybinder = new Keybinder();
keybinder.setKeybindings(seeds);

describe('Keybinder', () => {
	describe('events', () => {
		it('fires events with a keybinding object', async () => {
			keybinder.handleKeys(['j']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.ok(kb.action);
			assert.ok(kb.count);
			assert.ok(kb.store);
			assert.ok(kb.keysEntered);
		});

		it.skip('does not fire when a key is not recognized', async () => {
			const thing = keybinder.handleKeys(['[']);

			keybinder.handleKeys(['[']).then(() => {
				throw new Error();
			});

			// const kb = await new Promise(r => keybinder.once('keybinding', r));

			return new Promise((res, rej) => {
				throw new Error();
			});
		});
	});

	describe('recognition', () => {
		it('one-to-one keybindings', () => {
			keybinder.handleKeys(['t']);
			return new Promise(r => keybinder.once('keybinding', r)).then((kb) => {
				assert.equal(kb.action.name, 'test');
			});
		});

		it('nested keybindings', async () => {
			keybinder.handleKeys(['y', 'y']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'yank-line');
		});

		it('reading keybindings', async () => {
			keybinder.handleKeys(['f', 'a']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'find');
			assert.equal(kb.store.find, 'a');
		});

		it('interpreting keybindings', async () => {
			keybinder.handleKeys(['9', 'd', '3', '4', 'f', 'a']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'delete');
			assert.equal(kb.count, 9);
			assert.equal(kb.store.find, 'a');
		});

		it('supplemental keybindings', async () => {
			keybinder.handleKeys(['"', 'a', 't']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'test');
			assert.equal(kb.store.register, 'a');
		});

		it('adjacent supplemental keybindings', async () => {
			keybinder.handleKeys(['"', 'a', 'z', 'b', 'd', 'i', 'w']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			const { register, z, inner } = kb.store;
			assert.equal(kb.action.name, 'delete');
			assert.deepStrictEqual([register, z, inner], ['a', 'b', 'w']);
		});

		it('prioritizes "keybindings" over "interprets", when both present', async () => {
			keybinder.handleKeys(['d', 'z']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'i-take-priority');
		});

		it('accepts a filter argument when interpreting', async () => {
			keybinder.handleKeys(['d', 'y']);
			const kb = await new Promise(r => keybinder.once('keybinding-cancel', r));
			assert.equal(kb.action.name, 'delete');
		});
	});

	describe('"interprets" map', () => {
		it('is recognized', async () => {
			let kb;

			keybinder.handleKeys(['i']);
			kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'insert');

			keybinder.handleKeys(['d', 'i', 'w']);
			kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(kb.action.name, 'delete');
			assert.equal(kb.store.inner, 'w');
		});

		it('resets map correctly', async () => {
			keybinder.handleKeys(['d', 'i', 'w']);
			const kb = await new Promise(r => keybinder.once('keybinding', r));
			assert.equal(keybinder.map.get('i').name, 'insert');
			assert.equal(keybinder.map.get('z').name, 'nested-supplemental');
			assert(!keybinder.map.has('['));
		});
	});
});
