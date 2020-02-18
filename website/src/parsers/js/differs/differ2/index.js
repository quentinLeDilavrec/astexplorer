import defaultParserInterface from '../../../utils/defaultParserInterface';
// import pkg from 'json-to-ast/package.json';

const ID = 'differ2';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/differ2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,

  loadDiffer(callback) {
    callback(function (old,neww) {
      return {differ:"differ2 not implemeted"};
    });
  },

  async diff(differ, old, neww) {
    return differ(old,neww);
  }
};
