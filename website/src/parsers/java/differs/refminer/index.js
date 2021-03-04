import defaultDifferInterface from '../../../utils/defaultDifferInterface';
import RefactoringTypes from "../../../../coevolutionService/utils/RefactoringTypes.json";
import React from 'react';
import SettingsRenderer from '../../../utils/SettingsRenderer';

const ID = 'RefactoringMiner';
const VERSION = '0.0.0';
const HOMEPAGE = 'https://github.com/tsantalis/RefactoringMiner';

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
    const res = evolutions;
    res.forEach(addSide)
    res.forEach(
      ({before,after, content},i) => 
      res[i] = {before, after, ...content})
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
    const evolutions = {}
    for (const key in RefactoringTypes2) {
      if (RefactoringTypes2.hasOwnProperty(key)) {
        const element = RefactoringTypes2[key]
        evolutions[key] =
          element.before.some(x => x.keys.method || x.keys.class) &&
          !element.before.some(x => x.many) &&
          !element.after.some(x => x.many)
      }
    }
    const keywords = {}
    for (const key in RefactoringsByKeyword) {
      if (RefactoringsByKeyword.hasOwnProperty(key)) {
        if (Object.keys(RefactoringsByKeyword[key]).length < 4) continue
        if (Object.keys(RefactoringsByKeyword[key]).length >= 18) continue
        keywords[key] = false
      }
    }
    debugger
    return {
      evolutions,
      keywords,
    };
  },

  _getSettingsConfiguration(defaultOptions, settings, onChange) {
    function betterDisplayName(x) {
      return ((defaultOptions.evolutions[x] && defaultOptions.evolutions[x].title) ||
        x.split('_').map(x => x[0].toUpperCase() + x.substring(1).toLowerCase()).join(' '))
    }
    return {
      fields: [
        {
          key: 'keywords',
          title: 'evolutions by keywords',
          fields: Object.keys(defaultOptions.keywords),
          settings:
            settings => mapObject(settings.keywords || { ...defaultOptions.keywords },
              (k, v) => [k, v]),
          update:
            (_, name, value) => {
              const forced = {}
              Object.keys(RefactoringsByKeyword[name]).forEach(x => forced[x] = value)
              console.log(forced)
              const keywords = { ...settings.keywords }
              keywords[name] = value
              onChange({
                ...settings,
                keywords,
                evolutions: {
                  ...settings.evolutions,
                  ...forced,
                }
              })
              return _
            },
        },
        {
          key: 'evolutions',
          title: 'Evolutions',
          fields: Object.keys(defaultOptions.evolutions).map(betterDisplayName),
          settings:
            settings => mapObject(settings.evolutions || { ...defaultOptions.evolutions },
              (k, v) => [betterDisplayName(k), v]),
        },
        {
          key: 'other',
          title: 'other',
          fields: ['only keep 1-1'],
          settings:
            settings => ({'only keep 1-1':false}),
          update:
            (_, name, value) => {
              const forced = {}
              for (const key in RefactoringTypes2) {
                if (RefactoringTypes2.hasOwnProperty(key)) {
                  const element = RefactoringTypes2[key]
                  const isMany = element.before.some(x => x.many) ||
                    element.after.some(x => x.many)
                    if (isMany) {
                      forced[key] = false
                    }
                }
              }
              onChange({
                ...settings,
                evolutions: {
                  ...settings.evolutions,
                  ...forced,
                }
              })
              return _
            },
        },
      ],
    };
  },
  /**
 * This method is called when the settingds UI is rendered. It is passed the
 * current parser settings and a callback that should be called with the
 * updated settings object.
 */
  renderSettings(settings, onChange) {
    const defaultOptions = this.getDefaultOptions();
    let changed = false
    settings = settings == null ?
      defaultOptions :
      this._mergeDefaultOptions(settings, defaultOptions);

    const settingsConfiguration = this._getSettingsConfiguration(
      defaultOptions,
      settings,
      // NOT RLY WORKING, make a SettingsRenderer2
      x => (console.log(6464, x), changed = true, onChange(x))
    );
    if (!settingsConfiguration) {
      return null;
    }
    console.log(1656, settings)
    return (
      <SettingsRenderer
        settingsConfiguration={settingsConfiguration}
        settings={settings}
        onChange={x => changed ? console.log(x) : onChange(x)}
      />
    );
  },
};

function mapObject(obj, fct) {
  const r = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const [k, v] = fct(key, obj[key])
      r[k] = v
    }
  }
  return r
}

function addSide(op) { // TODO remove it
  op.before.map(x => x.side = "left")
  op.after.map(x => x.side = "right")
}

console.log('RefactoringTypes', RefactoringTypes)
const RefactoringTypes2 = {}

function betterSide({ description, many }) {
  const keys = {}
  description.split(' ').forEach(x => keys[x.toLowerCase()] = true)
  return {
    description,
    many,
    keys,
  }
}
for (const key in RefactoringTypes) {
  if (RefactoringTypes.hasOwnProperty(key)) {
    const element = RefactoringTypes[key];
    const o = {
      left: element.left.map(betterSide),
      right: element.right.map(betterSide),
    }
    RefactoringTypes2[key] = o
  }
}
console.log('RefactoringTypes2', RefactoringTypes2, JSON.stringify(RefactoringTypes2))

const FilteredRefactorings = {}


for (const key in RefactoringTypes) {
  if (RefactoringTypes.hasOwnProperty(key)) {
    const element = RefactoringTypes2[key];
    if (!element.left.some(x => x.keys.method || x.keys.class)) continue
    if (element.left.some(x => x.many)) continue
    if (element.right.some(x => x.many)) continue
    FilteredRefactorings[key] = RefactoringTypes[key]
  }
}
console.log('FilteredRefactorings', FilteredRefactorings, JSON.stringify(FilteredRefactorings))

console.log('FilteredRefactorings', FilteredRefactorings, JSON.stringify(Object.keys(FilteredRefactorings)))

const RefactoringsByKeyword = {}

for (const key in RefactoringTypes2) {
  if (RefactoringTypes2.hasOwnProperty(key)) {
    const element = RefactoringTypes2[key]
    for (const kind of element.left) {
      for (const kwkey in kind.keys) {
        if (kind.keys.hasOwnProperty(kwkey)) {
          RefactoringsByKeyword[kwkey] = RefactoringsByKeyword[kwkey] || {}
          RefactoringsByKeyword[kwkey][key] = kind.keys[kwkey] && element
        }
      }
    }
    for (const kind of element.right) {
      for (const kwkey in kind.keys) {
        if (kind.keys.hasOwnProperty(kwkey)) {
          RefactoringsByKeyword[kwkey] = RefactoringsByKeyword[kwkey] || {}
          RefactoringsByKeyword[kwkey][key] = kind.keys[kwkey] && element
        }
      }
    }
  }
}

console.log('RefactoringsByKeyword', RefactoringsByKeyword, JSON.stringify(Object.keys(RefactoringsByKeyword)))