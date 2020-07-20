import defaultParserInterface from '../utils/defaultParserInterface';
// import pkg from 'json-to-ast/package.json';

const ID = 'spoon';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/SpoonLabs/spoon';
// const PARSER_SERVICE_URL = 'http://131.254.17.96:8087/spoon';
// const PARSER_SERVICE_URL = 'http://131.254.17.96:8095/ast/spoon';
// const PARSER_SERVICE_URL = 'http://127.0.0.1:8095/ast/spoon';
// const PARSER_SERVICE_URL = 'http://176.180.199.146:50001/api/v1/ast/spoon';
const PARSER_SERVICE_URL = 'http://127.0.0.1:8095/api/v1/ast/spoon';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc', 'start', 'end']),

  loadParser(callback) {
    const url = PARSER_SERVICE_URL;
    callback(function spoonParsingHandler(code) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://176.180.199.146:50001');
      xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
      xhr.setRequestHeader('Content-Type', 'text/plain');

      xhr.onprogress=(()=>console.log("spoon parsing in progress"))
      xhr.onloadstart=(()=>console.log("spoon parsing load started"))

      return new Promise(
        (resolve,reject) => {
          xhr.onload = (e) => {
            if(xhr.responseText==="<html><body><h2>404 Not found</h2></body></html>"){
              // reject(xhr.response)
              console.error(xhr.response)
              return
            }
            if (xhr.response) {
              resolve(JSON.parse(xhr.response));
            }
          }
          xhr.send(btoa(code));
        });
    });
  },

  async parse(spoon, code) {
    return await spoon(code);
  },

  nodeToRange(node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end + 1];
    }
  },
}