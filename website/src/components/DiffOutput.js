import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import visualizations0 from './visualization';
import {PT} from '../containers/DiffOutputContainer'

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
  // TODO update title depending on advencement, use pubSub? or update react component
  return <i className="fa fa-lg fa-spinner fa-pulse" title={status}></i>;
}

/** @type {any[]} */
const visualizations  = visualizations0

/**
 * 
 * @param {PT} props
 */
export default function DiffOutput(props) {
  const {
    position = null, differ = {},
    status,
    diffAST, 
    onToggleEvo, selectedEvos,
   } = props
  const [selectedOutput, setSelectedOutput] = useState(0);
  const { ast = null } = diffAST;
  let output;
  if (diffAST.error) {
    output =
      <div style={{ padding: 20 }}>
        {diffAST.error.message}
      </div>;
  } else if (ast) {
    output = (
      <ErrorBoundary>
        {
          React.createElement(
            visualizations[selectedOutput],
            { parseResult: diffAST, position,
              onToggleEvo, selectedEvos, 
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
        onClick={(/** @type {any} */event) => {
          return setSelectedOutput(event.target.value)}}
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
        <span className="time">
          {betterLoadingDisplay(formatTime(diffAST.time), status || '?')}
        </span>
      </div>
      {output}
    </div>
  );
}

DiffOutput.propTypes = {
  position: PropTypes.oneOfType([PropTypes.number,PropTypes.object]),
  differ: PropTypes.object,
  status: PropTypes.string,
  diffAST: PropTypes.object,
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
          An error was caught while rendering the AST. This usually is an issue with
          astexplorer itself. Have a look at the console for more information.
          Consider <a href="https://github.com/fkling/astexplorer/issues/new?template=bug_report.md">filing a bug report</a>, but <a href="https://github.com/fkling/astexplorer/issues/">check first</a> if one doesn&quot;t already exist. Thank you!
				</div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

