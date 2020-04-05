// @ts-check
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import FileTree from "./fileTree";
import {FileTreeInput} from "./fileTree/FileTree";
import {FileTreeNode} from "./fileTree/TreeNode";

// TODO need to finish coevolutionService/repo.js helper and/or get it from impact/evo analysis results
const dumy_file_system = {
    name: 'root',
    toggled: true,
    children: [
        {
            name: 'parent',
            toggled: true,
            children: [
                { name: 'child1' },
                { name: 'child2' }
            ]
        },
        {
            name: 'loading parent',
            loading: true,
            children: []
        },
        {
            name: 'parent',
            children: [
                {
                    name: 'nested parent',
                    children: [
                        { name: 'nested child 1' },
                        { name: 'nested child 2' }
                    ]
                }
            ]
        }
    ]
};

// TODO need indexing of evolutions and/or get these suggestions from beckend during impact analysis
const dummy_suggestion = [{ name: "aaa" }, { name: "aaa" }, { name: "aaa" }]

export default function FallBackMenu({ error }) {
    return (<div>
        <div className="fa fa-warning content-block">{error}</div>
        <div className="content-block">Suggestions:
      <span style={{ display: "inline-flex" }}>
                <Files data={dummy_suggestion} />
            </span>
        </div>
        <div className="content-block">Path:
      <input defaultValue="src/aaa/bbb.java"></input>
        </div>
        <div className="content-block">File Explorer:
      <span style={{ display: "inline-flex" }}>
                <Files data={dumy_file_system} />
            </span>
        </div>
    </div>);
}

FallBackMenu.propTypes = {
    error: PropTypes.any,
    key: PropTypes.string,
    width: PropTypes.string,
};


/**
 * @extends {PureComponent<{data:FileTreeInput}>}
 */
class Files extends PureComponent {
    /**
     * 
     * @param {{data:FileTreeInput,active:boolean}} props 
     */
    constructor(props) {
        super(props);
        this.state = { data: props.data };
        this.onToggle = this.onToggle.bind(this);
    }

    /**
     * 
     * @param {FileTreeNode} node 
     * @param {*} toggled 
     */
    onToggle(node, toggled) {
        const { cursor, data } = this.state;
        if (cursor) {
            this.setState(() => ({ cursor, active: false }));
        }
        if (node.children) {
            node.toggled = toggled;
        }
        this.setState(() => ({ cursor: node, data: Object.assign({}, data) }));
    }

    render() {
        const { data } = this.state;
        return (<div className="files">
            <FileTree data={data} onToggle={this.onToggle} onSelect={node=>console.log(node)} />
        </div>);
    }
}
Files.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]).isRequired,
};