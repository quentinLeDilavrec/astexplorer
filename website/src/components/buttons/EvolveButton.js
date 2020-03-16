import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import {getDifferByID} from '../../parsers';

export default class EvolveButton extends React.Component {
  constructor(props) {
    super(props);
    this._onClick = this._onClick.bind(this);
    this._onToggle = this._onToggle.bind(this);
  }

  _onClick({target}) {
    let differID;
    if (target.nodeName.toLowerCase() === 'li') {
      differID = target.children[0].value;
    } else {
      differID = target.value;
    }
    this.props.onDiffChange(getDifferByID(differID));
  }

  _onToggle() {
    if (this.props.differ) {
      this.props.onDiffChange(null);
    }
  }

  render() {
    return (
      <div className={cx({
        button: true,
        menuButton: true,
        disabled: !this.props.category.differs.length,
      })}>
        <button
          type="button"
          onClick={this._onToggle}
          disabled={!this.props.category.differs.length}>
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-toggle-off': !this.props.showDiffer,
              'fa-toggle-on': this.props.showDiffer,
              'fa-fw': true,
            })}
          />
          &nbsp;Evolve
        </button>
        {!!this.props.category.differs.length && <ul>
          {this.props.category.differs.map(differ => (
            <li
              key={differ.id}
              className={cx({
                selected: this.props.showDiffer &&
                  this.props.differ === differ,
              })}
              onClick={this._onClick}>
              <button value={differ.id} type="button" >
                {differ.displayName}
              </button>
            </li>
          ))}
        </ul>}
      </div>
    );
  }
}

EvolveButton.propTypes = {
  category: PropTypes.object,
  differ: PropTypes.object,
  showDiffer: PropTypes.bool,
  onNewChange: PropTypes.func,
};
