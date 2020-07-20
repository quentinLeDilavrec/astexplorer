import 'isomorphic-fetch';

const API_HOST = process.env.API_EVO_HOST || 'http://127.0.0.1:8095';
console.log(API_HOST)

/**
 * 
 * @param {string} path 
 * @param {RequestInit} options 
 */
export default function api(path, options) {
  return fetch(`${API_HOST}/api/v1${path}`, {
    mode:'cors',
    headers: {
      ...options.headers,
    },
    ...options,
  });
}


// const req = await fetch('./foo.json');
// const total = Number(req.headers.get('content-length'));
// let loaded = 0;
// for await(const {length} of req.body.getReader()) {
//   loaded = += length;
//   const progress = ((loaded / total) * 100).toFixed(2); // toFixed(2) means two digits after floating point
//   console.log(`${progress}%`); // or yourDiv.textContent = `${progress}%`;
// }