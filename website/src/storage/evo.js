import React from 'react';
import api from './api';
import { getParserByID } from '../parsers';

/**
 * Use the gist system to store Evolutions Revisions instead of Revisions like ./gist.js
 * For now it will only handle repositories and not evos cases from scratch (better to stick closer to ./gist.js),
 * in the same way being able to browse git repos with the standard mode would be fun.
 */


const service_name = "gist" // originaly gist
const service_name_through_website = "evolve" // originaly gist

const website_host = "http://127.0.0.1:8087" // originaly gist https://astexplorer.net

function getIDAndRevisionFromHash() {
  let match = global.location.hash.match(/^#\/evolve\/([^/]+)(?:\/([^/]+))?/);// originaly gist instead of evo like in service_name_through_website
  if (match) {
    return {
      id: match[1],
      rev: match[2],
    };
  }
  return null;
}

function fetchSnippet(snippetID, revisionID = 'latest') {
  return api(
    `/${service_name}/${snippetID}` + (revisionID ? `/${revisionID}` : ''),
    {
      method: 'GET',
    },
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      switch (response.status) {
        case 404:
          throw new Error(`Snippet with ID ${snippetID}/${revisionID} doesn't exist.`);
        default:
          throw new Error('Unknown error.');
      }
    })
    .then(response => new EvoRevision(response));
}

export function owns(snippet) {
  return snippet instanceof EvoRevision;
}

export function matchesURL() {
  return getIDAndRevisionFromHash() !== null;
}

export function fetchFromURL() {
  const data = getIDAndRevisionFromHash();
  if (!data) {
    return Promise.resolve(null);
  }
  return fetchSnippet(data.id, data.rev);
}

/**
 * Create a new evo snippet.
 */
export function create(data) {
  return api(
    `/${service_name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Unable to create snippet.');
    })
    .then(data => new EvoRevision(data));
}

/**
 * Update an existing evo snippet.
 */
export function update(revision, data) {
  // Fetch latest version of snippet
  return fetchSnippet(revision.getSnippetID())
    .then(latestRevision => {
      if (latestRevision.getTransformerID() && !data.toolID) {
        // Revision was updated to *remove* the transformer, hence we have
        // to signal the server to delete the transform.js file
        data.transform = null;
      }
      return api(
        `/${service_name}/${revision.getSnippetID()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Unable to update evo snippet.');
        })
        .then(data => new EvoRevision(data));
    });
}

/**
 * Fork existing evo snippet.
 */
export function fork(revision, data) {
  return api(
    `/${service_name}/${revision.getSnippetID()}/${revision.getRevisionID()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Unable to fork evo snippet.');
    })
    .then(data => new EvoRevision(data));
}

const CONFIG_FILE_NAME = 'config.json';
class EvoRevision {
  constructor(gist) {
    this._gist = gist;
    this._config = JSON.parse(gist.files[CONFIG_FILE_NAME].content);
  }

  canSave() {
    return true;
  }

  getPath() {
    return `/${service_name_through_website}/${this.getSnippetID()}/${this.getRevisionID()}`;
  }

  getSnippetID() {
    return this._gist.id;
  }

  getRevisionID() {
    return this._gist.history[0].version;
  }

  getTransformerID() {
    return this._config.toolID;
  }

  getTransformCode() {
    const transformFile = this._gist.files['transform.js'];
    return transformFile ? transformFile.content : '';
  }

  getParserID() {
    return this._config.parserID;
  }

  getDifferID() {
    return this._config.evoMinerID;
  }

  getCode() {
    if (this._code == null) {
      this._code = getSource(this._config, this._gist) || '';
    }
    return this._code;
  }

  getParserSettings() {
    return this._config.settings[this._config.parserID];
  }

  getDifferSettings() {
    return this._config.settings[this._config.evoMinerID];
  }

  getInstance() {
    return this._config.instance;
  }

  getShareInfo() {
    const snippetID = this.getSnippetID();
    const revisionID = this.getRevisionID();
    return (
      <div className="shareInfo">
        <dl>
          <dt>Current Revision</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`${website_host}/#/${service_name_through_website}/${snippetID}/${revisionID}`}
            />
          </dd>
          <dt>Latest Revision</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`${website_host}/#/${service_name_through_website}/${snippetID}/latest`}
            />
          </dd>
          <dt>Gist</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`https://gist.github.com/${snippetID}/${revisionID}`}
            />
          </dd>
        </dl>
      </div>
    );
  }
}

function getSource(config, gist) {
  switch (config.v) {
    case 1:
      return gist.files['code.js'].content;
    case 2: {
      const ext = getParserByID(config.parserID).category.fileExtension;
      return gist.files[`source.${ext}`].content;
    }
  }
}
