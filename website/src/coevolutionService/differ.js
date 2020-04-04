import api from "./api";
import { stringify } from "query-string";
import defaultDifferInterface from "../parsers/utils/defaultDifferInterface";
import { v1 as uuidv1 } from 'uuid';

/**
 * 
 * @param {defaultDifferInterface} differ 
 * @param {any} query 
 * @param {RequestInit} options 
 */
export default async function RemoteDifferService(differ, query, options = {}) {
    const response = await api(
        `/diff/${differ.id}`, {
        // `/diff/${differ.id}/${stringify(query)}`, {
        method: 'PUT',
        body: JSON.stringify(query),
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (response.ok) {
        const json = await response.json();
        if (differ.processEvolutions && json.diff)
            json.diff = differ.processEvolutions(json.diff)
        if (differ.processImpacts)
        json.impact = differ.processImpacts(json.impact)
        json.uuid = uuidv1()
        return json
    }
    switch (response.status) {
        case 404:
            throw new Error();
        default:
            throw new Error('Unknown error.');
    }
}