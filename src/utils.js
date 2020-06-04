function promiseable(fn, [...args], cb, usePromise) {
	return usePromise ? fn(...args).then(cb) : fn(...args, cb);
}

module.exports = { promiseable };
