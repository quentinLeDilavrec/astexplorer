import CodeMirror from "codemirror";
import "codemirror/addon/display/panel";
import "codemirror/addon/merge/merge";

import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/selection/mark-selection";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/scroll/annotatescrollbar";

import "codemirror/keymap/vim";
import "codemirror/keymap/emacs";
import "codemirror/keymap/sublime";
import PropTypes from "prop-types";
import PubSub from "pubsub-js";
import React from "react";
import ReactDOM from "react-dom";
import cx from "classnames";
import { cps } from "redux-saga/effects";
import Editor2 from "./Editor2";
import FallBackMenu from "./FallBackMenu";
import { PT } from "../containers/MultiCodeContainer";
import { Diff, getContent } from "./MultiEditor2";

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
    | (Diff["after"] & { doc: CodeMirror.Doc | string; error?: string | true });
  oldValue:
    | string
    | (Diff["before"] & {
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
  onActivity: (i: number, side: "left" | "right") => void;
  error?: Error;
};

type S = {
  right: P["value"];
  left: P["oldValue"];
  mode: P["mode"];
};

export default class DiffEditor extends React.Component<P, S> {
  codeMirror: CodeMirror.MergeView.MergeViewEditor;
  container_both_bugged: HTMLDivElement | null;
  private _CMHandlers: any[];
  private _subscriptions: any[];
  container: HTMLDivElement | null;
  private _updateTimer: NodeJS.Timeout;
  private _markerRange: [number, number] | null;
  private _mark: CodeMirror.TextMarker | null;
  private _mark_orig: CodeMirror.TextMarker | null;

  constructor(
    props: P = {
      value: "",
      oldValue: "",
      highlight: true,
      lineNumbers: true,
      readOnly: true,
      mode: "javascript",
      keyMap: "default",
      onContentChange: (x) => {},
      onActivity: () => {},
      enableFormatting: false,
    }
  ) {
    super(props);
    this.state = {
      right: props.value,
      left: props.oldValue,
      mode: props.mode,
    };
    this.setMirrorsValue.bind(this);
    this._bindCMHandler.bind(this);
    this._unbindHandlers.bind(this);
    this._setError.bind(this);
    this._onContentChangeLeft.bind(this);
    this._onContentChangeRight.bind(this);
    this._onActivityLeft.bind(this);
    this._onActivityRight.bind(this);
  }
  // componentDidCatch(error, errorInfo) {
  //   console.error(error, errorInfo)
  // }

  // static getDerivedStateFromProps() {

  // }

  shouldComponentUpdate(nextProps, nextState) {
    // return !!nextState.force;
    return true;
  }

  getValue() {
    return this.getRight();
  }

  getRight() {
    return this.codeMirror && this.codeMirror.editor().getValue();
  }

  getLeft() {
    return this.codeMirror && this.codeMirror.leftOriginal().getValue();
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
    ranges: { start: number; end: number; marking?: string; type?: string }[],
    options = {
      defaultMarking: "",
      kind: "bad" as "good" | "bad",
      noScroll: false,
    }
  ) {
    type rTM = CodeMirror.TextMarker & {
      className: string;
      markers: (CodeMirror.TextMarker & { className: string })[];
    };
    const thumbs = {
      good: "thumbs-up",
      bad: "thumbs-down",
    } as const;
    const marked = {
      good: "marked-good",
      bad: "marked-bad",
    } as const;
    const buttons: { [b: string]: HTMLButtonElement } = {};
    let clicked_state: keyof typeof thumbs | undefined;
    const { defaultMarking, kind } = options;
    let first = Infinity;
    const weighted: rTM[] = [];
    const boxed: { mark?: rTM; range?: { start: number; end: number } }[] = [];
    let sortedStarts = [] as number[];
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      if (!range) {
        continue;
      }
      const start = range.start;
      sortedStarts.push(start);
      const end = range.end;
      first = Math.min(first, start);
      const from = editor.posFromIndex(start);
      const to = editor.posFromIndex(end + 1);
      const m = editor.markText(from, to, {
        className: "marked-current",
        // title:
        // range.description ||
        // range["description"] || range.type,
        // shared: true,
      });
      // m.on // TODO test also this
      weighted.push(m as rTM);
      boxed.push({ range: range });
    }
    sortedStarts.sort((a, b) => a - b);
    const onEnter = (choice: keyof typeof marked) => () => {
      boxed.forEach((x, i) => {
        const range = x.range;
        if (!range) {
          return;
        }
        const { start, end } = range;
        x.mark?.clear();
        x.mark = editor.markText(
          editor.posFromIndex(start),
          editor.posFromIndex(end + 1),
          {
            className: cx(marked[clicked_state || choice]),
            shared: true,
            // handleMouseEvents: true, // NEXT checkit
          }
        ) as rTM;
      });
      clearTimeout(hideThumbs)
      };
    let hideThumbs:NodeJS.Timeout;
    let thumbsWidget:CodeMirror.LineWidget
    const onLeave = () => {
      boxed.forEach((x, i) => {
        if (!clicked_state) {
          x.mark?.clear();
          x.mark = undefined;
        }
      });
      hideThumbs = setTimeout(() => {
        thumbsWidget.clear();
        buttons_visible = false;
      }, 5000);
    };
    const onClick = (choice) => () => {
      for (const key in buttons) {
        if (buttons.hasOwnProperty(key)) {
          const element = buttons[key];
          if (!element) {
            continue;
          }
          if (key === choice && clicked_state !== choice) {
            element.classList.add("clicked");
          } else {
            element.classList.remove("clicked");
          }
        }
      }
      clicked_state = clicked_state === choice ? undefined : choice;
      boxed.forEach((x, i) => {
        const range = x.range;
        if (!range || !clicked_state) {
          return;
        }
        const { start, end } = range;
        x.mark?.clear();
        x.mark = editor.markText(
          editor.posFromIndex(start),
          editor.posFromIndex(end + 1),
          {
            className: cx(marked[clicked_state]),
            shared: true,
            // handleMouseEvents: true, // NEXT checkit
          }
        ) as rTM;
      });
    };
    let buttons_visible = false;
    const showThumbsButtons = () => {
      buttons_visible = true;
      const e = document.createElement("div");
      const basic = ["fa evo-button"]
      ReactDOM.render(
        <div>
          <button
            className={cx(...basic,"fa-thumbs-down",...(clicked_state==='bad'?['clicked']:[]))}
            style={{ color: "red" }}
            onClick={onClick("bad")}
            onMouseOver={onEnter("bad")}
            onMouseOut={onLeave}
            ref={(x) => (x ? (buttons.bad = x) : undefined)}
          ></button>
          <button
            className={cx(...basic,"fa-thumbs-up",...(clicked_state==='good'?['clicked']:[]))}
            style={{ color: "green" }}
            onClick={onClick("good")}
            onMouseOver={onEnter("good")}
            onMouseOut={onLeave}
            ref={(x) => (x ? (buttons.good = x) : undefined)}
          ></button>
        </div>,
        e
      );
      // e.style.backgroundColor = "purple"
      e.style.zIndex = "" + 100;
      // editor.addWidget(editor.posFromIndex(first),
      //   e, true)
      thumbsWidget = editor.addLineWidget(posFirst.line, e, {
        above: true,
        showIfHidden: true,
        noHScroll: true,
      });
      hideThumbs = setTimeout(() => {
        thumbsWidget.clear();
        buttons_visible = false;
      }, 5000);
    };
    const posFirst = editor.posFromIndex(first);
    editor.getWrapperElement().onmousemove = function(e) {
      if (!buttons_visible) {
        const lineCh = editor.coordsChar({ left: e.clientX, top: e.clientY });
        const markers = editor.findMarksAt(lineCh);
        const mark = markers.filter(
          (x) => (x as any).className === "marked-current"
        )[0];
        if (mark) {
          showThumbsButtons();
        }
      }
    };
    const scrollFiller = editor
      .getWrapperElement()
      .querySelector<HTMLDivElement>("div.CodeMirror-scrollbar-filler");
    if (scrollFiller) {
      let rangeIndexShown = 0;
      scrollFiller.style.backgroundColor = "cyan";
      scrollFiller.addEventListener("click", () => {
        rangeIndexShown = (rangeIndexShown + 1) % ranges.length;
        const toShow = ranges[rangeIndexShown];
        if (toShow) {
          this.scrollTo(
            editor,
            editor.posFromIndex(sortedStarts[rangeIndexShown] || first)
          );
        }
      });
    }
    if (!options.noScroll) {
      this.scrollTo(editor, posFirst);
    }
    if (kind === "good") {
      onClick("good")();
    }
  }

  setMirrorsValue({
    before,
    after,
  }: {
    before: Diff["before"] & { doc: CodeMirror.Doc | string };
    after: Diff["after"] & { doc: CodeMirror.Doc | string };
  }) {
    // this.codeMirror.setShowDifferences(false); // TODO if a panel is empty fallback to standard editor or dissable diff
    // if (!this.codeMirror || !this.codeMirror.editor() || !this.codeMirror.leftOriginal()) {
    //   return;
    // }
    debugger;
    if (typeof before.doc === "string" || typeof after.doc === "string") {
      const r = {
        before:
          typeof this.state.left === "string" || this.codeMirror
            ? this.codeMirror.leftOriginal().getDoc()
            : undefined,
        after:
          typeof this.state.right === "string" || this.codeMirror
            ? this.codeMirror.editor().getDoc()
            : undefined,
      };
      this.setState(
        {
          ...this.state,
          left: {
            ...before,
            doc: before.doc,
            error:
              typeof before.doc === "string" ? before.doc || true : undefined,
          },
          right: {
            ...after,
            doc: after.doc,
            error:
              typeof after.doc === "string" ? after.doc || true : undefined,
          },
        },
        () => console.error(before.doc, after.doc)
      );
      return r;
    }

    const aaa = () => {
      // const bd = before.doc,
      //   ad = after.doc;
      // if (typeof bd === "string" || typeof ad === "string") {
      //   throw null;
      // }
      // const r = {
      //   before: this.codeMirror.leftOriginal().swapDoc(bd),
      //   after: this.codeMirror.editor().swapDoc(ad),
      // };
      // if ("start" in before && "start" in after) {
      //   this.codeMirror; // TODO unsync diff viewer
      // }
      // if ("start" in before) {
      //   this.markIt(
      //     this.codeMirror.leftOriginal(),
      //     // before["ranges"] ||
      //     [before]
      //   );
      // }
      // if ("start" in after) {
      //   this.markIt(
      //     this.codeMirror.editor(),
      //     // after["ranges"] ||
      //     [after]
      //   );
      // }
      // return r;
    };

    this.setState(
      {
        ...this.state,
        left: {
          ...before,
        },
        right: {
          ...after,
        },
      }
      // aaa
    );

    return aaa();
  }

  componentDidUpdate() {
    if (
      typeof this.state.left === "object" &&
      "error" in this.state.left &&
      typeof this.state.right === "object" &&
      "error" in this.state.right
    ) {
      console.error(this.codeMirror, this.container_both_bugged);
    }
    const b = this.state.left,
      a = this.state.right;
    if (typeof b !== "object" || typeof a !== "object") {
      throw null;
    }
    const bd = a.doc,
      ad = b.doc;
    if (typeof bd !== "object" || typeof ad !== "object") {
      throw null;
    }
    const r = {
      before:
        this.codeMirror.editor().getDoc() === bd
          ? bd
          : this.codeMirror.editor().swapDoc(bd),
      after:
        this.codeMirror.leftOriginal().getDoc() === ad
          ? ad
          : this.codeMirror.leftOriginal().swapDoc(ad),
    };

    function collapseSingle(cm: CodeMirror.Editor, from:number, to:number) {
      cm.addLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
      let widget = document.createElement("span");
      widget.className = "CodeMirror-merge-collapsed-widget";
      widget.title = (cm as any).phrase("Identical text collapsed. Click to expand.");
      let mark = cm.markText(CodeMirror.Pos(from, 0), CodeMirror.Pos(to - 1), {
        inclusiveLeft: true,
        inclusiveRight: true,
        replacedWith: widget,
        clearOnEnter: true,
      });
      function clear() {
        mark.clear();
        cm.removeLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
      }
      if (mark["explicitlyCleared"]) clear();
      CodeMirror.on(widget, "click", clear);
      mark.on("clear", clear);
      CodeMirror.on(widget, "click", clear);
      return { mark: mark, clear: clear };
    }

    function collapseStretch(
      size:number,
      editors: {
        line: number;
        cm: CodeMirror.Editor;
      }[]
    ) {
      let marks: (ReturnType<typeof collapseSingle>)[] = [];
      function clear() {
        for (let i = 0; i < marks.length; i++) marks[i]?.clear();
      }
      for (let i = 0; i < editors.length; i++) {
        const editor = editors[i];
        if (!editor) {
          continue
        }
        const mark = collapseSingle(editor.cm, editor.line, editor.line + size);
        marks.push(mark);
        mark.mark.on("clear", clear);
      }
      return marks[0]?.mark;
    }

    function unclearNearChunks(dv, margin, off, clear) {
      for (var i = 0; i < dv.chunks.length; i++) {
        var chunk = dv.chunks[i];
        for (var l = chunk.editFrom - margin; l < chunk.editTo + margin; l++) {
          var pos = l + off;
          if (pos >= 0 && pos < clear.length) clear[pos] = false;
        }
      }
    }

    function getMatchingOrigLine(editLine, chunks) {
      var editStart = 0,
        origStart = 0;
      for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        if (chunk.editTo > editLine && chunk.editFrom <= editLine) return null;
        if (chunk.editFrom > editLine) break;
        editStart = chunk.editTo;
        origStart = chunk.origTo;
      }
      return origStart + (editLine - editStart);
    }

    function collapseIdenticalStretches(
      mv: CodeMirror.MergeView.MergeViewEditor,
      margin?:number
    ) {
      if (typeof margin != "number") margin = 2;
      let clear: any[] = [],
        edit = mv.editor(),
        off = edit.firstLine();
      for (let l = off, e = edit.lastLine(); l <= e; l++) clear.push(true);
      if (mv.left) unclearNearChunks(mv.left, margin, off, clear);
      if (mv.right) unclearNearChunks(mv.right, margin, off, clear);

      for (let i = 0; i < clear.length; i++) {
        if (clear[i]) {
          let line = i + off;
          let size = 1;
          for (; i < clear.length - 1 && clear[i + 1]; i++, size++) {}
          if (size > margin) {
            let editors: { line: number; cm: CodeMirror.Editor }[] = [
              { line: line, cm: edit },
            ];
            if (mv.left)
              editors.push({
                line: getMatchingOrigLine(line, (mv.left as any).chunks),
                cm: mv.leftOriginal(),
              } as any);
            if (mv.right)
              editors.push({
                line: getMatchingOrigLine(line, (mv.right as any).chunks),
                cm: mv.rightOriginal(),
              } as any);
            let mark = collapseStretch(size, editors);
            if ((mv as any).options.onCollapse)
              (mv as any).options.onCollapse(mv, line, size, mark);
          }
        }
      }
    }
    collapseIdenticalStretches(this.codeMirror,undefined)

    if ("start" in b) {
      this.markIt(
        this.codeMirror.leftOriginal(),
        // before["ranges"] ||
        [b]
      );
    }
    if ("start" in a) {
      this.markIt(
        this.codeMirror.editor(),
        // after["ranges"] ||
        [a]
      );
    }
    return r;
  }

  _getErrorLine(error) {
    return error.loc ? error.loc.line : error.lineNumber || error.line;
  }

  _setError(error: Error) {
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
          this.codeMirror
            .editor()
            .addLineClass(lineNumber - 1, "text", "errorMarker");
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

    const codeMirrorOptions = {
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      placeholder: "Getting content ...",
    };

    // TODO unit test of MergeView outside of component
    this.codeMirror = CodeMirror.MergeView(
      // eslint-disable-line new-cap
      this.container,
      {
        keyMap: this.props.keyMap,
        value: this.state.right,
        mode: this.props.mode,
        lineNumbers: this.props.lineNumbers,
        readOnly: this.props.readOnly,
        origLeft: this.state.left,
        orig: undefined, //this.state.right,
        showDifferences: true,
        // connect: "align",
        collapseIdentical: true,
        allowEditingOriginals: true,
        ...codeMirrorOptions,
      }
    );
    debugger;

    const onClick = () => {
      const l: { start: number; end: number }[] = [];
      for (const x of this.codeMirror.editor().listSelections()) {
        const h = this.codeMirror.editor().indexFromPos(x.head);
        const a = this.codeMirror.editor().indexFromPos(x.anchor);
        l.push(a < h ? { start: a, end: h } : { start: h, end: a });
      }
      // l.sort(({start:a},{start:b})=>a-b)
      // /** @type {{start:number, end:number}[]} */
      // const r = []
      // const c = l[0]
      // for (const x of l) {
      //   // DEFERED finish if ranges need to be joined
      // }
      debugger;
      this.markIt(this.codeMirror.editor(), l, {
        defaultMarking: "",
        kind: "good",
        noScroll: true,
      });
    };
    let panel;
    let fl_spacer_widget;
    const f = () => {
      const e = document.createElement("span");
      // e.style.position="fixed"
      // e.style.display="block"
      // e.style.zIndex=101
      ReactDOM.render(
        <div style={{ height: "0px" }}>
          <button
            className="fa evo-button"
            onClick={onClick}
            title="Set selection as co-evolution"
            style={{
              position: "absolute",
              zIndex: 200,
              backgroundColor: "white",
            }}
          >
            Co-evolution
          </button>
        </div>,
        e
      );
      // this.markIt(cm, s)
      // NOTE wrong height bug fixed by replacing:
      // wrap.style.height = info.setHeight;
      // with:
      // wrap.style.removeProperty('height')

      const s = document.createElement("div");
      s.style.height = "18px";

      fl_spacer_widget = this.codeMirror.editor().addLineWidget(0, s, {
        above: true,
        insertAt: 0,
      });
      const item = e.childNodes.item[0];
      if (!item) {
        throw null;
      }
      panel = this.codeMirror.editor().addPanel(item, {
        stable: true,
        position: "top",
        replace: panel,
        // stable: true,
      });
      // TODO refresh to update diff curves
    };
    const g = () => {
      if (panel) {
        panel.clear();
        panel = undefined;
      }
      if (fl_spacer_widget) {
        fl_spacer_widget.clear();
        fl_spacer_widget = undefined;
      }
    };
    if (false) {
      const e2 = document.createElement("span");
      // e2.style.position="fixed"
      // e2.style.display="block"
      // e2.style.zIndex=101
      ReactDOM.render(
        <div>
          <button className="fa fa-angle-right"></button>
        </div>,
        e2
      );
      this.codeMirror.leftOriginal().addPanel(e2, {
        position: "top",
        stable: true,
      });
    }

    let selecting = false;
    this.codeMirror.editor().on("cursorActivity", (cm) => {
      const tmp = cm.getSelection();
      if (tmp.length === 0) {
        const tmp2 = cm.getScrollInfo();
        selecting = false;
        g();
        cm.scrollTo(tmp2.left, tmp2.top);
      }
    });
    this.codeMirror.editor().on("beforeSelectionChange", (cm, s) => {
      if (!selecting) {
        setTimeout(() => {
          if (!panel && cm.getSelection().length !== 0) {
            const { left, top } = cm.getScrollInfo();
            f();
            cm.scrollTo(left, top);
          }
          selecting = false;
        }, 2000);
      }
      selecting = true;
    });

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

    this._bindCMHandler(
      "changes",
      () => {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(
          this._onContentChangeRight.bind(this),
          200
        );
      },
      "right"
    );
    this._bindCMHandler(
      "changes",
      () => {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(
          this._onContentChangeLeft.bind(this),
          200
        );
      },
      "left"
    );
    this._bindCMHandler(
      "cursorActivity",
      () => {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(
          this._onActivityRight.bind(this, true),
          100
        );
      },
      "right"
    );
    this._bindCMHandler(
      "cursorActivity",
      () => {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(
          this._onActivityLeft.bind(this, true),
          100
        );
      },
      "left"
    );

    this._subscriptions.push(
      PubSub.subscribe("PANEL_RESIZE", () => {
        if (this.codeMirror) {
          this.codeMirror.editor().refresh();
          this.codeMirror.editor().setSize(undefined, undefined);
          this.codeMirror.leftOriginal().refresh();
          this.codeMirror.leftOriginal().setSize(undefined, undefined);
        }
      })
    );

    if (true) {
      // if (this.props.highlight) {
      this._markerRange = null;
      this._mark = null;
      const _this = this;
      // this._subscriptions.push(
      //   PubSub.subscribe(
      //     "HIGHLIGHT",
      //     (
      //       _,
      //       {
      //         node,
      //         range,
      //       }: {
      //         node: { file: string; side: "left" | "right" };
      //         range: [number, number];
      //       }
      //     ) => {
      //       if (!range) {
      //         return;
      //       }
      //       let docRight = _this.codeMirror.editor().getDoc();
      //       let docLeft = _this.codeMirror.leftOriginal().getDoc();
      //       this._markerRange = range;
      //       // We only want one mark at a time.
      //       if (_this._mark) {
      //         _this._mark.clear();
      //       }
      //       if (_this._mark_orig) {
      //         _this._mark_orig.clear();
      //       }
      //       if (
      //         node.side === "right" &&
      //         typeof _this.state.right === "object" &&
      //         _this.state.right.file === node.file
      //       ) {
      //         let [startRight, endRight] = [
      //           docRight.posFromIndex(range[0]),
      //           docRight.posFromIndex(range[1] + 1),
      //         ];
      //         //range.map((index) => docRight.posFromIndex(index));
      //         if (!startRight || !endRight) {
      //           _this._markerRange = _this._mark = null;
      //           return;
      //         }
      //         _this._mark = _this.codeMirror
      //           .editor()
      //           .markText(startRight, endRight, {
      //             className: "marked",
      //             shared: true,
      //           });
      //       }
      //       if (
      //         node.side === "left" &&
      //         typeof _this.state.left === "object" &&
      //         _this.state.left.file === node.file
      //       ) {
      //         let [startLeft, endLeft] = [
      //           docLeft.posFromIndex(range[0]),
      //           docLeft.posFromIndex(range[1] + 1),
      //         ];
      //         //range.map((index) => docLeft.posFromIndex(index));
      //         if (!startLeft || !endLeft) {
      //           _this._markerRange = _this._mark = null;
      //           return;
      //         }
      //         _this._mark_orig = _this.codeMirror
      //           .leftOriginal()
      //           .markText(startLeft, endLeft, {
      //             className: "marked",
      //             shared: true,
      //           });
      //       }
      //     }
      //   ),

      //   PubSub.subscribe(
      //     "CLEAR_HIGHLIGHT",
      //     (_, { range }: { range: [number, number] }) => {
      //       if (
      //         !range ||
      //         (this._markerRange &&
      //           range[0] === this._markerRange[0] &&
      //           range[1] === this._markerRange[1])
      //       ) {
      //         this._markerRange = null;
      //         if (this._mark) {
      //           this._mark.clear();
      //           this._mark = null;
      //         }
      //         if (this._mark_orig) {
      //           this._mark_orig.clear();
      //           this._mark_orig = null;
      //         }
      //       }
      //     }
      //   )
      // );
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

  _bindCMHandler(
    event: string,
    handler: (instance: CodeMirror.Editor) => void,
    side = ""
  ) {
    this._CMHandlers.push([event, handler, side ? side : ""]);
    if (side === "right") {
      this.codeMirror.editor().on(event, handler);
    } else if (side === "left") {
      this.codeMirror.leftOriginal().on(event, handler);
    } else {
      this.codeMirror.editor().on(event, handler);
      this.codeMirror.leftOriginal().on(event, handler);
    }
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    for (let i = 0; i < cmHandlers.length; i += 1) {
      if (cmHandlers[i][2] === "right") {
        this.codeMirror.editor().off(cmHandlers[i][0], cmHandlers[i][1]);
      } else if (cmHandlers[i][2] === "left") {
        this.codeMirror.leftOriginal().off(cmHandlers[i][0], cmHandlers[i][1]);
      } else {
        this.codeMirror.editor().off(cmHandlers[i][0], cmHandlers[i][1]);
        this.codeMirror.leftOriginal().off(cmHandlers[i][0], cmHandlers[i][1]);
      }
    }
    this._subscriptions.forEach(PubSub.unsubscribe);
  }

  _onContentChangeRight() {
    const docRight = this.codeMirror.editor().getDoc();
    const args = {
      value: docRight.getValue(),
      cursor: docRight.indexFromPos(docRight.getCursor()),
      side: "right",
    };
    this.setState(
      {
        right: args.value,
      },
      () => {
        this.props.onContentChange(args);
      }
    );
  }

  _onContentChangeLeft() {
    const docLeft = this.codeMirror.leftOriginal().getDoc();
    const args = {
      value: docLeft.getValue(),
      cursor: docLeft.indexFromPos(docLeft.getCursor()),
      side: "right",
    };
    this.setState(
      {
        left: args.value,
      },
      () => {
        this.props.onContentChange(args);
      }
    );
  }

  _onActivityRight() {
    this.props.onActivity(
      this.codeMirror
        .editor()
        .getDoc()
        .indexFromPos(this.codeMirror.editor().getCursor()),
      "right"
    );
  }
  _onActivityLeft() {
    this.props.onActivity(
      this.codeMirror
        .leftOriginal()
        .getDoc()
        .indexFromPos(this.codeMirror.editor().getCursor()),
      "left"
    );
  }

  render() {
    if (
      typeof this.state.left == "object" &&
      "error" in this.state.left &&
      typeof this.state.right == "object" &&
      "error" in this.state.right
    ) {
      debugger;
      return (
        <div
          key="both-error"
          className="editor"
          ref={(c) => (this.container_both_bugged = c)}
        >
          <div
            key="both-error0"
            className="CodeMirror-merge CodeMirror-merge-2pane"
          >
            <div
              key="both-error1"
              className="CodeMirror-merge-pane CodeMirror-merge-left error-editor"
            >
              <FallBackMenu error={this.state.left.error} />
            </div>
            <div key="both-error2" className="CodeMirror-merge-gap" />
            <div
              key="both-error3"
              className="CodeMirror-merge-pane CodeMirror-merge-editor CodeMirror-merge-pane-rightmost error-editor"
            >
              <FallBackMenu error={this.state.right.error} />
            </div>
          </div>
        </div>
      );
    } else if (
      typeof this.state.left == "object" &&
      "error" in this.state.left
    ) {
      debugger;
      return (
        <div
          key="left-error"
          className="editor"
          ref={(c) => (this.container_both_bugged = c)}
        >
          <div
            key="left-error0"
            className="CodeMirror-merge CodeMirror-merge-2pane"
          >
            <div
              key="left-error1"
              className="CodeMirror-merge-pane CodeMirror-merge-left error-editor"
              style={{ width: "25%" }}
            >
              <FallBackMenu error={this.state.left.error} />
            </div>
            <div
              key="left-error2"
              className="CodeMirror-merge-gap"
              style={{ width: "3%" }}
            />
            <div
              key="left-error3"
              className="CodeMirror-merge-pane CodeMirror-merge-editor CodeMirror-merge-pane-rightmost"
              style={{ width: "72%" }}
            >
              <Editor2
                key="left-error4"
                value={"-Getting content..."}
                mode={this.props.mode}
                ref={(y) => {
                  if (y) {
                    y.setMirrorValue(this.state.right);
                  }
                  return y;
                }}
              />
            </div>
          </div>
        </div>
      );
    } else if (
      typeof this.state.right == "object" &&
      "error" in this.state.right
    ) {
      debugger;
      return (
        <div
          key="right-error"
          className="editor"
          ref={(c) => (this.container_both_bugged = c)}
        >
          <div
            key="right-error0"
            className="CodeMirror-merge CodeMirror-merge-2pane"
          >
            <div
              key="right-error1"
              className="CodeMirror-merge-pane CodeMirror-merge-left"
              style={{ width: "72%" }}
            >
              <Editor2
                key="right-error4"
                value={"-Getting content..."}
                mode={this.props.mode}
                ref={(y) => {
                  if (y) {
                    y.setMirrorValue(this.state.left);
                  }
                  return y;
                }}
              />
            </div>
            <div
              key="right-error2"
              className="CodeMirror-merge-gap"
              style={{ width: "3%" }}
            />
            <div
              key="right-error3"
              className="CodeMirror-merge-pane CodeMirror-merge-editor CodeMirror-merge-pane-rightmost error-editor"
              style={{ width: "25%" }}
            >
              <FallBackMenu error={this.state.right.error} />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          key="both-ok"
          className="editor"
          ref={(c) => (this.container = c)}
        />
      );
    }
  }

  static propTypes = {
    right: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    left: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
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
    right: "",
    left: "",
    highlight: true,
    lineNumbers: true,
    readOnly: false,
    mode: "javascript",
    keyMap: "default",
    onContentChange: (x) => {},
    onActivity: () => {},
  };
}
