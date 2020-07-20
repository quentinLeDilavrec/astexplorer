import PropTypes from 'prop-types';
import React, { Component } from 'react'
import * as d3 from 'd3'
import PubSub from 'pubsub-js';
import cx from 'classnames';
import visualizations from './graph';

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

export default function EvoGraphOutput({
  position = null,
  result = {},
  status = '?',
  uuid,
  onSelection,
  returnScreenShot }) {
  const [selectedOutput, setSelectedOutput] = useState(0);
  let output;
  let onScreenShot
  if (result.error) {
    output =
      <div style={{ padding: 20 }}>
        {result.error.message}
      </div>;
  } else if (result.graph) {
    output = (
      <ErrorBoundary>
        {
          React.createElement(
            visualizations[selectedOutput],
            {
              graph: result.graph, position, onSelection, uuid,
              onScreenShot: x => onScreenShot = x, returnScreenShot
            },
          )
        }
      </ErrorBoundary>
    )
  }

  let buttons = visualizations.map(
    (cls, index) =>
      <button
        key={index}
        value={index}
        onClick={event => setSelectedOutput(event.target.value)}
        className={cx({
          active: selectedOutput == index,
        })}>
        {cls.name}
      </button>,
  );
  return (
    <div className="output highlight">
      <div className="toolbar">
        {buttons}
        <span className="fa fa-camera time"
          onClick={(...x) => onScreenShot(...x)}>
        </span>
        <span className="time">
          {betterLoadingDisplay(formatTime(result.time), status)}
        </span>
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

class ErrorBoundary extends React.Component {
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
          An error was caught while rendering the Graph. This usually is an issue with
          astexplorer itself. Have a look at the console for more information.
          Consider <a href="https://github.com/quentinLeDilavrec/astexplorer/issues/new?template=bug_report.md">filing a bug report</a>, but <a href="https://github.com/fkling/astexplorer/issues/">check first</a> if one doesn&quot;t already exist. Thank you!
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

