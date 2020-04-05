import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import shallowEqual from 'shallowequal';
// import deepEqual from 'deep-equal';

class NodeHeader extends Component {
    shouldComponentUpdate(nextProps) {
        const props = this.props;
        const nextPropKeys = Object.keys(nextProps);

        for (let i = 0; i < nextPropKeys.length; i++) {
            const key = nextPropKeys[i];
            if (key === 'animations') {
                continue;
            }

            // const isEqual = shallowEqual(props[key], nextProps[key]);
            // if (!isEqual) {
            return true;
            // }
        }

        // return !deepEqual(props.animations, nextProps.animations, {strict: true});
        return true
    }

    render() {
        const {
            node, onClick, onDblClick
        } = this.props;
        return (
            <div onClick={onClick} onDoubleClick={onDblClick}>
                {node.name}
            </div>
        );
    }
}

NodeHeader.propTypes = {
    node: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onDblClick: PropTypes.func
};

NodeHeader.defaultProps = {
    customStyles: {}
};

export default NodeHeader;