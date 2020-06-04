
function thing(...args) {
	other(...args);
}

function other(args) {
	console.log(arguments);
}

thing(1,2,3);
