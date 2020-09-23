module.exports = {
	mode: process.env.NODE_ENV || 'development',
	entry: `${__dirname}/index.js`,
	output: {
		path: `${__dirname}/built`,
		filename: 'index.js'
	}
};
