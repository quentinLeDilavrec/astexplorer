import CodeMirror from 'codemirror';
import 'codemirror/addon/merge/merge';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';
import SplitPane from './SplitPane';
// import CodeEditorContainer from '../container/CodeEditorContainer';
import Editor2 from './Editor2';
import DiffEditor from './DiffEditor';
import RemoteFileService from '../coevolutionService/file';

const defaultPrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: 'babylon',
};

// const REPO="https://github.com/INRIA/spoon.git",
// // COMMITIDBEFORE="4b42324566bdd0da145a647d136a2f555c533978",COMMITIDAFTER="904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b"
// COMMITIDBEFORE="ad00519ae675f5ead3b4d4d77465efdb30e36915",COMMITIDAFTER="cea84c4a25b393984437f1174aceaad5925c187d"
// // const REPO = "https://github.com/google/closure-compiler.git"
// // const COMMITIDBEFORE = "81968c426bc06dbe26ecdde1aee90604f26b6c9e"
// // const COMMITIDAFTER = "5a853a60f93e09c446d458673bc7a2f6bb26742c"
// const REPO = "https://github.com/Graylog2/graylog2-server.git",
//   COMMITIDBEFORE = "904f8e2a49f8ded1b16ab52e37588592e02da71c",
//   COMMITIDAFTER = "767171c90110c4c5781e8f6d19ece1fba0d492e9"

// repo: "https://github.com/google/closure-compiler.git",
// commitIdBefore: "81968c426bc06dbe26ecdde1aee90604f26b6c9e",
// commitIdAfter: "5a853a60f93e09c446d458673bc7a2f6bb26742c"
// repo: "https://github.com/INRIA/spoon.git",
// commitIdBefore: "4b42324566bdd0da145a647d136a2f555c533978",
// commitIdAfter: "904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b"
// // commitIdBefore: "ad00519ae675f5ead3b4d4d77465efdb30e36915",
// // commitIdAfter: "cea84c4a25b393984437f1174aceaad5925c187d"

// const REPO = "https://github.com/Graylog2/graylog2-server.git",
//   COMMITIDBEFORE = "904f8e2a49f8ded1b16ab52e37588592e02da71c",
//   COMMITIDAFTER = "767171c90110c4c5781e8f6d19ece1fba0d492e9"

// import { MonacoDiffEditor } from 'react-monaco-editor';

// export default class DiffEditor extends React.Component {

//   constructor(props) {
//     super(props);
//     this.state = {
//       value: props.value,
//     };
//   }

//   render() {
//     const code1 = "// your original code...";
//     const code2 = "// a different version...\nlet a = 2;";
//     const options = {
//       //renderSideBySide: false
//     };
//     return (
//       <MonacoDiffEditor
//         // width="100%"
//         // height="100%"
//         // language="javascript"
//         // theme="vs-dark"
//         original={code1}
//         value={code2}
//         options={options}
//       />
//     );
//   }
// }

// const diffDocuments = {
//   "aaaaa": {
//     "A.java": "class A {\nvoid f(){}\n}",
//     "B.java": "class B {}",
//     "Test.java": "class Test {\n@Test\nvoid test() {\nnew A().f();\n} }"
//   },
//   "bbbbb": {
//     "A.java": "class A {}",
//     "B.java": "class B {\nvoid f(){}\n}",
//     "Test.java": "class Test {\n@Test\nvoid test() {\nnew B().f();\n} }"
//   }
// }
// function instanciateDocs(diffDocuments, mode) {
//   const r = {}
//   for (const key in diffDocuments) {
//     if (diffDocuments.hasOwnProperty(key)) {
//       const commit = diffDocuments[key];
//       const tmp = {}
//       for (const key in commit) {
//         if (commit.hasOwnProperty(key)) {
//           const file = commit[key];
//           tmp[key] = CodeMirror.Doc(file, mode)
//         }
//       }
//       r[commit] = tmp
//     }
//   }
//   return r
// }

// function query(commit, file) {
//   return diffDocuments[commit][file]
// }

// function evo2files(evo) {
//   return {
//     "aaaaa": [
//       "A.java",
//       "B.java",
//       "Test.java"
//     ],
//     "bbbbb": [
//       "A.java",
//       "B.java",
//       "Test.java"
//     ]
//   }
// }

// const files = evo2files(this.state.value);

// for (const key in files) {
//   if (files.hasOwnProperty(key)) {
//     const commit = files[key];
//     const tmp = {}
//     for (const key in commit) {
//       if (commit.hasOwnProperty(key)) {
//         const file = commit[key];
//         tmp[key] = CodeMirror.Doc(file, mode)
//       }
//     }
//     r[commit] = tmp
//   }
// }
// data = {
//   type: "move",
//   what: "method",
//   from: { commit:"aaaaa", file: "A.java", start: 1, end: 2 },
//   to: { commit:"bbbbb", file: "B.java", start: 1, end: 2 },
//   impacts: [
//     { file: "Test.java", start: 10, end: 12 }
//   ]
// }

const ORIENTATION = {
  horizontal: "horizontal",
  vertical: "vertical",
}

const LAYOUT = {
  orientation: ORIENTATION.vertical,
  content: [
    {
      orientation: ORIENTATION.horizontal,
      content: [
        {
          before: { repo: "repo", commitId: "aaa", path: "A.java", content: "class A {\nvoid f(){}\n}" },
          after: { repo: "repo", commitId: "bbb", path: "A.java", content: "class A {}" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "B.java", content: "class B {}" },
          after: { repo: "repo", commitId: "bbb", path: "B.java", content: "class B {\nvoid f(){}\n}" },
        }
      ]
    },
    {
      orientation: ORIENTATION.horizontal,
      content: [
        {
          before: { repo: "repo", commitId: "aaa", path: "Test.java", content: "class Test {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test.java", content: "class Test {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test1.java", content: "class Test1 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test1.java", content: "class Test1 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        },
        {
          before: { repo: "repo", commitId: "aaa", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
          after: { repo: "repo", commitId: "bbb", path: "Test2.java", content: "class Test2 {\n@Test\nvoid test() {\nnew A().f();\n} }" },
        }
      ]
    }
  ]
}

/**
 * 
 * @param {any[]} positions should share the same file value
 * @param {string} repo 
 * @param {string} commitId 
 * @param {string|string[]} marking 
 */
function node2file(nodes, repo, commitId, marking) {
  if (typeof nodes.file === "string") {
    nodes = [nodes]
  }
  return {
    repo: repo, commitId: commitId, path: nodes[0].file,
    ranges: nodes.map(x => ({ start: x.start, end: x.end, marking: marking })),
  }
}

function node2diff(nodes, repo, commitIdBefore, commitIdAfter, focus, marking) {
  const r = {
    before: node2file(nodes, repo, commitIdBefore, marking),
    after: node2file(nodes, repo, commitIdAfter, marking)
  }
  if (!focus) {
    r.before.focus = true
    r.after.focus = true
  } else
    r[focus].focus = true
  return r
}

function isTest(d) {
  return d.isTest || (d.value
    && d.value.position
    && d.value.position.isTest)
}

function findimpactedTests(node, max_depth = Infinity) {
  // TODO do not rely on d3 to move in the graph
  const r = []
  const stack = [node]
  const dstack = [0]
  while (stack.length > 0) {
    const curr = stack.shift()
    const depth = dstack.shift()
    if (isTest(curr)) {
      r.push(curr)
    } else if (depth <= max_depth) {
      stack.push(...(curr.effects2.map(x => x.target)));
      dstack.push(...(curr.effects2.map(x => depth + 1)));
    }
  }
  return r
}

function findRoot(node) {
  // TODO put it in some utils file
  // TODO do not rely on d3 to move in the graph
  const r = []
  const stack = [node]
  while (stack.length > 0) {
    const curr = stack.pop()
    if (curr.isRoot) {
      r.push(curr)
    } else {
      stack.push(...(curr.causes2.map(x => x.source)));
    }
  }
  return r
}

const UNSPEC_TYPE = 'move';
const UNSPEC_WHAT = 'something';

function graphNodesToSecenario(graphNodes, repo, commitIdBefore, commitIdAfter) {
  const { node } = graphNodes
  const impactedTests = findimpactedTests(node)
  const root = findRoot(node)[0] // TODO generalize all get(0), a move is a 1 to 1 ref but an extract is apriori a n to n.
  // TODO change from and to semantic to something like removed, inserted, considered. As left side of a diff is the "from" and rigth is the "to" 
  if (root.evolution.type === "Move Method") {
  return {
    type: 'move', what: 'method',
      from: node2diff(root.evolution.before[0], repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'before', 'marked-evo-from'),
      to: node2diff(root.evolution.after[0], repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'after', 'marked-evo-to'),
      impacts:
        impactedTests.slice(0, 3).map(x => node2diff(x.value.position, repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'before', 'marked-impacted'))
    }
  } else {
    return {
      type: UNSPEC_TYPE, what: UNSPEC_WHAT,
      before: root.evolution.before.slice(0, 6).map(x =>
        node2diff(x, repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'before', 'marked-evo-from')),
      after: root.evolution.after.slice(0, 6).map(x =>
        node2diff(x, repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'after', 'marked-evo-to')),
    impacts:
        impactedTests.slice(0, 6).map(x => node2diff(x.value.position, repo, root.evolution.commitIdBefore, root.evolution.commitIdAfter, 'before', 'marked-impacted'))
    }
  }
}

function scenario2Layout(scenario) {
  if (scenario.type === 'move' && scenario.what === 'method') {
    return {
      orientation: ORIENTATION.vertical,
      content: [
        {
          orientation: ORIENTATION.horizontal,
          content: [
            scenario.from,
            scenario.to
          ]
        },
        {
          orientation: ORIENTATION.horizontal,
          content: scenario.impacts
        }
      ]
    }
  } else if (scenario.type === UNSPEC_TYPE && scenario.what === UNSPEC_WHAT) {
    return {
      orientation: ORIENTATION.vertical,
      content: [
        {
          orientation: ORIENTATION.horizontal,
          content: [
            ...scenario.before,
            ...scenario.after
          ]
        },
        {
          orientation: ORIENTATION.horizontal,
          content: scenario.impacts
        }
      ]
    }
  } else {
    return {
      orientation: ORIENTATION.vertical,
      content: [
      ]
    };
  }
}

// const SERVICE_URL = 'http://131.254.17.96:8095/data/default';
const USE_FETCH = true

const fileHandler = {
  id: 'default',
  processFile(json) {
    if (json.error) {
      throw new Error(json.error)
    } else {
      return json
    }
  }
}

async function getContent(repo, commitId, path, mode) {
  if (USE_FETCH) {
    return RemoteFileService(fileHandler, {
      repo,
      commitId,
      path,
    })
      .then(x => {
        return CodeMirror.Doc(x.content, mode)
      })
      .catch(x => {
        // console.error(x)
        return CodeMirror.Doc(x.name + ': ' + x.message)
      });
  } else {
  console.log(4982, arguments)
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", SERVICE_URL);
  xhr.withCredentials = true;
    // xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://131.254.17.96:8087');
    xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://176.180.199.146:50001');
    // xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
  // xhr.setRequestHeader('Content-Type', 'text/plain');
  // xhr.setRequestHeader('Content-Type', "application/json; charset=utf-8");
  xhr.setRequestHeader('Content-Type', "application/json");
    xhr.onprogress = (() => console.log("data handling in progress"))
    xhr.onloadstart = (() => console.log("data handling load started"))
  return new Promise(
    (resolve, reject) => {
      xhr.onload = (e) => {
        if (xhr.responseText === "<html><body><h2>404 Not found</h2></body></html>") {
          // reject(xhr.response)
          console.error(xhr.response)
          return
        }
        const r = JSON.parse(xhr.response)
        if (r.error) {
          reject(r.error)
        } else {
          resolve(r);
        }
      }
      xhr.onerror = (e) => {
        reject("error: can't get content from server")
      }
      // xhr.send(btoa(before) + '\n' + btoa(after));
      // xhr.send(JSON.stringify({before:btoa(before), after:btoa(after)}));
      xhr.send(JSON.stringify({
        repo: repo,
        commitId: commitId,
        path: path
      }));
    })
    .then(x => {
      return CodeMirror.Doc(x.content, mode)
    })
    .catch(x => {
      console.error(x)
      return CodeMirror.Doc(x)
    });
}
}

function resize() {
  PubSub.publish('PANEL_RESIZE');
}


export default class MultiEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      mode: props.mode,
    };
    this._layoutRenderer = this._layoutRenderer.bind(this);
    // this.handleScenarioChange = this.handleScenarioChange.bind(this);
  }

  _layoutRenderer(x, key) {
    console.log(3, this)
    if (x.orientation === ORIENTATION.vertical) {
      return (
        <SplitPane
          key={key}
          className="splitpane"
          onResize={resize}>
          {x.content.map((x, i) => this._layoutRenderer(x, i))}
        </SplitPane>
      );
    } else if (x.orientation === ORIENTATION.horizontal) {
      if (x.content.length <= 2) {
        return (<SplitPane
          key={key}
          className="splitpane"
          vertical={true}
          onResize={resize}>
          {x.content.map((x, i) => this._layoutRenderer(x, i))}
        </SplitPane>);
      } else {
        return (<SplitPane
          key={key}
          className="splitpane"
          vertical={true}
          onResize={resize}>
          {this._layoutRenderer({
            orientation: x.orientation,
            content: x.content.slice(0, x.content.length / 2)
          })}
          {this._layoutRenderer({
            orientation: x.orientation,
            content: x.content.slice(x.content.length / 2)
          })}
        </SplitPane>);
      }
    } else if (typeof x.before === 'object' && typeof x.after === 'object') {
      // TODO enable wrapping in codemirrors
      return (<DiffEditor
        key={key}
        // {...this.props}
        value={"Getting content..."}
        oldvalue={"Getting content..."}
        // value={x.after.content}
        // oldvalue={x.before.content}
        ref={async (y) => {
          if (y) {
            // TODO get back old doc and memoize them (with React? )
            y.setMirrorsValue({
              before: { ...x.before, doc: await getContent(x.before.repo, x.before.commitId, x.before.path, this.props.mode) },
              after: { ...x.after, doc: await getContent(x.after.repo, x.after.commitId, x.after.path, this.props.mode) }
            })
          }
          return y
        }}
        mode={this.props.mode} />)
    } else if (typeof x.path === 'string') {
      return (<Editor2
        key={key}
        value={"Getting content..."}
        ref={async (y) => {
          if (y) {
            const content = await getContent(x.repo, x.commitId, x.path, this.props.mode)
            y.setMirrorValue({
              ...x,
              doc: content,
            })
          }
          return y
        }}
        mode={this.props.mode} />)
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value ||
      nextProps.oldvalue !== this.state.oldvalue) {
      this.setState(
        {
          value: nextProps.value,
          oldvalue: nextProps.oldvalue,
        },
        () => {
          // this.codeMirror.edit.setValue(nextProps.value); // TODO usefull?

        },
      );
    }
    if (nextProps.mode !== this.props.mode) {
      this.codeMirror.setOption('mode', nextProps.mode);
    }

    if (nextProps.keyMap !== this.props.keyMap) {
      this.codeMirror.setOption('keyMap', nextProps.keyMap);
    }

    this._setError(nextProps.error);
  }


  // shouldComponentUpdate() {
  //   return false;
  // }

  getValue() {
    return this.codeMirror && (this.state.value = this.codeMirror.getValue());
  }

  getOldValue() {
    return this.codeMirror && (this.state.oldvalue = this.codeMirror.edit.state.diffViews[0].orig.getValue());
  }

  _getErrorLine(error) {
    return error.loc ? error.loc.line : (error.lineNumber || error.line);
  }

  _setError(error) {
    if (this.codeMirror) {
      let oldError = this.props.error;
      if (oldError) {
        let lineNumber = this._getErrorLine(oldError);
        if (lineNumber) {
          this.codeMirror.removeLineClass(lineNumber - 1, 'text', 'errorMarker');
        }
      }

      if (error) {
        let lineNumber = this._getErrorLine(error);
        if (lineNumber) {
          this.codeMirror.edit.addLineClass(lineNumber - 1, 'text', 'errorMarker');
        }
      }
    }
  }

  _posFromIndex(doc, index) {
    return (this.props.posFromIndex ? this.props : doc).posFromIndex(index);
  }

  componentDidMount() {

    this._CMHandlers = [];
    this._subscriptions = [];
    this._layout = {}

    // const tmp = 
    // ReactDOM.render(tmp, this.container)

    this._bindCMHandler('blur', instance => {
      if (!this.props.enableFormatting) return;

      require(['prettier/standalone', 'prettier/parser-babylon'], (prettier, babylon) => {
        const currValue = instance.doc.getValue();
        const options = Object.assign({},
          defaultPrettierOptions,
          {
            printWidth: instance.display.maxLineLength,
            plugins: [babylon],
          });
        instance.doc.setValue(prettier.format(currValue, options));
      });
    });

    this._bindCMHandler('changes', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onContentChangeRight.bind(this), 200);
    }, "right");
    this._bindCMHandler('changes', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onContentChangeLeft.bind(this), 200);
    }, "left");
    this._bindCMHandler('cursorActivity', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onActivityRight.bind(this, true), 100);
    }, "right");
    this._bindCMHandler('cursorActivity', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onActivityLeft.bind(this, true), 100);
    }, "left");
    this._subscriptions.push(
      PubSub.subscribe('PANEL_RESIZE', () => {
        // TODO dispatch to childs
      }),
      PubSub.subscribe('CHANGE_DIFF_CONTEXT', (_, graphNodes) => {
        const { node, root } = graphNodes
        console.log(684, node, root)
        const x = graphNodesToSecenario(graphNodes,
          this.state.value.instance.repo,
          this.state.value.instance.commitIdBefore,
          this.state.value.instance.commitIdAfter)

        this.setState({
          ...this.state,
          value: x,
        })
      }),
    );

    if (this.props.highlight) {
      this._markerRange = null;
      this._mark = null;
      this._subscriptions.push(
        PubSub.subscribe('HIGHLIGHT', (_, { node, range }) => {
          if (!range) {
            return;
          }
          // TODO dispatch to childs

          // console.log(1243, this.codeMirror, this.codeMirror.edit.state.diffViews[0].orig)
          // let docRight = this.codeMirror.edit.getDoc();
          // let docLeft = this.codeMirror.edit.state.diffViews[0].orig.getDoc();
          // this._markerRange = range;
          // // We only want one mark at a time.
          // if (this._mark) {
          //   this._mark.clear();
          // }
          // if (this._mark_orig) {
          //   this._mark_orig.clear();
          // }
          // let [startRight, endRight] = range.map(index => this._posFromIndex(docRight, index));
          // let [startLeft, endLeft] = range.map(index => this._posFromIndex(docLeft, index));
          // if (!startRight || !endRight) {
          //   this._markerRange = this._mark = null;
          //   return;
          // }
          // if (node.side === "right") {
          //   this._mark = this.codeMirror.edit.markText(
          //     startRight,
          //     endRight,
          //     { className: 'marked' },
          //   );
          // }
          // if (node.side === "left") {
          //   this._mark_orig = this.codeMirror.edit.state.diffViews[0].orig.markText(
          //     startLeft,
          //     endLeft,
          //     { className: 'marked' },
          //   );
          // }
        }),

        PubSub.subscribe('CLEAR_HIGHLIGHT', (_, { range } = {}) => {
          if (!range ||
            this._markerRange &&
            range[0] === this._markerRange[0] &&
            range[1] === this._markerRange[1]
          ) {
            this._markerRange = null;
            if (this._mark) {
              this._mark.clear();
              this._mark = null;
            }
            if (this._mark_orig) {
              this._mark_orig.clear();
              this._mark_orig = null;
            }
          }
        }),
      );
    }

    if (this.props.error) {
      this._setError(this.props.error);
    }
  }

  componentWillUnmount() {
    clearTimeout(this._updateTimer);
    this._unbindHandlers();
    this._markerRange = null;
    this._mark = null;
  }

  // componentDidUpdate() {
  //   console.log(235743, arguments)
  //   debugger
  // }


  _bindCMHandler(event, handler, side) {
    this._CMHandlers.push([event, handler, side ? side : ""]);
    // TODO dispatch to childs
    // if (side === "right") {
    //   this.codeMirror.edit.on(event, handler);
    // } else if (side === "left") {
    //   this.codeMirror.edit.state.diffViews[0].orig.on(event, handler);
    // } else {
    //   this.codeMirror.edit.on(event, handler);
    //   this.codeMirror.edit.state.diffViews[0].orig.on(event, handler);
    // }
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    // TODO dispatch to childs
    // for (let i = 0; i < cmHandlers.length; i += 1) {
    //   if (cmHandlers[i][2] === "right") {
    //     this.codeMirror.edit.off(cmHandlers[i][0], cmHandlers[i][1]);
    //   } else if (cmHandlers[i][2] === "left") {
    //     this.codeMirror.edit.state.diffViews[0].orig.off(cmHandlers[i][0], cmHandlers[i][1]);
    //   } else {
    //     this.codeMirror.edit.off(cmHandlers[i][0], cmHandlers[i][1]);
    //     this.codeMirror.edit.state.diffViews[0].orig.off(cmHandlers[i][0], cmHandlers[i][1]);
    //   }
    // }
    this._subscriptions.forEach(PubSub.unsubscribe);
  }

  _onContentChangeRight() {
    // TODO dispatch to childs
    // const docRight = this.codeMirror.edit.getDoc();
    // const args = {
    //   value: docRight.getValue(),
    //   cursor: docRight.indexFromPos(docRight.getCursor()),
    //   side: "right",
    // };
    // this.setState(
    //   {
    //     value: args.value,
    //   },
    //   () => {
    //     this.props.onContentChange(args)
    //   },
    // );
  }

  _onContentChangeLeft() {
    // TODO dispatch to childs
    // const docLeft = this.codeMirror.edit.state.diffViews[0].orig.getDoc();
    // const args = {
    //   oldvalue: docLeft.getValue(),
    //   cursor: docLeft.indexFromPos(docLeft.getCursor()),
    //   side: "right",
    // };
    // this.setState(
    //   {
    //     oldvalue: args.oldvalue,
    //   },
    //   () => {
    //     this.props.onContentChange(args)
    //   },
    // );
  }

  _onActivityRight() {
    // TODO dispatch to childs
    // this.props.onActivity(
    //   this.codeMirror.edit
    //     .getDoc().indexFromPos(this.codeMirror.edit.getCursor()),
    //   "right",
    // );
  }
  _onActivityLeft() {
    // TODO dispatch to childs
    // this.props.onActivity(
    //   this.codeMirror.edit.state.diffViews[0].orig
    //     .getDoc().indexFromPos(this.codeMirror.edit.getCursor()),
    //   "left",
    // );
  }

  render() {
    return this._layoutRenderer(scenario2Layout(this.state.value));
  }
}

MultiEditor.propTypes = {
  value: PropTypes.object,
  highlight: PropTypes.bool,
  lineNumbers: PropTypes.bool,
  readOnly: PropTypes.bool,
  onContentChange: PropTypes.func,
  onActivity: PropTypes.func,
  posFromIndex: PropTypes.func,
  error: PropTypes.object,
  mode: PropTypes.string,
  enableFormatting: PropTypes.bool,
  keyMap: PropTypes.string,
};

MultiEditor.defaultProps = {
  value: {},
  highlight: true,
  lineNumbers: true,
  readOnly: false,
  mode: 'javascript',
  keyMap: 'default',
  onContentChange: (x) => { },
  onActivity: () => { },
};




// function toggleDifferences() {
//   dv.setShowDifferences(highlight = !highlight);
// }

// window.onload = function() {
//   value = document.documentElement.innerHTML;
//   orig1 = "<!doctype html>\n\n" + value.replace(/\.\.\//g, "codemirror/").replace("yellow", "orange");
//   orig2 = value.replace(/\u003cscript/g, "\u003cscript type=text/javascript ")
//     .replace("white", "purple;\n      font: comic sans;\n      text-decoration: underline;\n      height: 15em");
//   initUI();
//   let d = document.createElement("div"); d.style.cssText = "width: 50px; margin: 7px; height: 14px"; dv.edit.addLineWidget(57, d)
// };

// function mergeViewHeight(mergeView) {
//   function editorHeight(editor) {
//     if (!editor) return 0;
//     return editor.getScrollInfo().height;
//   }
//   return Math.max(editorHeight(mergeView.leftOriginal()),
//                   editorHeight(mergeView.edit),
//                   editorHeight(mergeView.rightOriginal()));
// }

// function resize(mergeView) {
//   var height = mergeViewHeight(mergeView);
//   for(;;) {
//     if (mergeView.leftOriginal())
//       mergeView.leftOriginal().setSize(null, height);
//     mergeView.edit.setSize(null, height);
//     if (mergeView.rightOriginal())
//       mergeView.rightOriginal().setSize(null, height);

//     var newHeight = mergeViewHeight(mergeView);
//     if (newHeight >= height) break;
//     else height = newHeight;
//   }
//   mergeView.wrap.style.height = height + "px";
// }