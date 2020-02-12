const http = require('http');
const url = require('url');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const java = require('node-java');

let server = http.createServer(function (request, response) {
    if (request.method == "GET") {
        const parsedurl = url.parse(request.url, true)
        const queryData = parsedurl.query;
        const path = parsedurl.pathname
        response.writeHead(200, {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': 'http://127.0.0.1:8080',
            'Access-Control-Allow-Credentials': 'true'
        });

        if (path !== "/") {
        } else if (queryData.code) {
            if (typeof queryData.code === 'string') {
                const parsed = new Buffer.from(queryData.code, 'base64').toString();

                var spawn = require('child_process').spawn;
                var child = spawn('java', ['-jar',
                    '/home/quentin/Documents/gumtree-spoon-ast-diff/target/gumtree-spoon-ast-diff-SNAPSHOT-jar-with-dependencies.jar',
                    '/home/quentin/Documents/gumtree-spoon-ast-diff/src/main/java/gumtree/spoon/AstComparator.java',
                    '/home/quentin/Documents/gumtree-spoon-ast-diff/src/main/java/gumtree/spoon/builder/CtWrapper.java'
                ]);
                let result = '';
                child.stdout.on('data', function (data) {
                    result += data.toString();
                });
                child.stdout.on('close', function (code) {
                    response.end(result)
                });
            }
        } else {
        }
    }
});

server.listen(8087);