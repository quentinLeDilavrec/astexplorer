import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';

import MonacoEditor from 'react-monaco-editor';
// import * as editor from 'monaco-editor/esm/vs/editor/editor.main';

// import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// import PropTypes from "prop-types";
// import React from "react";
// import { noop, processSize } from "./utils";

const defaultPrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: 'babylon',
};

class MyEditor extends MonacoEditor {

  constructor(props) {
    // debugger
    super(props);
    this.state = {
      value: props.value,// || 'let x = 4', // TODO change it
    };
  }


  shouldComponentUpdate() {
    // debugger
    return false;
  }

  getValue() {
    debugger
    return this.refs.monaco.editor.getValue()
  }


  _setError(error) {
    // debugger
  }
  componentDidMount() {
    // debugger
    super.componentDidMount()
    
    // if (this.props.error) {
    //   this._setError(this.props.error);
    // }
  }

  componentWillUnmount() {
    debugger
    super.componentWillUnmount()
  //   clearTimeout(this._updateTimer);
  //   this._unbindHandlers();
  //   this._markerRange = null;
  //   this._mark = null;
  // //   let containerElement = this.containerElement;
  // //   containerElement.removeChild(containerElement.children[0]);
  //   this.codeMirror = null;
  }

  render() {
    debugger
    const x = super.render();
    console.log(78402,x)
    return x
    // return (
    //   <div className="editor" ref={c => this.containerElement = c}/>
    // );
  }
}

MyEditor.propTypes = {
  ...MonacoEditor.propTypes,
//   highlight: PropTypes.bool,
//   lineNumbers: PropTypes.bool,
//   readOnly: PropTypes.bool,
// //   posFromIndex: PropTypes.func,
//   error: PropTypes.object,
//   mode: PropTypes.string,
// //   enableFormatting: PropTypes.bool,
//   keyMap: PropTypes.string,
};

MyEditor.defaultProps = {
  ...MonacoEditor.defaultProps,
  // theme:"vs-dark",
//   language: "java",
// //   highlight: true,
  // lineNumbers: true,
  // readOnly: false,
  // mode: 'javascript',
  // keyMap: 'default',
};

export default MyEditor;