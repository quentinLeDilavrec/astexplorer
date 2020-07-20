import api from "./apiV1";
import { stringify } from "query-string";

// DEFFERED need more changes

/**
 * 
 * @param {defaultDifferInterface} parser 
 * @param {any} query 
 * @param {RequestInit} options 
 */
export default async function RemoteParserService(parser, query, options) {
    const response = await api(`/parser/${parser.id}/${stringify(query)}`, {
        method: 'PUT',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (response.ok) {
        let json = await response.json();
        if (parser.processAST)
            json = parser.processAST(json)
        return json
    }
    switch (response.status) {
        case 404:
            throw new Error("error 404");
        default:
            throw new Error('Unknown error :' + response.status);
    }
}