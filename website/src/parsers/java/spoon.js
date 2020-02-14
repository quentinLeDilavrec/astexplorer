import defaultParserInterface from '../utils/defaultParserInterface';
// import pkg from 'json-to-ast/package.json';

const ID = 'spoon';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/SpoonLabs/spoon';
const PARSER_SERVICE_URL = 'http://localhost:8087/spoon';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc']),

  loadParser(callback) {
    const url = PARSER_SERVICE_URL;
    callback(function spoonParsingHandler(code) {
      const Http = new XMLHttpRequest();
      Http.open("GET", url+'?code='+btoa(code));
      Http.send();

      return new Promise(
        (resolve) => {
          Http.onloadend = (e) => {
            console.log(JSON.parse(Http.response));
            resolve(JSON.parse(Http.response));
          }
        });
    });
  },

  async parse(spoon, code) {
    return await spoon(code);
  },

  nodeToRange({ loc }) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },
}