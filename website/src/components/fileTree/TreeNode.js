// @ts-check

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import styled from '@emotion/styled';
// import {isArray, isFunction} from 'lodash';

// import defaultAnimations from '../../themes/animations';
import { v1 as uuid } from 'uuid';
// import {Ul} from '../common';
import NodeHeader from './NodeHeader';
// import Loading from './Loading';

import cx from "classnames";

// const Li = styled('li', {
//     shouldForwardProp: prop => ['className', 'children', 'ref'].indexOf(prop) !== -1
// })(({style}) => style);


/**
 * @typedef {Object} FileTreeNode
 * @property {string} name
 * @property {FileTreeNode[]} [children]
 * @property {string} [id]
 * @property {boolean} [toggled]
 * @property {boolean} [loading]
 */

/**
 * @extends {PureComponent<{node:FileTreeNode, onToggle:(node: FileTreeNode, toggled:boolean)=>void, onSelect:(node: FileTreeNode)=>void,}>}
 */
class TreeNode extends PureComponent {

    onClick() {
        const { node, onToggle } = this.props;
        if (onToggle) {
            onToggle(node, !node.toggled);
        }
    }

    // animations() {
    //     const {animations, node} = this.props;
    //     if (!animations) {
    //         return {
    //             toggle: defaultAnimations.toggle(this.props, 0)
    //         };
    //     }
    //     const animation = Object.assign({}, animations, node.animations);
    //     return {
    //         toggle: animation.toggle(this.props),
    //         drawer: animation.drawer(this.props)
    //     };
    // }

    // decorators() {
    //     const {decorators, node} = this.props;
    //     let nodeDecorators = node.decorators || {};

    //     return Object.assign({}, decorators, nodeDecorators);
    // }

    renderChildren() {
        const {
            node, onToggle, onSelect
        } = this.props;

        if (node.loading) {
            return (<div onClick={e => e.stopPropagation()}><i className="fa fa-lg fa-spinner fa-pulse" title={status}></i>loading</div>)
            // return (
            //     <Loading decorators={decorators} style={style}/>
            // );
        }

        let children = node.children;
        if (!Array.isArray(children)) {
            children = children ? [children] : [];
        }

        return (
            <ul>
                {children.map(child => (
                    <TreeNode
                        onSelect={onSelect}
                        onToggle={onToggle}
                        key={child.id || uuid()}
                        node={child}
                    />
                ))}
            </ul>
        );
    }

    render() {
        const {
            node, onSelect,
        } = this.props;
        let children = node.children;
        if (!Array.isArray(children)) {
            children = children ? [children] : [];
        }
        return (
            <li className={cx({
                fa: true,
                "fa-angle-right": !node.toggled && (children.length !== 0 || node.loading),
                "fa-angle-down": node.toggled && (children.length !== 0 || node.loading),
            })}
            onClick={e => (e.stopPropagation(),children.length === 0 && !node.loading ? onSelect(node) : this.onClick())}>
                <NodeHeader
                    node={node}
                    onClick={e => (e.stopPropagation(), children.length === 0 && !node.loading ? onSelect(node) : this.onClick())}
                    onDblClick={typeof onSelect === 'function' ? (() => onSelect(node)) : undefined}
                />
                {node.toggled ? this.renderChildren() : null}
            </li>
        );
    }
}

TreeNode.propTypes = {
    onSelect: PropTypes.func,
    onToggle: PropTypes.func,
    node: PropTypes.object.isRequired,
};

TreeNode.defaultProps = {
};

export default TreeNode;