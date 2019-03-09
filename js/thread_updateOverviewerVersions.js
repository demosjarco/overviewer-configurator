const {parentPort} = require('worker_threads');

request('https://overviewer.org/build/json/builders/win64/builds/_all', function(error, response, body) {
    if (error) throw error;
    if (response.statusCode != 200) {
        process.exit();
    } else {
        console.log(JSON.parse(body));
    }
});