// import pkg from 'json-to-ast/package.json';
import defaultParserInterface from '../../../utils/defaultParserInterface';
const ID = 'gumtree';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/SpoonLabs/gumtree';
const PARSER_SERVICE_URL = 'http://131.254.17.96:8095/diff/gumtree';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc', 'start', 'end', 'side']),
  typeProps: new Set(['type'/*, "node type"*/]),
  // _ignoredProperties: new Set(['_side']),

  // opensByDefault(_node, _key) {
  //   return _key==="actions";
  // },

  loadDiffer(callback) {

    function apply2AST(side) {
      return function a2a(n) {
        n.side = side;
        for (const child of n.children) {
          a2a(child);
        }
      }
    }

    function addSide(op) {
      if (typeof op.from === "object") {
        op.from.side = 'left';
        op.from.valueAST && apply2AST('left')(op.from.valueAST);
      }
      if (typeof op.to === "object") {
        op.to.side = "right";
        op.to.valueAST && apply2AST('right')(op.to.valueAST);
      }
      if (typeof op.into === "object") {
        op.into.side = "right";
        op.into.valueAST && apply2AST('right')(op.into.valueAST);
      }
      if (typeof op.at === "object") {
        if (op.type === "Delete") {
          op.at.side = "left";
          op.at.valueAST && apply2AST('left')(op.at.valueAST);
        } else if (op.type === "Insert") {
          op.at.side = "right";
          op.at.valueAST && apply2AST('right')(op.at.valueAST);
        }
      }
    }

    const url = PARSER_SERVICE_URL;
    callback(function gumtreeDiffHandler(before, after) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);// + '?old=' + btoa(old) + '&new=' + btoa(neww));
      xhr.withCredentials = true;
      // res.header("Content-Type", "application/json");
      xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://131.254.17.96:8087');
      xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
      // xhr.setRequestHeader('Content-Type', 'text/plain');
      // xhr.setRequestHeader('Content-Type', "application/json; charset=utf-8");
      xhr.setRequestHeader('Content-Type', "application/json");
      return new Promise(
        (resolve, reject) => {
          xhr.onload = (e) => {
            if (xhr.response === "<html><body><h2>404 Not found</h2></body></html>") {
              console.error(xhr.response)
              // reject(r)
              return
            }
            const r = JSON.parse(xhr.response)
            if (r.error) {
              reject(r)
            } else {
              const o0 = r.diff;
              window.reloadGraph(r.impact || {perRoot:[],roots:[],tests:[]});
              const o = o0.actions;
              o.map(addSide)
              resolve(o);
            }
          }
          // xhr.send(btoa(before) + '\n' + btoa(after));
          // xhr.send(JSON.stringify({before:btoa(before), after:btoa(after)}));
          xhr.send(JSON.stringify(window.currentTarget));
        });
    });
  },

  async diff(differ, old, neww) {
    return await differ(old, neww)
  },

  nodeToRange(node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end + 1];
    }
  },
};
