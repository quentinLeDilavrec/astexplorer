// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

// import defaultTheme from './themes/default';
// import defaultAnimations from './themes/animations';
import { v1 as uuid } from 'uuid';
// import {Ul} from './common';
// import defaultDecorators from './Decorators';
import TreeNode, {FileTreeNode} from './TreeNode';

// inspired by react-treebread as it was not maintained anymore


/**
 * @typedef {FileTreeNode | FileTreeNode[]} FileTreeInput
 */

/**
 * @exports FileTreeInput
 */

/**
 * @type {FileTreeInput}
 */
export const dummyInput = [];


const defaultTheme = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: '#21252B',
            margin: 0,
            padding: 0,
            color: '#9DA5AB',
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            fontSize: '14px'
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                background: '#31363F'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#9DA5AB',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: '#9DA5AB'
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: '#E2C089'
            }
        }
    }
};

const defaultAnimations = {
    toggle: ({ node: { toggled } }, duration = 300) => ({
        animation: { rotateZ: toggled ? 90 : 0 },
        duration: duration
    }),
    drawer: (/* props */) => ({
        enter: {
            animation: 'slideDown',
            duration: 300
        },
        leave: {
            animation: 'slideUp',
            duration: 300
        }
    })
};

/**
 * 
 * @param {{
 * data:FileTreeInput,
 * onToggle:(node: FileTreeNode, toggled:boolean)=>void,
 * onSelect:(node: FileTreeNode)=>void,
 * }} param0 
 */
const FileTree = ({
    data, onToggle, onSelect,
}) => (<ul className="file-tree">
    {(data instanceof Array ? data : [data]).map(node => (
        <TreeNode
            node={node}
            onToggle={onToggle}
            onSelect={onSelect}
            key={node.id || uuid()}
        />
    ))}
</ul>);

FileTree.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]).isRequired,
    onToggle: PropTypes.func,
    onSelect: PropTypes.func,
    decorators: PropTypes.object
};

export default FileTree;
