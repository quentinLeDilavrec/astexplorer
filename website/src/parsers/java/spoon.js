import defaultParserInterface from '../utils/defaultParserInterface';
// import pkg from 'json-to-ast/package.json';

const ID = 'spoon';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/SpoonLabs/spoon';
const PARSER_SERVICE_URL = 'http://131.254.17.96:8087/spoon';

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
      xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8087');
      xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
      xhr.setRequestHeader('Content-Type', 'text/plain');

      return new Promise(
        (resolve) => {
          xhr.onload = (e) => {
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