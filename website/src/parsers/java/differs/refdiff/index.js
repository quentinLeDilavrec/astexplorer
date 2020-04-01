// import pkg from 'json-to-ast/package.json';
import defaultDifferInterface from '../../../utils/defaultDifferInterface';
const ID = 'RefDiff';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/aserg-ufmg/RefDiff';
const PARSER_SERVICE_URL = 'http://131.254.17.96:8089/RefDiff';

export default {
  ...defaultDifferInterface,
  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc', 'start', 'end', 'side']),
  typeProps: new Set(['type', "node type"]),
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
    callback(function gumtreeDiffHandler(old, neww) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://131.254.17.96:8087');
      xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
      xhr.setRequestHeader('Content-Type', 'text/plain');
      return new Promise(
        (resolve, reject) => {
          xhr.onload = (e) => {
            const r = JSON.parse(xhr.response)
            if (r.error === "java.lang.NullPointerException") {
              reject(r)
            } else {
              const o = r;
              // o.map(addSide)
              resolve(o);
            }
          }
          xhr.send(btoa(old) + '\n' + btoa(neww));
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
