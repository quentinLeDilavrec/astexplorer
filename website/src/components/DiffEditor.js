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

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value ||
      nextProps.oldvalue !== this.state.oldvalue) {
      this.setState(
        {
          value: nextProps.value,
          oldvalue: nextProps.oldvalue,
        },
        () => {
          // this.codeMirror.editor().setValue(nextProps.value); // TODO usefull?

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


  shouldComponentUpdate() {
    return false;
  }

  getValue() {
    return this.codeMirror && this.codeMirror.getValue();
  }

  getOldValue() {
    return this.codeMirror && this.codeMirror.editor().state.diffViews[0].orig.getValue();
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
          this.codeMirror.editor().addLineClass(lineNumber - 1, 'text', 'errorMarker');
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
    console.log(77, this.state.value)
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
        collapseIdentical: false
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
      this._updateTimer = setTimeout(this._onContentChange.bind(this), 200);
    });
    this._bindCMHandler('cursorActivity', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onActivity.bind(this, true), 100);
    });

    this._subscriptions.push(
      PubSub.subscribe('PANEL_RESIZE', () => {
        if (this.codeMirror) {
          console.log(7, this)
          this.codeMirror.editor().refresh();
          // this.codeMirror.left.forceUpdate()(this.state.mode)
          // this.codeMirror.right.forceUpdate()(this.state.mode)
        }
      }),
    );

    if (this.props.highlight) {
      this._markerRange = null;
      this._mark = null;
      this._subscriptions.push(
        PubSub.subscribe('HIGHLIGHT', (_, { range }) => {
          if (!range) {
            return;
          }
          let doc = this.codeMirror.getDoc();
          this._markerRange = range;
          // We only want one mark at a time.
          if (this._mark) {
            this._mark.clear();
          }
          let [start, end] = range.map(index => this._posFromIndex(doc, index));
          if (!start || !end) {
            this._markerRange = this._mark = null;
            return;
          }
          this._mark = this.codeMirror.markText(
            start,
            end,
            { className: 'marked' },
          );
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

  _bindCMHandler(event, handler) {
    this._CMHandlers.push(event, handler);
    this.codeMirror.edit.on(event, handler);
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    for (let i = 0; i < cmHandlers.length; i += 2) {
      this.codeMirror.editor().off(cmHandlers[i], cmHandlers[i + 1]);
    }
    this._subscriptions.forEach(PubSub.unsubscribe);
  }

  _onContentChange() {
    const doc = this.codeMirror.editor().getDoc();
    // console.log(7534,this.codeMirror.editor().state.diffViews[0].orig)
    const args = {
      value: doc.getValue(),
      oldvalue: this.codeMirror.editor().state.diffViews[0].orig.getValue(),
      cursor: doc.indexFromPos(doc.getCursor()),
    };
    console.log(37,args)
    // this.codeMirror.editor().state.diffViews[0].orig.setValue('fwefw\nwefew')
    this.setState(
      {
        value: args.value,
        oldvalue: args.oldvalue,
      },
      () => {
        this.props.onContentChange(args)},
    );
  }

  _onActivity() {
    this.props.onActivity(
      this.codeMirror.editor().getDoc().indexFromPos(this.codeMirror.editor().getCursor()),
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
  onContentChange: (x) => {},
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
//   let d = document.createElement("div"); d.style.cssText = "width: 50px; margin: 7px; height: 14px"; dv.editor().addLineWidget(57, d)
// };

// function mergeViewHeight(mergeView) {
//   function editorHeight(editor) {
//     if (!editor) return 0;
//     return editor.getScrollInfo().height;
//   }
//   return Math.max(editorHeight(mergeView.leftOriginal()),
//                   editorHeight(mergeView.editor()),
//                   editorHeight(mergeView.rightOriginal()));
// }

// function resize(mergeView) {
//   var height = mergeViewHeight(mergeView);
//   for(;;) {
//     if (mergeView.leftOriginal())
//       mergeView.leftOriginal().setSize(null, height);
//     mergeView.editor().setSize(null, height);
//     if (mergeView.rightOriginal())
//       mergeView.rightOriginal().setSize(null, height);

//     var newHeight = mergeViewHeight(mergeView);
//     if (newHeight >= height) break;
//     else height = newHeight;
//   }
//   mergeView.wrap.style.height = height + "px";
// }