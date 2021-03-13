import CodeMirror from "codemirror";
import "codemirror/addon/merge/merge";
import "codemirror/keymap/vim";
import "codemirror/keymap/emacs";
import "codemirror/keymap/sublime";
import PropTypes from "prop-types";
import React, { ErrorInfo } from "react";
import SplitPane from "./SplitPane";
import Editor2 from "./Editor2";
import DiffEditor from "./DiffEditor";
import RemoteFileService from "../coevolutionService/file";
import { PT as P } from "../containers/MultiCodeContainer";

type S = {
  mode: P["mode"];
};

enum Orientation {
  vertical,
  horizontal,
}

export type File = {
  repository: string;
  commitId: string;
  file: any;
};

export type Range = File & {
  start: number;
  end: number;
  type: string;
};

export enum Marking {
  from = "marked-evo-from",
  to = "marked-evo-to",
  impacted = "marked-impacted",
}

export type Marked = Range & { marking: Marking };

export type Diff =
  | {
      before: Marked;
      after: Marked;
    }
  | {
      before: File;
      after: Marked;
    }
  | {
      before: Marked;
      after: File;
    };

type Layout =
  | {
      split: Orientation;
      content: Layout[];
    }
  | Diff
  | Marked;

type Evolution = {
  type: string;
  before: (Range & { description: string })[];
  after: (Range & { description: string })[];
};

function isQuasiBinary(
  e: Evolution
): e is {
  type: string;
  before: [Range & { description: string }];
  after: [Range & { description: string }];
} {
  if (e.before.length !== 1 && e.after.length !== 1) {
    return false;
  }
  const b = e.before[0],
    a = e.after[0];
  if (b === undefined || a === undefined) {
    return false;
  }
  return b.repository === a.repository && b.file === a.file;
}

function flattenEvo(
  evolution: Evolution,
  beforC: string,
  afterC: string
): Diff[] {
  if (evolution.before.length === 0) {
    return extractAfter(evolution.after, beforC);
  } else if (evolution.after.length === 0) {
    return extractBefore(evolution.before, afterC);
  } else if (isQuasiBinary(evolution)) {
    return [
      {
        before: {
          ...evolution.before[0],
          marking: Marking.from,
        },
        after: {
          ...evolution.after[0],
          marking: Marking.to,
        },
      },
    ];
  } else {
    return [
      ...extractBefore(evolution.before, afterC),
      ...extractAfter(evolution.after, beforC),
    ];
  }
}

function extractBefore(
  before: Range[],
  afterC: string,
  mark = Marking.from
): Diff[] {
  return before.map((x) => {
    return {
      before: {
        ...x,
        marking: mark,
      },
      after: {
        repository: x.repository,
        file: x.file,
        commitId: afterC,
      },
    };
  });
}

function extractAfter(
  after: Range[],
  beforC: string,
  mark = Marking.to
): Diff[] {
  return after.map((x) => {
    return {
      before: {
        repository: x.repository,
        file: x.file,
        commitId: beforC,
      },
      after: {
        ...x,
        marking: mark,
      },
    };
  });
}

function evolutions2Layout(
  evolutions: Evolution[],
  beforC: string,
  afterC: string
): Layout {
  // for (const evolution of evolutions) {
  //   flattenEvo(evolution,beforC,afterC);
  // }
  return {
    split: Orientation.horizontal,
    content: evolutions
      .map((evolution) => flattenEvo(evolution, beforC, afterC))
      .reduce((x, acc) => [...acc, ...x], []),
  };
}

export type EvoImp = {
  evolutions: Evolution[];
  impactsBefore: Range[];
  impactsAfter: Range[];
};

function evoImp2Layout(evoImp: EvoImp, beforC: string, afterC: string): Layout {
  // for (const evolution of evolutions) {
  //   flattenEvo(evolution,beforC,afterC);
  // }
  return {
    split: Orientation.vertical,
    content: [
      {
        split: Orientation.horizontal,
        content: evoImp.evolutions
          .map((evolution) => flattenEvo(evolution, beforC, afterC))
          .reduce((x, acc) => [...acc, ...x], []),
      },
      {
        split: Orientation.horizontal,
        content: [
          // ...extractBefore(evoImp.impactsBefore, afterC, Marking.impacted),
          ...evoImp.impactsBefore.map((x) =>
            Math.random() > 0.5
              ? {
                  ...x,
                  marking: Marking.impacted,
                }
              : {
                  before: {
                    ...x,
                    marking: Marking.impacted,
                  },
                  after: {
                    repository: x.repository,
                    file: x.file,
                    commitId: afterC,
                  },
                }
          ),
          // ...extractAfter(evoImp.impactsAfter, beforC, Marking.impacted),
          ...evoImp.impactsAfter.map((x) =>
            Math.random() > 0.5
              ? {
                  ...x,
                  marking: Marking.impacted,
                }
              : {
                  before: {
                    repository: x.repository,
                    file: x.file,
                    commitId: beforC,
                  },
                  after: {
                    ...x,
                    marking: Marking.impacted,
                  },
                }
          ),
        ],
      },
    ],
  };
}

function resize() {
  PubSub.publish("PANEL_RESIZE", undefined);
}

function Pane({
  layout,
  mode,
  docs = {},
  keyS = "0",
  error,
}: {
  layout: Layout;
  mode: any;
  docs?: any;
  keyS?: string;
  error?: Error;
}) {
  if ("split" in layout) {
    if (layout.content.length <= 2) {
      return (
        <SplitPane
          key={keyS + ".sp"}
          className="splitpane"
          vertical={layout.split === Orientation.horizontal}
          onResize={resize}
        >
          {layout.content.map((x, i) => (
            <Pane
              layout={x}
              docs={docs}
              key={keyS + "." + i}
              keyS={keyS + "." + i}
              mode={mode}
            ></Pane>
          ))}
        </SplitPane>
      );
    } else {
      return (
        <SplitPane
          key={keyS + ".sp"}
          className="splitpane"
          vertical={layout.split === Orientation.horizontal}
          onResize={resize}
        >
          {
            <Pane
              layout={{
                split: layout.split,
                content: layout.content.slice(0, layout.content.length / 2),
              }}
              docs={docs}
              key={keyS + "." + 0}
              keyS={keyS + "." + 0}
              mode={mode}
              error={error}
            ></Pane>
          }
          {
            <Pane
              layout={{
                split: layout.split,
                content: layout.content.slice(layout.content.length / 2),
              }}
              docs={docs}
              key={keyS + "." + 1}
              keyS={keyS + "." + 1}
              mode={mode}
              error={error}
            ></Pane>
          }
        </SplitPane>
      );
    }
  } else if ("before" in layout && "after" in layout) {
    // TODO enable wrapping in codemirrors
    return (
      <DiffEditor
        key={keyS + ".de"}
        // {...this.props}
        value={"Getting content..."}
        oldValue={"Getting content..."}
        // value={x.after.content}
        // oldvalue={x.before.content}
        ref={async (y) => {
          if (y) {
            // TODO get back old doc and memoize them (with React? )
            y.setMirrorsValue({
              before: {
                ...layout.before,
                doc: await getContent(
                  {
                    ...layout.before,
                    // x.before.repo,
                    // x.before.commitId,
                    // x.before.path,
                  },
                  mode,
                  docs
                ),
              },
              after: {
                ...layout.after,
                doc: await getContent(
                  {
                    ...layout.after,
                    // x.after.repo,
                    // x.after.commitId,
                    // x.after.path,
                  },
                  mode,
                  docs
                ),
              },
            });
          }
          return y;
        }}
        mode={mode}
        error={error}
      />
    );
  } else if ("file" in layout) {
    return (
      <Editor2
        key={keyS + ".e"}
        value={"Getting content..."}
        ref={async (y) => {
          if (y) {
            const content = await getContent(
              {
                ...layout,
                // x.repo,
                // x.commitId,
                // x.path,
              },
              mode,
              docs
            );
            y.setMirrorValue({
              ...layout,
              doc: content,
            });
          }
          return y;
        }}
        mode={mode}
        error={error}
      />
    );
  } else {
    return null;
  }
}

export default function MultiEditor({
  selectedEvolutions,
  impactsBefore,
  impactsAfter,
  getEvolution,
  instance,
  mode,
  error,
}: P) {
  if (selectedEvolutions === undefined) {
    return null;
  } else {
    const red = selectedEvolutions.reduce((acc, b, i) => {
      if (b) {
        const evo = getEvolution(i);
        if (evo) {
          acc.push(evo);
        }
      }
      return acc;
    }, [] as any[]);
    if (
      red.length > 0 &&
      (Object.keys(impactsBefore).length <= 0 ||
        Object.keys(impactsBefore).length <= 0)
    ) {
      return (
        <Pane
          layout={evolutions2Layout(
            red.slice(0, Math.min(red.length, 8)),
            instance.commitIdBefore || "",
            instance.commitIdAfter
          )}
          mode={mode}
          error={error}
        ></Pane>
      );
    } else {
      const iB = Object.values(impactsBefore);
      const iA = Object.values(impactsAfter);
      return (
        <Pane
          layout={evoImp2Layout(
            {
              evolutions: red.slice(0, Math.min(red.length, 6)),
              impactsBefore: iB.slice(0, Math.min(iB.length, 6)),
              // impactsBefore: iB.slice(0,Math.min(Math.ceil((iB.length/ (iB.length+iA.length)*iB.length)),6)),
              impactsAfter: iA.slice(
                0,
                Math.min(
                  Math.ceil((iA.length / (iB.length + iA.length)) * iA.length),
                  6
                )
              ),
            },
            instance.commitIdBefore || "",
            instance.commitIdAfter
          )}
          mode={mode}
          error={error}
        ></Pane>
      );
    }
  }
}

class MultiEditor0 extends React.Component<P, S> {
  constructor(props: P) {
    super(props);
    this.state = {
      mode: props.mode,
    };
    // this._layoutRenderer = this._layoutRenderer.bind(this);
  }

  shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>) {
    return true;
  }

  componentDidCatch?(error: Error, errorInfo: ErrorInfo) {}

  componentDidMount() {
    // document.title = `You clicked ${this.state.count} times`;
    // ChatAPI.subscribeToFriendStatus(
    //   this.props.friend.id,
    //   this.handleStatusChange
    // );
  }

  componentDidUpdate() {
    // document.title = `You clicked ${this.state.count} times`;
  }

  componentWillUnmount() {
    // ChatAPI.unsubscribeFromFriendStatus(
    //   this.props.friend.id,
    //   this.handleStatusChange
    // );
  }

  handleStatusChange(status) {
    // this.setState({
    //   isOnline: status.isOnline,
    // });
  }

  render() {
    // if (this.state.isOnline === null) {
    //   return "Loading...";
    // }
    // return this.state.isOnline ? "Online" : "Offline";
    return <p>aaaa</p>;
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
    mode: "javascript",
    keyMap: "default",
    onContentChange: (x) => {},
    onActivity: () => {},
  };
}

const fileHandler = {
  id: "default",
  processFile(json) {
    if (json.error) {
      throw new Error(json.error);
    } else {
      return json;
    }
  },
};

export async function getContent(
  { repository, commitId, file }: File,
  mode: string,
  docs: { [k: string]: CodeMirror.Doc }
) {
  const k = repository + '/' + commitId + '/' + file;
  const doc = docs[k];
  return (
    (doc && doc.linkedDoc({ mode })) ||
    RemoteFileService(fileHandler, {
      repo: repository,
      commitId,
      path: file,
    })
      .then((x) => {
        const doc = docs[k];
        return (docs[k] =
          (doc && doc.linkedDoc({ mode })) || CodeMirror.Doc(x.content, mode));
      })
      .catch((x) => {
        // console.error(x)
        return x.name + ": " + x.message;
      })
  );
}
