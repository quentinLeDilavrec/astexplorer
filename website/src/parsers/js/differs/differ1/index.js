import defaultParserInterface from '../../../utils/defaultParserInterface';
// import pkg from 'json-to-ast/package.json';

const ID = 'differ1';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/differ1';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,

  loadDiffer(callback) {
    callback(function (old,neww) {
      return {differ:"differ1 not implemeted"};
    });
  },

  async diff(differ, old, neww) {
    return differ(old,neww);
  }
};
