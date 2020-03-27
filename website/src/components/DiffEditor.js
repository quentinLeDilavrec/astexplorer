import CodeMirror from 'codemirror';
import 'codemirror/addon/merge/merge';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';

const defaultPrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: 'babylon',
};

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

export default class DiffEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      oldvalue: props.oldvalue,
      mode: props.mode,
    };
  }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   if (nextProps.value !== this.state.value ||
  //     nextProps.oldvalue !== this.state.oldvalue) {
  //     this.setState(
  //       {
  //         value: nextProps.value,
  //         oldvalue: nextProps.oldvalue,
  //       },
  //       () => {
  //         // this.codeMirror.edit.setValue(nextProps.value); // TODO usefull?

  //       },
  //     );
  //   }
  //   if (nextProps.mode !== this.props.mode) {
  //     this.codeMirror.setOption('mode', nextProps.mode);
  //   }

  //   if (nextProps.keyMap !== this.props.keyMap) {
  //     this.codeMirror.setOption('keyMap', nextProps.keyMap);
  //   }

  //   this._setError(nextProps.error);
  // }


  shouldComponentUpdate() {
    return false;
  }

  getValue() {
    return this.codeMirror && (this.state.value = this.codeMirror.getValue());
  }

  getOldValue() {
    return this.codeMirror && (this.state.oldvalue = this.codeMirror.edit.state.diffViews[0].orig.getValue());
  }

  /**
   * 
   * @param {CodeMirror.Editor} editor 
   * @param {CodeMirror.Position} from 
   */
  scrollTo(editor, from) {
    const fromS = editor.charCoords(from, "local");
    const info = editor.getScrollInfo();
    // const right = Math.max(fromS.right, toS.right)
    // editor.scrollTo((left + (right - left) / 2) - info.clientWidth / 2, (fromS.top + (toS.bottom - fromS.top) / 2) - info.clientHeight / 2);
    editor.scrollTo(fromS.left - info.clientWidth / 10, fromS.top - info.clientHeight / 10);
  }
  /**
   * 
   * @param {CodeMirror.Editor} editor 
   * @param {{start:number,end:number}[]} ranges 
   */
  markIt(editor, ranges) {
    let first = Infinity;
    for (let i = 0; i < ranges.length; i++) {
      const start = ranges[i].start;
      const end = ranges[i].end;
      first = Math.min(first, start)
      const from = editor.posFromIndex(start)
      const to = editor.posFromIndex(end + 1)
      editor.markText(
        from, to,
        {
          className: ranges[i].marking,
          // shared:true // useful ?
        },
      )
    }
    this.scrollTo(editor, editor.posFromIndex(first));
  }

  setMirrorsValue({ before, after }) {
    // this.codeMirror.setShowDifferences(false); // TODO if a panel is empty fallback to standard editor or dissable diff
    if (this.codeMirror && (this.state.value = after.doc) && this.codeMirror.editor() &&
      (this.state.oldvalue = before.doc) && this.codeMirror.leftOriginal()) {
      const r = {
        before: this.codeMirror.leftOriginal().swapDoc(before.doc),
        after: this.codeMirror.editor().swapDoc(after.doc),
      }
      if (before.focus && after.focus) {
        this.codeMirror // TODO unsync diff viewer
      }
      if (before.focus) {
        this.markIt(this.codeMirror.leftOriginal(), before.ranges);
      }
      if (after.focus) {
        this.markIt(this.codeMirror.editor(), after.ranges);
      }
      return r;
    }
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
    this.codeMirror = CodeMirror.MergeView( // eslint-disable-line new-cap
      this.container,
      {
        keyMap: this.props.keyMap,
        value: this.state.value,
        mode: this.props.mode,
        lineNumbers: this.props.lineNumbers,
        readOnly: this.props.readOnly,
        origLeft: this.state.oldvalue,
        // orig: '0.0.0',
        highlightDifferences: true,
        // connect: "align",
        collapseIdentical: false,
        allowEditingOriginals: true,
      },
    );

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
        if (this.codeMirror) {
          this.codeMirror.edit.refresh();
          this.codeMirror.edit.state.diffViews[0].orig.refresh();

          // this.codeMirror.left.forceUpdate()(this.state.mode)
          // this.codeMirror.right.forceUpdate()(this.state.mode)
        }
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
          let docRight = this.codeMirror.edit.getDoc();
          let docLeft = this.codeMirror.edit.state.diffViews[0].orig.getDoc();
          this._markerRange = range;
          // We only want one mark at a time.
          if (this._mark) {
            this._mark.clear();
          }
          if (this._mark_orig) {
            this._mark_orig.clear();
          }
          let [startRight, endRight] = range.map(index => this._posFromIndex(docRight, index));
          let [startLeft, endLeft] = range.map(index => this._posFromIndex(docLeft, index));
          if (!startRight || !endRight) {
            this._markerRange = this._mark = null;
            return;
          }
          if (node.side === "right") {
            this._mark = this.codeMirror.edit.markText(
              startRight,
              endRight,
              { className: 'marked' },
            );
          }
          if (node.side === "left") {
            this._mark_orig = this.codeMirror.edit.state.diffViews[0].orig.markText(
              startLeft,
              endLeft,
              { className: 'marked' },
            );
          }
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
    let container = this.container;
    container.removeChild(container.children[0]);
    this.codeMirror = null;
  }

  _bindCMHandler(event, handler, side) {
    this._CMHandlers.push([event, handler, side ? side : ""]);
    if (side === "right") {
      this.codeMirror.edit.on(event, handler);
    } else if (side === "left") {
      this.codeMirror.edit.state.diffViews[0].orig.on(event, handler);
    } else {
      this.codeMirror.edit.on(event, handler);
      this.codeMirror.edit.state.diffViews[0].orig.on(event, handler);
    }
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    for (let i = 0; i < cmHandlers.length; i += 1) {
      if (cmHandlers[i][2] === "right") {
        this.codeMirror.edit.off(cmHandlers[i][0], cmHandlers[i][1]);
      } else if (cmHandlers[i][2] === "left") {
        this.codeMirror.edit.state.diffViews[0].orig.off(cmHandlers[i][0], cmHandlers[i][1]);
      } else {
        this.codeMirror.edit.off(cmHandlers[i][0], cmHandlers[i][1]);
        this.codeMirror.edit.state.diffViews[0].orig.off(cmHandlers[i][0], cmHandlers[i][1]);
      }
    }
    this._subscriptions.forEach(PubSub.unsubscribe);
  }

  _onContentChangeRight() {
    const docRight = this.codeMirror.edit.getDoc();
    const args = {
      value: docRight.getValue(),
      cursor: docRight.indexFromPos(docRight.getCursor()),
      side: "right",
    };
    this.setState(
      {
        value: args.value,
      },
      () => {
        this.props.onContentChange(args)
      },
    );
  }

  _onContentChangeLeft() {
    const docLeft = this.codeMirror.edit.state.diffViews[0].orig.getDoc();
    const args = {
      oldvalue: docLeft.getValue(),
      cursor: docLeft.indexFromPos(docLeft.getCursor()),
      side: "right",
    };
    this.setState(
      {
        oldvalue: args.oldvalue,
      },
      () => {
        this.props.onContentChange(args)
      },
    );
  }

  _onActivityRight() {
    this.props.onActivity(
      this.codeMirror.edit
        .getDoc().indexFromPos(this.codeMirror.edit.getCursor()),
      "right",
    );
  }
  _onActivityLeft() {
    this.props.onActivity(
      this.codeMirror.edit.state.diffViews[0].orig
        .getDoc().indexFromPos(this.codeMirror.edit.getCursor()),
      "left",
    );
  }

  render() {
    return (
      <div className="editor" ref={c => this.container = c} />
    );
  }
}

DiffEditor.propTypes = {
  value: PropTypes.string,
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

DiffEditor.defaultProps = {
  value: '',
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