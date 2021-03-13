import CodeMirror from "codemirror";
import "codemirror/keymap/vim";
import "codemirror/addon/merge/merge";
import "codemirror/keymap/emacs";
import "codemirror/keymap/sublime";
import PropTypes from "prop-types";
import PubSub from "pubsub-js";
import React from "react";
import ReactDOM from "react-dom";
import { File, Marked } from "./MultiEditor2";
import { PT } from "../containers/MultiCodeContainer";

const defaultPrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: "none",
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: "babylon",
};

type P = {
  value:
    | string
    | ((Marked | File) & {
        doc: CodeMirror.Doc | string;
        error?: string | true;
      });
  mode: PT["mode"];
  highlight?: boolean;
  lineNumbers?: boolean;
  readOnly?: boolean;
  enableFormatting?: boolean;
  keyMap: PT["keyMap"];
  onContentChange: (x) => void;
  onActivity: (i: number) => void;
  error?: Error;
};

type S = {
  value: P["value"];
  mode: P["mode"];
};

export default class Editor2 extends React.Component<P, S> {
  codeMirror: CodeMirror.Editor;
  private _CMHandlers: any[];
  private _subscriptions: any[];
  container: HTMLDivElement | null;
  private _updateTimer: NodeJS.Timeout;
  private _markerRange: [number, number] | null;
  private _mark: CodeMirror.TextMarker | null;
  private _mark_orig: CodeMirror.TextMarker | null;

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      mode: props.mode,
    };
    this.setMirrorValue.bind(this);
    this._bindCMHandler.bind(this);
    this._unbindHandlers.bind(this);
    this._setError.bind(this);
    this._onContentChange.bind(this);
    this._onActivity.bind(this);
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
    return error.loc ? error.loc.line : error.lineNumber || error.line;
  }

  _setError(error) {
    if (this.codeMirror) {
      let oldError = this.props.error;
      if (oldError) {
        let lineNumber = this._getErrorLine(oldError);
        if (lineNumber) {
          this.codeMirror.removeLineClass(
            lineNumber - 1,
            "text",
            "errorMarker"
          );
        }
      }

      if (error) {
        let lineNumber = this._getErrorLine(error);
        if (lineNumber) {
          this.codeMirror.addLineClass(lineNumber - 1, "text", "errorMarker");
        }
      }
    }
  }

  componentDidMount() {
    this._CMHandlers = [];
    this._subscriptions = [];
    if (!this.container) {
      throw null;
    }
    this.codeMirror = CodeMirror(
      // eslint-disable-line new-cap
      this.container,
      {
        keyMap: this.props.keyMap,
        value: this.state.value,
        mode: this.props.mode,
        lineNumbers: this.props.lineNumbers,
        readOnly: this.props.readOnly,
      }
    );

    this._bindCMHandler("blur", (instance) => {
      if (!this.props.enableFormatting) return;

      (require as any)(
        ["prettier/standalone", "prettier/parser-babylon"],
        (prettier, babylon) => {
          const currValue = instance.getDoc().getValue();
          const options = Object.assign({}, defaultPrettierOptions, {
            printWidth: (instance as any).display.maxLineLength,
            plugins: [babylon],
          });
          instance.getDoc().setValue(prettier.format(currValue, options));
        }
      );
    });

    this._bindCMHandler("changes", () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onContentChange.bind(this), 200);
    });
    this._bindCMHandler("cursorActivity", () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(this._onActivity.bind(this, true), 100);
    });

    this._subscriptions.push(
      PubSub.subscribe("PANEL_RESIZE", () => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
          this.codeMirror.setSize(undefined, undefined);
        }
      })
    );

    if (this.props.highlight) {
      this._markerRange = null;
      this._mark = null;
      this._subscriptions.push(
        PubSub.subscribe("HIGHLIGHT", (_, { range }) => {
          if (!range) {
            return;
          }
          let doc = this.codeMirror.getDoc();
          this._markerRange = range;
          // We only want one mark at a time.
          if (this._mark) {
            this._mark.clear();
          }
          let [start, end] = range.map((index) => doc.posFromIndex(index));
          if (!start || !end) {
            this._markerRange = this._mark = null;
            return;
          }
          this._mark = this.codeMirror.markText(start, end, {
            className: "marked",
            shared: true,
          });
        }),

        PubSub.subscribe(
          "CLEAR_HIGHLIGHT",
          (_, { range }: { range: [number, number] }) => {
            if (
              !range ||
              (this._markerRange &&
                range[0] === this._markerRange[0] &&
                range[1] === this._markerRange[1])
            ) {
              this._markerRange = null;
              if (this._mark) {
                this._mark.clear();
                this._mark = null;
              }
            }
          }
        )
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
    container &&
      container.children &&
      container.children[0] &&
      container.removeChild(container.children[0]);
    (this.codeMirror as any) = null;
  }

  scrollTo(editor: CodeMirror.Editor, from: CodeMirror.Position) {
    const fromS = editor.charCoords(from, "local");
    const info = editor.getScrollInfo();
    // const right = Math.max(fromS.right, toS.right)
    // editor.scrollTo((left + (right - left) / 2) - info.clientWidth / 2, (fromS.top + (toS.bottom - fromS.top) / 2) - info.clientHeight / 2);
    editor.scrollTo(
      fromS.left - info.clientWidth / 10,
      fromS.top - info.clientHeight / 10
    );
  }
  markIt(
    editor: CodeMirror.Editor,
    ranges: { start: number; end: number; marking?: string }[]
  ) {
    let first = Infinity;
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      if (!range) {
        continue;
      }
      const start = range.start;
      const end = range.end;
      first = Math.min(first, start);
      const from = editor.posFromIndex(start);
      const to = editor.posFromIndex(end + 1);
      editor.markText(from, to, {
        className: range.marking,
        shared:true // useful ?
      });
    }
    this.scrollTo(editor, editor.posFromIndex(first));
  }

  setMirrorValue(
    param: ((Marked | File) & { doc: CodeMirror.Doc | string }) | string
  ) {
    const doc =
      typeof param === "string"
        ? CodeMirror.Doc(param, this.state.mode)
        : typeof param.doc === "string"
        ? CodeMirror.Doc(param.doc, this.state.mode)
        : param.doc;

    this.setState({
      ...this.state,
      value: param,
    });

    if (this.codeMirror && doc && typeof param === 'object') {
      // && (this.state.value = value)) {// TODO should not set state manually
      const r = this.codeMirror.swapDoc(doc);
      if ('start' in param) {
        this.markIt(this.codeMirror, [param]);
      }
      return r;
    }

    if (false) {
      // TODO
      const e = document.createElement("span");
      // e.style.position="fixed"
      // e.style.display="block"
      // e.style.zIndex=101
      ReactDOM.render(
        <div>
          <button className="fa fa-angle-right"></button>
        </div>,
        e
      );
      // this.markIt(cm, s)
      this.codeMirror.addPanel(e, {
        position: "top",
        stable: true,
      });
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

  _bindCMHandler(
    event: string,
    handler: (instance: CodeMirror.Editor) => void
  ) {
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
    this.setState({ value: args.value }, () =>
      this.props.onContentChange(args)
    );
  }

  _onActivity() {
    this.props.onActivity(
      this.codeMirror.getDoc().indexFromPos(this.codeMirror.getCursor())
    );
  }

  render() {
    return <div className="editor" ref={(c) => (this.container = c)} />;
  }

  static propTypes = {
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

  static defaultProps = {
    value: "",
    highlight: true,
    lineNumbers: true,
    readOnly: false,
    mode: "javascript",
    keyMap: "default",
    onContentChange: () => {},
    onActivity: () => {},
  };
}
