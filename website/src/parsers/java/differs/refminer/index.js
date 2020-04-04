import defaultDifferInterface from '../../../utils/defaultDifferInterface';

const ID = 'RefactoringMiner';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/tsantalis/RefactoringMiner';

function addSide(op) { // TODO remove it
  op.leftSideLocations.map(x => x.side = "left")
  op.rightSideLocations.map(x => x.side = "right")
}

export default {
  ...defaultDifferInterface,
  id: ID,
  displayName: ID,
  version: VERSION,
  homepage: HOMEPAGE,
  locationProps: new Set(['loc', 'start', 'end', 'side']),
  typeProps: new Set(['type', 'codeElementType'/*, 'node type'*/]),
  // _ignoredProperties: new Set(['loc', 'side']),

  // opensByDefault(_node, _key) {
  //   return _key === "actions";
  // },

  processEvolutions(evolutions) {
    const res = evolutions.commits;
    res.forEach(x => x.refactorings.forEach(addSide))
    return res
  },

  processImpacts(impacts) {
    return impacts || { perRoot: [], roots: [], tests: [] }
  },

  async diff(differ, old, neww) {
    return await differ(old, neww)
  },

  nodeToRange(node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end];
    }
  },

  getDefaultOptions() {
    return {
      evolutions: {
        'Move Method': true,
        'Rename Method': true,
      },
    };
  },
  _getSettingsConfiguration(defaultOptions) {
    return {
      fields: [
        {
          key: 'evolutions',
          title: 'Evolutions',
          fields: Object.keys(defaultOptions.evolutions),
          settings:
            settings => settings.evolutions || { ...defaultOptions.evolutions },
        }
      ],
    };
  },
};
