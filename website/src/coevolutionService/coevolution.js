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
export default async function RemoteEvolutionService(differ, query, options = {}) {
    const response = await api(
        `/coevolution/${'default'}`, {
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
        res.value = json
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