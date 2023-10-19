import assert from 'assert';
import { Keybinder, STATUS } from '../src/index.js';
import keybindings from './keybindings.js';

describe('Keybinder', () => {
	describe('cb types', () => {
		it('cb calls with type "keybinding"', (done) => {
			Keybinder.handleKeys(['j'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.ok(kb.action);
				assert.ok(kb.count);
				assert.ok(kb.store);
				assert.ok(kb.keys);
				done();
			});
		});

		it('cb calls with type "unrecognized"', (done) => {
			Keybinder.handleKeys(['['], keybindings, (type, kb) => {
				assert.equal(type, 'unrecognized');
				done();
			});
		});
	});

	describe('recognition', () => {
		it('one-to-one keybindings', (done) => {
			Keybinder.handleKeys(['t'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'test');
				done();
			});
		});

		it('nested keybindings', (done) => {
			Keybinder.handleKeys(['y', 'y'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'yank-line');
				done();
			});
		});

		it('reading keybindings', (done) => {
			Keybinder.handleKeys(['f', 'a'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'find');
				assert.equal(kb.store.find, 'a');
				done();
			});
		});

		it('interpreting keybindings', (done) => {
			Keybinder.handleKeys(['9', 'd', '3', '4', 'f', 'a'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.count, 9);
				assert.equal(kb.store.find, 'a');
				done();
			});
		});

		it('supplemental keybindings', (done) => {
			Keybinder.handleKeys(['"', 'a', 't'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'test');
				assert.equal(kb.store.register, 'a');
				done();
			});
		});

		it('adjacent supplemental keybindings', (done) => {
			Keybinder.handleKeys(['"', 'a', 'z', 'b', 'd', 'i', 'w'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				const { register, z, inner } = kb.store;
				assert.equal(kb.action.name, 'delete');
				assert.deepStrictEqual([register, z, inner], ['a', 'b', 'w']);
				done();
			});
		});

		it('accepts a filter argument when interpreting', (done) => {
			Keybinder.handleKeys(['d', 'q'], keybindings, (type, kb) => {
				assert.equal(type, 'cancel');
				done();
			});
		});

		it('prioritizes "keybindings" over "interprets", when both present', (done) => {
			Keybinder.handleKeys(['d', 'z'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'i-take-priority');
				done();
			});
		});

		it('accepts numbers as keybindings', (done) => {
			Keybinder.handleKeys(['0'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'cursor-to-start');
				done();
			});
		});
	});

	describe('"interprets" map', () => {
		it('is recognized', () => {
			return Promise.all([
				new Promise(resolve => {
					Keybinder.handleKeys(['i'], keybindings, (type, kb) => {
						assert.equal(type, 'keybinding');
						assert.equal(kb.action.name, 'insert');
						resolve();
					})
				}),

				new Promise(resolve => {
					Keybinder.handleKeys(['d', 'i', 'w'], keybindings, (type, kb) => {
						assert.equal(type, 'keybinding');
						assert.equal(kb.action.name, 'delete');
						assert.equal(kb.store.inner, 'w');
						resolve();
					});
				}),
			])
		});

		it('resets map correctly', (done) => {
			Keybinder.handleKeys(['d', 'i', 'w'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.store.inner, 'w');
				assert.equal(keybindings.get('i').name, 'insert');
				assert.equal(keybindings.get('z').name, 'nested-supplemental');
				assert(!keybindings.has('['));
				done();
			});
		});
	});
});
