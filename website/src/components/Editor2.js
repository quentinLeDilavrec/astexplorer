import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim';
import 'codemirror/addon/merge/merge';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';
import ReactDOM from "react-dom";

const defaultPrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: 'babylon',
};

export default class Editor2 extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   if (nextProps.value !== this.state.value) {
  //     this.setState(
  //       { value: nextProps.value },
  //       () => this.codeMirror.setValue(nextProps.value),
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
    return this.codeMirror && this.codeMirror.getValue();
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
          this.codeMirror.addLineClass(lineNumber - 1, 'text', 'errorMarker');
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
    this.codeMirror = CodeMirror( // eslint-disable-line new-cap
      this.container,
      {
        keyMap: this.props.keyMap,
        value: this.state.value,
        mode: this.props.mode,
        lineNumbers: this.props.lineNumbers,
        readOnly: this.props.readOnly,
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
          this.codeMirror.refresh();
          this.codeMirror.setSize();
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





  setMirrorValue(param) {
    param.doc = typeof param.doc === 'string' ? CodeMirror.Doc(param.doc, this.state.mode) : param.doc
    const { doc: value, ranges } = param
    if (this.codeMirror && (this.state.value = value)) {// TODO should not set state manually
      const r = this.codeMirror.swapDoc(value)
      this.markIt(this.codeMirror, ranges);
      return r
    }

    if (false) { // TODO 
      const e = document.createElement('span')
      // e.style.position="fixed"
      // e.style.display="block"
      // e.style.zIndex=101
      ReactDOM.render((<div>
        <button className="fa fa-angle-right"></button>
      </div>
      ), e)
      // this.markIt(cm, s)
      this.codeMirror
        .addPanel(e, {
          position: "top",
          stable: true,
        })
      this.codeMirror.refresh();
    }

    // if (this.codeMirror) {
    //   if (typeof value === "string") {
    //     this.state.value = value
    //     const r = this.codeMirror.swapDoc(value)
    //   } else if (value) {
    //     const { doc: value, start, end } = value
    //     this.state.value = value // TODO should not set state manually
    //     const r = this.codeMirror.swapDoc(value)
    //     this.codeMirror.scrollIntoView(this.codeMirror.posFromIndex(start + (end - start) / 2))
    //     return r
    //   }
    // }
  }

  _bindCMHandler(event, handler) {
    this._CMHandlers.push(event, handler);
    this.codeMirror.on(event, handler);
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    for (let i = 0; i < cmHandlers.length; i += 2) {
      this.codeMirror.off(cmHandlers[i], cmHandlers[i + 1]);
    }
    this._subscriptions.forEach(PubSub.unsubscribe);
  }

  _onContentChange() {
    const doc = this.codeMirror.getDoc();
    const args = {
      value: doc.getValue(),
      cursor: doc.indexFromPos(doc.getCursor()),
    };
    this.setState(
      { value: args.value },
      () => this.props.onContentChange(args),
    );
  }

  _onActivity() {
    this.props.onActivity(
      this.codeMirror.getDoc().indexFromPos(this.codeMirror.getCursor()),
    );
  }

  render() {
    return (
      <div className="editor" ref={c => this.container = c} />
    );
  }
}

Editor2.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
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

Editor2.defaultProps = {
  value: '',
  highlight: true,
  lineNumbers: true,
  readOnly: false,
  mode: 'javascript',
  keyMap: 'default',
  onContentChange: () => { },
  onActivity: () => { },
};
