import assert from 'assert';
import { Keybinder, STATUS } from '../src/index.js';
import keybindings from './keybindings.js';

describe('Keybinder', () => {
	it('static handleKeys() is sync', done => {
		let flag = false;
		Keybinder.handleKeys(['d', 'd'], keybindings, (type, kb) => {
			assert.equal(flag, false);
			done();
		});
		flag = true;
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

	it('able to cancel in the middle of a keybinding', done => {
		let i = 0;

		const keybinder = new Keybinder(keybindings, (type, kb) => {
			if (i === 0) {
				assert.equal(type, 'cancel');
			} else {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.store.inner, 'w');
				done();
			}
			i++;
		});

		keybinder.handleKeys(['d', 'i']);
		keybinder.cancel();
		keybinder.handleKeys(['d', 'i', 'w']);
	});

	describe('Events', () => {
		it('emits "keybinding" event when key is recognized', done => {
			Keybinder.handleKeys(['t'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.ok(kb.action);
				assert.ok(kb.count);
				assert.ok(kb.store);
				assert.ok(kb.keys);
				done();
			});
		});

		it('emits "unrecognized" event when key is unkown', (done) => {
			Keybinder.handleKeys(['['], keybindings, (type, kb) => {
				assert.equal(type, 'unrecognized');
				done();
			});
		});
	});

	describe('Keybinding', () => {
		it('one-to-one keybindings', done => {
			Keybinder.handleKeys(['t'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'test');
				done();
			});
		});

		it('nested keybindings', done => {
			Keybinder.handleKeys(['y', 'y'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'yank-line');
			});

			Keybinder.handleKeys(['y', 'z', 't'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'yzt');
			});

			done();
		});
	});

	describe('instructions.read', () => {
		it('read correct number of characters', done => {
			let i = 0;
			Keybinder.handleKeys(['f', 'a', ';'], keybindings, (type, kb) => {
				if (i === 0) {
					assert.equal(type, 'keybinding');
					assert.equal(kb.action.name, 'find');
					assert.equal(kb.store.find, 'a');
				} else {
					assert.equal(type, 'unrecognized');
					done();
				}
				i++;
			});
		});

		it('keybindings take priority', done => {
			Keybinder.handleKeys(['f', 'f'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'find-keybinding-priority');
				done();
			});
		});
	});

	describe('instructions.interpret', () => {
		it('interprets next key as keybinding', done => {
			Keybinder.handleKeys(['d', 'j'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.store.motion, 'cursor-down');
				done();
			});
		});

		it('keybindings take priority', done => {
			Keybinder.handleKeys(['d', 'd'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'delete-line');
				done();
			});
		});

		it('cannot interpret itself (no endless loops)', done => {
			Keybinder.handleKeys(['w', 'w'], keybindings, (type, kb) => {
				assert.equal(type, 'cancel');
				done();
			});
		});

		it('accepts a filter argument', done => {
			Keybinder.handleKeys(['d', 'q'], keybindings, (type, kb) => {
				assert.equal(type, 'cancel');
				done();
			});
		});
	});

	describe('instructions.done', () => {
		it('calling with no arguments or \'keybinding\' emits "keybinding"', done => {
			Keybinder.handleKeys(['w', 'q'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'w');
				done();
			});
			Keybinder.handleKeys(['w', 'a'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'w');
				done();
			});
		});

		it('can be called with \'unrecognized\' or \'cancel\'', done => {
			Keybinder.handleKeys(['w', 'b'], keybindings, (type, kb) => {
				assert.equal(type, 'unrecognized');
			});
			Keybinder.handleKeys(['w', 'c'], keybindings, (type, kb) => {
				assert.equal(type, 'cancel');
			});
			done();
		});

		it('can be called with \'resume\' or 1 to continue building', done => {
			Keybinder.handleKeys(['w', 'd', 'f', 'a'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'find');
				assert.equal(kb.store.find, 'a');
				done();
			});
		});
	});

	describe('count', () => {
		it('interprets number characters', done => {
			Keybinder.handleKeys(['7', 't'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.count, 7);
				assert.equal(kb.action.name, 'test');
				done();
			});
		});

		it('map keys take priority over count', done => {
			Keybinder.handleKeys(['0'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'cursor-to-start');
				done();
			});
		});

		it('count interpretations can be controlled', done => {
			Keybinder.handleKeys(['7'], keybindings, (type, kb) => {
				assert.equal(type, 'unrecognized');
				done();
			}, { isKeyNumber: () => false });
		});

		it('is interpreted correctly at different levels', done => {
			Keybinder.handleKeys(['5', '5', 'y', '3', '4', 'd', 'j'], keybindings, (type, kb) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'yank');
				assert.equal(kb.count, 55);
				assert.equal(kb.store.yank.count, 34);
				assert.equal(kb.store.yank.action.name, 'delete');
				done();
			});
		});
	});
});
