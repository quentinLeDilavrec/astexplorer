// import pkg from 'json-to-ast/package.json';
import defaultParserInterface from '../../../utils/defaultParserInterface';

const ID = 'other';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/SpoonLabs/gumtree';
const PARSER_SERVICE_URL = 'http://localhost:8087/gumtree';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,

  // defaultParserID: 'spoon',

  loadDiffer(callback) {
    const url = PARSER_SERVICE_URL;
    callback(function gumtreeDiffHandler(old,neww) {
      const Http = new XMLHttpRequest();
      Http.open("GET", url+'?old='+btoa(old)+'&new='+btoa(neww));
      Http.send();

      return new Promise(
        (resolve) => {
          Http.onloadend = (e) => {
            // console.log(old,neww);
            // console.log(Http.response);
            console.log(JSON.parse(Http.response));
            resolve(JSON.parse(Http.response));
          }
        });
    });
  },

  async diff(differ, old, neww) {
    return await differ(old,neww)
  }
};
