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
import { PT } from '../containers/MultiCodeContainer';

const ORIENTATION = {
  horizontal: "horizontal",
  vertical: "vertical",
}


function node2file(nodes: any[] | any, repo: string, commitId: string, marking: string | string[]) {
  if (typeof nodes.file === "string") {
    nodes = [nodes]
  }
  if (typeof nodes.filePath === "string") {
    nodes = [nodes]
  }
  return {
    repo: repo, commitId: commitId, path: nodes[0].file || nodes[0].filePath,
    ranges: nodes.map(x => ({ start: x.start, end: x.end, marking: marking })),
    focus: undefined as undefined | boolean,
  }
}

function heuristic(node) {
  if (node.effects2===undefined) {
    return node
  }
  for (const effect of node.effects2) {
    if (effect.content && effect.content.type === "expand to executable") {
      effect.target.evolutions && effect.target.evolutions.forEach(x => {
        if(x.type === "Move Method")
        for (const range of x.after) {
          return {...node,file:range.file||range.filePath}
        }
      })
    }
  }
  return node
}

function node2diff(nodesBefore: any, nodesAfter: any[] | undefined, repo: string, commitIdBefore: string, commitIdAfter: string, focus: string, marking: string | string[]) {
  const r = {
    before: node2file(nodesBefore, repo, commitIdBefore, marking),
    after: node2file(nodesAfter?(typeof nodesAfter.map==="function"?nodesAfter:[nodesAfter]).map(heuristic):nodesBefore, repo, commitIdAfter, marking)
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
    && ((d.value.isTest) || (d.value.position
      && d.value.position.isTest)))
}

function findimpactedTests(node, max_depth = 5) {
  // TODO do not rely on d3 to move in the graph
  const r: any[] = []
  const stack = [node]
  const dstack = [0]
  while (stack.length > 0) {
    const curr = stack.shift()
    const depth = dstack.shift()
    if (isTest(curr)) {
      r.push(curr)
    } else if (depth!==undefined && depth <= max_depth) {
      stack.push(...(curr.effects2.map(x => x.target)));
      dstack.push(...(curr.effects2.map(x => depth + 1)));
    }
  }
  return r
}

function findRoot(node: any) {
  // TODO put it in some utils file
  // TODO do not rely on d3 to move in the graph
  const r: any[] = []
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

function graphNodesToSecenario(graphNodes: { node: any; root?: any; }, repo: any, commitIdBefore: string, commitIdAfter: string) {
  const { node } = graphNodes
  const impactedTests = findimpactedTests(node)
  const root = findRoot(node)[0] // TODO generalize all get(0), a move is a 1 to 1 ref but an extract is apriori a n to n.
  // TODO change from and to semantic to something like removed, inserted, considered. As left side of a diff is the "from" and rigth is the "to" 
  if (root.evolutions[0].type === "Move Method") {
    return {
      type: 'move', what: 'method',
      from: node2diff(root.evolutions[0].before[0],undefined, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'before', 'marked-evo-from'),
      to: node2diff(root.evolutions[0].after[0],undefined, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'after', 'marked-evo-to'),
      impacts:
        impactedTests.slice(0, 3).map(x => node2diff(x.value.position || x.value, x, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'before', 'marked-impacted'))
    }
  } else {
    return {
      type: UNSPEC_TYPE, what: UNSPEC_WHAT,
      before: root.evolutions[0].before.slice(0, 6).map(x =>
        node2diff(x, x, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'before', 'marked-evo-from')),
      after: root.evolutions[0].after.slice(0, 6).map(x =>
        node2diff(x, x, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'after', 'marked-evo-to')),
      impacts:
        impactedTests.slice(0, 6).map(x => node2diff(x.value.position || x.value, x, repo, root.evolutions[0].commitIdBefore, root.evolutions[0].commitIdAfter, 'before', 'marked-impacted'))
    }
  }
}

function scenario2Layout(scenario: ReturnType<typeof graphNodesToSecenario>) {
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

async function getContent(repo, commitId, path, mode, docs) {
  const k = repo + commitId + path

  return ((docs[k] && docs[k].linkedDoc({ mode })) ||
    RemoteFileService(fileHandler, {
      repo,
      commitId,
      path,
    })
      .then(x => {
        return docs[k] = (docs[k] && docs[k].linkedDoc({ mode })) || CodeMirror.Doc(x.content, mode)
      })
      .catch(x => {
        // console.error(x)
        return x.name + ': ' + x.message
      })
  );
}

function resize() {
  PubSub.publish('PANEL_RESIZE', undefined);
}

type InternalState = {
  value: PT['value'],
  mode: PT['mode'],
}

export default class MultiEditor extends React.Component<PT, InternalState> {
  codeMirror: undefined;
  _updateTimer: any;
  _CMHandlers: any[];
  _subscriptions: any[];
  _layout: {};
  _markerRange: any;
  _mark: any;
  _mark_orig: any;

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      mode: props.mode,
    };
    this.codeMirror = undefined
    this._updateTimer = undefined
    this._CMHandlers = [];
    this._subscriptions = [];
    this._layout = {}
    
    this._layoutRenderer = this._layoutRenderer.bind(this);
    // this.handleScenarioChange = this.handleScenarioChange.bind(this);
  }
  
  _layoutRenderer(x, docs = {}, key = "") {
    console.log(3, this)
    if (x.orientation === ORIENTATION.vertical) {
      return (
        <SplitPane
          key={key}
          className="splitpane"
          onResize={resize}>
          {x.content.map((x, i) => this._layoutRenderer(x, docs, key + '.' + i))}
        </SplitPane>
      );
    } else if (x.orientation === ORIENTATION.horizontal) {
      if (x.content.length <= 2) {
        return (<SplitPane
          key={key}
          className="splitpane"
          vertical={true}
          onResize={resize}>
          {x.content.map((x, i) => this._layoutRenderer(x, docs, key + '.' + i))}
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
          }, docs)}
          {this._layoutRenderer({
            orientation: x.orientation,
            content: x.content.slice(x.content.length / 2)
          }, docs)}
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
              before: { ...x.before, doc: await getContent(x.before.repo, x.before.commitId, x.before.path, this.props.mode, docs) },
              after: { ...x.after, doc: await getContent(x.after.repo, x.after.commitId, x.after.path, this.props.mode, docs) }
            })
            y.
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
            const content = await getContent(x.repo, x.commitId, x.path, this.props.mode, docs)
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

  componentDidUpdate(prevProps, prevState) {
    const nextProps = this.props
    const nextstate = this.state
    debugger
    // if (nextProps.value !== prevState.value ||
    //   nextProps.oldvalue !== prevState.oldvalue) {
    //   this.setState(
    //     {
    //       right: nextProps.right,
    //       left: nextProps.left,
    //     },
    //     () => {
    //       // this.codeMirror.edit.setValue(nextProps.value); // TODO usefull?

    //     },
    //   );
    // }
    // if (nextProps.mode !== prevProps.mode) {
    //   this.codeMirror.setOption('mode', nextProps.mode);
    // }

    // if (nextProps.keyMap !== prevProps.keyMap) {
    //   this.codeMirror.setOption('keyMap', nextProps.keyMap);
    // }

    // this._setError(nextProps.error);
  }


  shouldComponentUpdate(nextProps, nextState) { // TODO update insteadof using publish subscribe
    return !!nextState.forced && this.state !== nextState;
  }

  // componentDidMount() {

  //   this._CMHandlers = [];
  //   this._subscriptions = [];
  //   this._layout = {}

  //   // const tmp = 
  //   // ReactDOM.render(tmp, this.container)

  //   this._bindCMHandler('blur', instance => {
  //     if (!this.props.enableFormatting) return;

  //     // @ts-ignore
  //     require(['prettier/standalone', 'prettier/parser-babylon'], (prettier, babylon) => {
  //       const currValue = instance.doc.getValue();
  //       const options = Object.assign({},
  //         defaultPrettierOptions,
  //         {
  //           printWidth: instance.display.maxLineLength,
  //           plugins: [babylon],
  //         });
  //       instance.doc.setValue(prettier.format(currValue, options));
  //     });
  //   });

  //   this._bindCMHandler('changes', () => {
  //     clearTimeout(this._updateTimer);
  //     this._updateTimer = setTimeout(this._onContentChangeRight.bind(this), 200);
  //   }, "right");
  //   this._bindCMHandler('changes', () => {
  //     clearTimeout(this._updateTimer);
  //     this._updateTimer = setTimeout(this._onContentChangeLeft.bind(this), 200);
  //   }, "left");
  //   this._bindCMHandler('cursorActivity', () => {
  //     clearTimeout(this._updateTimer);
  //     this._updateTimer = setTimeout(this._onActivityRight.bind(this, true), 100);
  //   }, "right");
  //   this._bindCMHandler('cursorActivity', () => {
  //     clearTimeout(this._updateTimer);
  //     this._updateTimer = setTimeout(this._onActivityLeft.bind(this, true), 100);
  //   }, "left");
  //   this._subscriptions.push(
  //     PubSub.subscribe('PANEL_RESIZE', () => {
  //       // TODO dispatch to childs
  //     }),
  //     PubSub.subscribe('CHANGE_DIFF_CONTEXT', this.changeDiffContext),
  //   );

  //   // if (this.props.highlight) {
  //   //   this._markerRange = null;
  //   //   this._mark = null;
  //   //   this._subscriptions.push(
  //   //     PubSub.subscribe('HIGHLIGHT', (_, { node, range }) => {
  //   //       if (!range) {
  //   //         return;
  //   //       }
  //   //       // TODO dispatch to childs

  //   //       // console.log(1243, this.codeMirror, this.codeMirror.edit.state.diffViews[0].orig)
  //   //       // let docRight = this.codeMirror.edit.getDoc();
  //   //       // let docLeft = this.codeMirror.edit.state.diffViews[0].orig.getDoc();
  //   //       // this._markerRange = range;
  //   //       // // We only want one mark at a time.
  //   //       // if (this._mark) {
  //   //       //   this._mark.clear();
  //   //       // }
  //   //       // if (this._mark_orig) {
  //   //       //   this._mark_orig.clear();
  //   //       // }
  //   //       // let [startRight, endRight] = range.map(index => this._posFromIndex(docRight, index));
  //   //       // let [startLeft, endLeft] = range.map(index => this._posFromIndex(docLeft, index));
  //   //       // if (!startRight || !endRight) {
  //   //       //   this._markerRange = this._mark = null;
  //   //       //   return;
  //   //       // }
  //   //       // if (node.side === "right") {
  //   //       //   this._mark = this.codeMirror.edit.markText(
  //   //       //     startRight,
  //   //       //     endRight,
  //   //       //     { className: 'marked' },
  //   //       //   );
  //   //       // }
  //   //       // if (node.side === "left") {
  //   //       //   this._mark_orig = this.codeMirror.edit.state.diffViews[0].orig.markText(
  //   //       //     startLeft,
  //   //       //     endLeft,
  //   //       //     { className: 'marked' },
  //   //       //   );
  //   //       // }
  //   //     }),

  //   //     PubSub.subscribe('CLEAR_HIGHLIGHT', (_, { range=undefined } = {}) => {
  //   //       const cMR = this._markerRange
  //   //       const cR = range
  //   //       if (!cR ||
  //   //         cMR &&
  //   //         cR[0] === cMR[0] &&
  //   //         cR[1] === cMR[1]
  //   //       ) {
  //   //         this._markerRange = null;
  //   //         const m = this._mark
  //   //         if (m !== null) {
  //   //           m.clear();
  //   //           this._mark = null;
  //   //         }
  //   //         if (this._mark_orig !== null) {
  //   //           this._mark_orig.clear();
  //   //           this._mark_orig = null;
  //   //         }
  //   //       }
  //   //     }),
  //   //   );
  //   // }

  // }

  /**
   * @param {{ node: any; root: any; }} graphNodes
   */
  changeDiffContext(_, graphNodes: { node: any; root: any; }) {
    const { node, root } = graphNodes
    console.log(684, node, root)
    const x = graphNodesToSecenario(graphNodes,
      this.state.value.instance.repo,
      this.state.value.instance.commitIdBefore || '',
      this.state.value.instance.commitIdAfter || '')

    this.setState({
      ...this.state,
      value: {
        ...this.state.value,
        ...x,
      },
      forced: true
    })
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


  _bindCMHandler(event, handler, side = "") {
    this._CMHandlers.push([event, handler, side]);
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


  static propTypes = {
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

  static defaultProps = {
    value: {},
    highlight: true,
    lineNumbers: true,
    readOnly: false,
    mode: 'javascript',
    keyMap: 'default',
    onContentChange: (x) => { },
    onActivity: () => { },
  };

}



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