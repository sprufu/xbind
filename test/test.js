var runner, dom;
mocha.setup("bdd");
window.onload = function(){
	runner = mocha.run();
}

function assert(expr, msg){
	if(!expr) throw new Error(msg || "failed");
}
