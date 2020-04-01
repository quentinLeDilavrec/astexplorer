import PropTypes from 'prop-types';
import React from 'react';

export default class SettingsDialog extends React.Component {
  constructor(props) {
    super(props);
    this._outerClick = this._outerClick.bind(this);
    this._onChange = this._onChange.bind(this);
    this._reset = this._reset.bind(this);
    this._saveAndClose = this._saveAndClose.bind(this);
    this.state = {
      toolSettings: this.props.toolSettings,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({toolSettings: nextProps.toolSettings});
  }

  _outerClick(event) {
    if (event.target === document.getElementById('SettingsDialog')) {
      this._saveAndClose();
    }
  }

  _onChange(newSettings) {
    this.setState({toolSettings: newSettings});
  }

  _saveAndClose() {
    this.props.onSave(this.props.category, this.state.toolSettings);
    this.props.onWantToClose();
  }

  _reset() {
    this.setState({toolSettings: {}});
  }

  render() {
    if (this.props.visible && this.props.tool.renderSettings) {
      return (
        <div id="SettingsDialog" className="dialog" onClick={this._outerClick}>
          <div className="inner">
            <div className="header">
              <h3>{this.props.tool.displayName} Settings</h3>
            </div>
            <div className="body">
              {this.props.tool.renderSettings(
                this.state.toolSettings,
                this._onChange,
              )}
            </div>
            <div className="footer">
              <button style={{marginRight: 10}} onClick={this._reset}>
                Reset
              </button>
              <button onClick={this._saveAndClose}>Close</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}

SettingsDialog.propTypes = {
  onSave: PropTypes.func,
  onWantToClose: PropTypes.func,
  visible: PropTypes.bool,
  tool: PropTypes.object.isRequired,
  toolSettings: PropTypes.object,
};
