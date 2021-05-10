import PropTypes from "prop-types";
import React, { Component } from "react";
import * as d3 from "d3";
import PubSub from "pubsub-js";
import cx from "classnames";
import visualizations from "./graph";
import { PT } from "../containers/GraphOutputContainer";

const { useState } = React;

function formatTime(time) {
  if (!time) {
    return null;
  }
  if (time < 1000) {
    return `${time}ms`;
  }
  return `${(time / 1000).toFixed(2)}s`;
}

function betterLoadingDisplay(time, status) {
  if (time !== null) {
    return time;
  }
  // TODO update title depending on progress, use pubSub? or update react component?
  return <i className="fa fa-lg fa-spinner fa-pulse" title={status}></i>;
}

function returnScreenShot(svg: BlobPart) {
  const type = "image/svg+xml";
  let file = new Blob([svg], { type });
  let a = document.createElement("a"),
    url = URL.createObjectURL(file);
  a.href = url;
  a.download = "graph.svg";
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function makeArgs(
  { position, result, uuid, onSelection, 
    getSelectedEvolutionsIds,
    getSelectedImpactedRanges, }: PT,
  setScreenShotHandler: (x: any) => any,
  setReCenteringHandler: (x: any) => any
) {
  return {
    graph: result.graph,
    position,
    onSelection,
    uuid,
    setScreenShotHandler,
    setReCenteringHandler,
    returnScreenShot,
    getSelectedEvolutionsIds,
    getSelectedImpactedRanges,
  } as const;
}

export type GraphP = ReturnType<typeof makeArgs>;

export default function EvoGraphOutput(props: PT) {
  const { position, result, status, uuid, onSelection } = props;
  const [selectedOutput, setSelectedOutput] = useState(0);
  let output: JSX.Element;
  const [onScreenShot, setScreenShotHandler] = React.useState<
    React.DOMAttributes<HTMLSpanElement>["onClick"] | undefined
  >(undefined);
  const [onReCentering, setReCenteringHandler] = React.useState<
    React.DOMAttributes<HTMLSpanElement>["onClick"] | undefined
  >(undefined);
  if (result.error) {
    output = <div style={{ padding: 20 }}>{result.error.message}</div>;
  } else if (result.graph) {
    const sv = visualizations[selectedOutput];
    if (!sv) {
      throw null;
    }

    output = (
      <ErrorBoundary>
        {React.createElement(
          sv,
          makeArgs(props, (x)=> setScreenShotHandler(()=>x), (x)=> setReCenteringHandler(()=>x))
        )}
      </ErrorBoundary>
    );
  } else {
    return null;
  }

  let buttons = visualizations.map((cls, index) => (
    <button
      key={index}
      value={index}
      onClick={(event) => setSelectedOutput(index)} //event.target.value)}
      className={cx({
        active: selectedOutput == index,
      })}
    >
      {cls.name}
    </button>
  ));
  function handleOnScreenShot(...x:[event: React.MouseEvent<HTMLSpanElement, MouseEvent>]) {
    return onScreenShot && onScreenShot(...x)
  }
  let afterB:HTMLButtonElement
  let isAfter = false
  return (
    <div className="output highlight">
      <div className="toolbar">
        {buttons}
        <span className="time">
          {betterLoadingDisplay(formatTime(result.time), status)}
        </span>
        <span
          className="fa fa-camera time"
          onClick={handleOnScreenShot}
        ></span>
        <span
          className="fa fa-arrows-alt time"
          onClick={(...x) => {
            return onReCentering && onReCentering(...x);
          }}
        ></span>
        <button
          className="time"
          style={{
            minWidth: '1px',
            height: '20px',
            backgroundColor: 'lightgray',
            }}
          onClick={x=> {
            if (isAfter) {
              isAfter = false
              afterB.style.backgroundColor = "lightgray"
            } else {
              isAfter = true
              afterB.style.backgroundColor = "darkgray"
            }}}
          ref={(x) => (x ? (afterB = x) : undefined)}
        >after</button>
      </div>
      {output}
    </div>
  );
}

EvoGraphOutput.propTypes = {
  result: PropTypes.object,
  status: PropTypes.string,
  uuid: PropTypes.string,
  onSelection: PropTypes.func,
  onScreenShot: PropTypes.func,
  returnScreenShot: PropTypes.func,
};

class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: 20 }}>
          An error was caught while rendering the Graph. This usually is an
          issue with astexplorer itself. Have a look at the console for more
          information. Consider{" "}
          <a href="https://github.com/quentinLeDilavrec/astexplorer/issues/new?template=bug_report.md">
            filing a bug report
          </a>
          , but{" "}
          <a href="https://github.com/fkling/astexplorer/issues/">
            check first
          </a>{" "}
          if one doesn&quot;t already exist. Thank you!
        </div>
      );
    }
    return this.props.children;
  }

  static propTypes = {
    children: PropTypes.node,
  };
}
