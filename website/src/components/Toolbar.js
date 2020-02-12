import PropTypes from 'prop-types';
import React from 'react';
import CategoryButton from './buttons/CategoryButton';
import ParserButton from './buttons/ParserButton';
import SnippetButton from './buttons/SnippetButton';
import TransformButton from './buttons/TransformButton';
import KeyMapButton from './buttons/KeyMapButton';
import EvolveButton from './buttons/EvolveButton';

export default function Toolbar(props) {
  let {parser, transformer, differ, showTransformer, showDiffer} = props;
  let parserInfo = parser.displayName;
  let transformerInfo = '';
  let differInfo = '';
  if (parser) {
    if (parser.version) {
      parserInfo += '-' + parser.version;
    }
    if (parser.homepage) {
      parserInfo =
        <a href={parser.homepage} target="_blank" rel="noopener noreferrer">{parserInfo}</a>;
    }
  }
  if (showTransformer) {
    transformerInfo = transformer.displayName;
    if (transformer.version) {
      transformerInfo += '-' + transformer.version;
    }
    if (transformer.homepage) {
      transformerInfo =
        <a href={transformer.homepage} target="_blank" rel="noopener noreferrer">{transformerInfo}</a>;
    }
    transformerInfo = <div>Transformer: {transformerInfo}</div>;
  }

  if (showDiffer) {
    differInfo = differ.displayName;
    if (differ.version) {
      differInfo += '-' + differ.version;
    }
    if (differ.homepage) {
      differInfo =
        <a href={differ.homepage} target="_blank" rel="noopener noreferrer">{differInfo}</a>;
    }
    differInfo = <div>Differ: {differInfo}</div>;
  }

  return (
    <div id="Toolbar">
      <h1>AST Explorer</h1>
      <SnippetButton {...props} />
      <CategoryButton {...props} />
      <ParserButton {...props} />
      <TransformButton {...props} />
      <EvolveButton {...props} />
      <KeyMapButton {...props} />
      <a
        style={{minWidth: 0}}
        target="_blank" rel="noopener noreferrer"
        title="Help"
        href="https://github.com/fkling/astexplorer/blob/master/README.md">
        <i className="fa fa-lg fa-question fa-fw" />
      </a>
      <div id="info" className={transformerInfo || differInfo ? 'small' : ''}>
      <div>Parser: {parserInfo}</div>
        {transformerInfo}
        {differInfo}
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  saving: PropTypes.bool,
  forking: PropTypes.bool,
  onSave: PropTypes.func,
  onFork: PropTypes.func,
  onParserChange: PropTypes.func,
  onParserSettingsButtonClick: PropTypes.func,
  onShareButtonClick: PropTypes.func,
  onTransformChange: PropTypes.func,
  onKeyMapChange: PropTypes.func,
  parser: PropTypes.object,
  transformer: PropTypes.object,
  showTransformer: PropTypes.bool,
  showDiffer: PropTypes.bool,
  canSave: PropTypes.bool,
  canFork: PropTypes.bool,
};
