import api from "./apiV2";
import { stringify } from "query-string";
import defaultDifferInterface from "../parsers/utils/defaultDifferInterface";
import { v1 as uuidv1 } from 'uuid';

/**
 * 
 * @param {defaultDifferInterface} differ 
 * @param {any} query can be nested when using PUT request
 * @param {RequestInit} options 
 */
export default async function RemoteImpactService(differ, query, options = {}) {
    const response = await api(
        `/impact/${'default'}`, {
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
        const res = {}
        if (differ.processImpacts)
            res.value = differ.processImpacts(json)
        res.uuid = uuidv1()
        return res
    }
    switch (response.status) {
        case 404:
            throw new Error();
        default:
            throw new Error('Unknown error.');
    }
}