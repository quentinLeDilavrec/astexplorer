export default class StorageHandler {
  constructor(backends) {
    this._backends = backends;
  }

  _first() {
    return this._backends[0];
  }

  _owns(revision) {
    for (const backend of this._backends) {
      if (backend.owns(revision)) {
        return backend;
      }
    }
    return null;
  }

  updateHash(revision) {
    global.location.hash = revision.getPath();
  }

  fetchFromURL() {
    if (/^#?\/?$/.test(global.location.hash)) {
      return Promise.resolve(null);
    }
    for (const backend of this._backends) {
      if (backend.matchesURL()) {
        return backend.fetchFromURL();
      }
    }
    return Promise.reject(new Error('Unknown URL format.'));
  }

  /**
   * Create a new snippet.
   * @param {*} data 
   */
  create(data) {
    for (const backend of this._backends) {
        return backend.create(data);
    }
  }

  /**
   * Update an existing snippet.
   */
  update(revision, data) {
    this._owns(revision).update(revision, data);
  }

  /**
   * Fork existing snippet.
   */
  fork(revision, data) {
    this._owns(revision).fork(revision, data);
  }
}
