import api from "./apiV1";
import { stringify } from "query-string";
import defaultDifferInterface from "../parsers/utils/defaultDifferInterface";
import { v1 as uuidv1 } from 'uuid';

/**
 * Get precise data of a given request
 * @param {uuidv1|string} id a unique identifier of an already sent request,
 * for a GET request the query is used as an identifier,
 * as it should be considered that the progress of all these request is shared 
 */
export default async function RemoteProgressService(id) {
    const response = await api(`/progress/default/${id}`, {
        method: 'GET',
        cache:'no-cache',
    });
    if (response.ok) {
        const text = await response.text();
        console.log(text)
        return text
    }
    switch (response.status) {
        case 404:
            throw new Error();
        default:
            throw new Error('Unknown error.');
    }
}