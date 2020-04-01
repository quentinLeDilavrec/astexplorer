import React from 'react';
import defaultParserInterface from './defaultParserInterface';

/**
 * The minimal interface that every differ must implement. This object provides
 * default values/implementations. Methods/properties that must be provided
 * by the differ are mentioned in comments.
 */
export default {
  ...defaultParserInterface, // all things related to ast in the diff view

  // loadDiffer
  // diff

};
