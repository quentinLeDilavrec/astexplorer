import CoEvolutionsContainer from './coevo/CoEvolution';
import PropTypes from 'prop-types';
import React from 'react';
import PubSub from 'pubsub-js';
import {logEvent} from '../../utils/logger';
import {treeAdapterFromParseResult} from '../../core/TreeAdapter.js';
import {SelectedNodeProvider} from './SelectedNodeContext.js';
import focusNodes from './focusNodes.js'

import './css/tree.css'

const {useReducer, useMemo, useRef, useLayoutEffect} = React;

const STORAGE_KEY = 'tree_settings';

function initSettings() {
  // @ts-ignore
  const storedSettings = global.localStorage.getItem(STORAGE_KEY);
  return storedSettings ?
    JSON.parse(storedSettings) :
    {
      autofocus: true,
      hideFunctions: true,
      hideEmptyKeys: false,
      hideLocationData: false,
      hideTypeKeys: false,
    };
}

function reducer(state, element) {
  const newState = {...state, [element.name]: element.checked};

  // @ts-ignore
  global.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  logEvent(
    'tree_view_settings',
    element.checked ? 'enabled' : 'disabled',
    element.name,
  );

  return newState;
}

function makeCheckbox(name, settings, updateSettings) {
  return (
    <input
      type="checkbox"
      name={name}
      checked={settings[name]}
      onChange={event => updateSettings(event.target)}
    />
  );
}

export default function CoEvoSelect({parseResult, position, onToggleEvo, selectedEvos}) {
  const [settings, updateSettings] = useReducer(reducer, null, initSettings);
  const treeAdapter = useMemo(
    () => treeAdapterFromParseResult(parseResult, settings),
    [parseResult.treeAdapter, settings],
  );
  /** @type {React.MutableRefObject<any>} */
  const rootElement = useRef();

  focusNodes('init');
  useLayoutEffect(() => {
    focusNodes('focus', rootElement);
  });

  return (
    <div className="tree-visualization container">
      <div className="toolbar">
        <label title="Auto open the node at the cursor in the source code">
          {makeCheckbox('autofocus', settings, updateSettings)}
          Autofocus
        </label>
        &#8203;
        {treeAdapter.getConfigurableFilters().map(filter => (
          <span key={filter.key}>
            <label>
              {makeCheckbox(filter.key, settings, updateSettings)}
              {filter.label}
            </label>
            &#8203;
          </span>
        ))}
      </div>
      <div ref={rootElement} onMouseLeave={() => {PubSub.publish('CLEAR_HIGHLIGHT', {});}}>
        <SelectedNodeProvider>
          <CoEvolutionsContainer
            value={parseResult.ast}
            level={0}
            treeAdapter={treeAdapter}
            autofocus={settings.autofocus}
            position={position}
            diff={true}
            selectableEvo={true}
            onToggleEvo={onToggleEvo}
            selectedEvos={selectedEvos}
          />
        </SelectedNodeProvider>
      </div>
    </div>
  );
}

CoEvoSelect.propTypes = {
  parseResult: PropTypes.object,
  position: PropTypes.oneOfType([PropTypes.number,PropTypes.object]),
  onToggleEvo: PropTypes.func,
  selectedEvos: PropTypes.array,
};
