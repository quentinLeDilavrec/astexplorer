// import pkg from 'json-to-ast/package.json';
import defaultParserInterface from '../../../utils/defaultParserInterface';

const ID = 'RefactoringMiner';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/tsantalis/RefactoringMiner';
// const PARSER_SERVICE_URL = 'http://131.254.17.96:8088/RefactoringMiner';
const PARSER_SERVICE_URL = 'http://131.254.17.96:8095/diff/RefactoringMiner';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc', 'start', 'end', 'side']),
  typeProps: new Set(['type'/*, "node type"*/]),
  // _ignoredProperties: new Set(['loc', 'side']),

  // opensByDefault(_node, _key) {
  //   return _key === "actions";
  // },

  loadDiffer(callback) {

    function addSide(op) {
      op.leftSideLocations.map(x => x.side = "left")
      op.rightSideLocations.map(x => x.side = "right")
    }

    const url = PARSER_SERVICE_URL;
    callback(function refminerDiffHandler(old, neww) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);// + '?old=' + btoa(old) + '&new=' + btoa(neww));
      xhr.withCredentials = true;
      xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://131.254.17.96:8087');
      // xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://131.254.17.96:8088');
      xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
      // xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.setRequestHeader('Content-Type', "application/json");
      return new Promise(
        (resolve, reject) => {
          xhr.onload = (e) => {
            if (xhr.response === "<html><body><h2>404 Not found</h2></body></html>") {
              console.error(xhr.response)
              // reject(r)
              return
            }
            debugger
            const r = JSON.parse(xhr.response)
            if (r.error === "java.lang.NullPointerException") {
              reject(r)
            } else {
              const o0 = r.diff;
              window.reloadGraph(r.impact || {perRoot:[],roots:[],tests:[]});
              const o = o0.commits;
              o.map(x => x.refactorings.map(addSide))
              resolve(o);
            }
          }

          // window.currentTarget = window.currentTarget || {
          //   repo: "https://github.com/Graylog2/graylog2-server.git",
          //   commitIdBefore: "904f8e2a49f8ded1b16ab52e37588592e02da71c",
          //   commitIdAfter: "767171c90110c4c5781e8f6d19ece1fba0d492e9"
          //   // repo: "https://github.com/google/closure-compiler.git",
          //   // commitIdBefore: "81968c426bc06dbe26ecdde1aee90604f26b6c9e",
          //   // commitIdAfter: "5a853a60f93e09c446d458673bc7a2f6bb26742c"
          //   // repo: "https://github.com/INRIA/spoon.git",
          //   // commitIdBefore: "4b42324566bdd0da145a647d136a2f555c533978",
          //   // commitIdAfter: "904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b"
          //   // // commitIdBefore: "ad00519ae675f5ead3b4d4d77465efdb30e36915",
          //   // // commitIdAfter: "cea84c4a25b393984437f1174aceaad5925c187d"
          // }

          // xhr.send(btoa(old) + '\n' + btoa(neww));
          xhr.send(JSON.stringify(window.currentTarget));
        });
    });
  },

  async diff(differ, old, neww) {
    return await differ(old, neww)
  },

  nodeToRange(node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end];
    }
  },
};
