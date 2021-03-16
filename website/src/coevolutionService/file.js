import api from "./apiV1";
import { stringify } from "query-string";

/**
 * @typedef {Object} FileQuery
 * @property {string} repo
 * @property {string} commitId
 * @property {string} path
 */

/**
 * @template T
 * @param {{
    id: string;
    processFile(json: any): T;
}} fileHandler 
 * @param {FileQuery} query 
 * @param {RequestInit} options 
 * @return {Promise<T>}
 */
export default async function RemoteFileService(fileHandler, query, options = {}) {
    const response =
        (options.method === "PUT") ?
            await api(
                `/data/${fileHandler.id}`, {
                method: 'PUT',
                body: JSON.stringify(query),
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {}),
                },
            })
            :
            await api(`/data/${fileHandler.id}?${stringify(query)}`, {
                method: 'GET',
                // cache:'no-cache',
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {}),
                },
            });
    if (response.ok) {
        let res = await response.json();
        if (fileHandler.processFile)
            res = fileHandler.processFile(res)
        return res
    }
    switch (response.status) {
        case 404:
            throw new Error(response.statusText);
        default:
            throw new Error('Unknown error.');
    }
}