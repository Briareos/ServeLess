var less = require('less'),
    http = require('http'),
    fs = require('fs'),
    vm = require('vm'),
    config,
    i;

try {
    config = vm.runInThisContext(fs.readFileSync(process.cwd() + '/config.js'));
} catch (exception) {
    console.log("Failed to read config file, exiting: " + exception);
    process.exit(1);
}


var httpServer = http.createServer(function (req, res) {
    "use strict";
    var webPath, fileContent, parser;
    // If the request is not towards a less file, redirect to the same location, but using port 80. This is mandatory
    // for styles that use relative image locations.
    if (req.url.split('.').pop() !== 'less') {
        res.writeHead(303, {"Location":"http://" + req.headers.host.replace(/:\d+$/, '') + req.url});
        res.end();
        return;
    }
    try {
        // Insert some additional error checking here.
        webPath = config.sources[req.headers.host];
        fileContent = fs.readFileSync(webPath + req.url, 'utf8');
        // Insert some caching at this point
        // var fileInfo = fs.statSync(web+req.url);
        parser = new (less.Parser)({
            // Specify search paths for @import directives, this is basically a JavaScript version of PHP's dirname()
            // http://phpjs.org/functions/dirname:388
            paths:[webPath + req.url.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '')],
            // Specify a filename, for more detailed error messages.
            filename:req.url
        });
        parser.parse(fileContent, function (e, tree) {
            res.writeHead(200, {'Content-Type':'text/css'});
            res.end(tree.toCSS({ compress:false }));
        });
    } catch (e) {
        res.writeHead(404, {'Content-Type':'text/html'});
        res.end(e.message);
    }
});

for (i = 0; i < config.ports.length; i++) {
    httpServer.listen(config.ports[i]);
    console.log('ServeLess listening on port ' + config.ports[i]);
}

