if (options.scanOnReady) {
    exports.ready(scan);
}

if (window.define && window.define.cmd) {
    window.define(function() {
        return exports;
    });
} else {
    window.xbind = exports;
}
// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
