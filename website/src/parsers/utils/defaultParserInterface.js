import React from 'react';
import defaultInterface from './defaulInterface';

/**
 * The minimal interface that every parser must implement. This object provides
 * default values/implementations. Methods/properties that must be provided
 * by the parser are mentioned in comments.
 */
export default {
  ...defaultInterface,

  // loadParser
  // parse

  /**
   * Those properties of an AST node (object) that provide location information
   * so that they can be hidden in the UI if the option is selected.
   */
  locationProps: new Set(),

  /**
   * Those properties of an AST node (object) that provide node name
   * so that they can be hidden in the UI if the option is selected.
   */
  typeProps: new Set(['type']),

  /**
   * Whether or not the provided node should be automatically expanded.
   */
  opensByDefault(_node, _key) {
    return false;
  },

  /**
   * The start and end indicies of the node in the source text. The return value
   * is an array of form `[start, end]`. This is used for highlighting source
   * text and focusing nodes in the tree.
   */
  nodeToRange(node) {
    return node.range;
  },

  /**
   * A more or less human readable name of the node.
   */
  getNodeName(node) {
    if (node && typeof node.type !== 'object') {
      return node.type;
    }
  },

  /**
   * A generator to iterate over each "property" of the node. Overwriting this
   * function allows a parser to expose information from a node if the node
   * is not implemnted as plain JavaScript object.
   */
  *forEachProperty(node) {
    if (node && typeof node === 'object') {
      for (let prop in node) {
        if (this._ignoredProperties.has(prop)) {
          continue;
        }
        yield {
          value: node[prop],
          key: prop,
          computed: false,
        }
      }
    }
  },

};
