// Copyright (C) 2007-2017, GoodData(R) Corporation. All rights reserved.

import { get } from 'lodash';
import { delay } from './utils/promise';

import { name as pkgName, version as pkgVersion } from '../package.json';

/**
 * Utility methods. Mostly private
 *
 * @module util
 * @class util
 *
 */

/**
 * Gooddata-js package signature
 * @private
 */
export const thisPackage = { name: pkgName, version: pkgVersion };

/**
 * Create getter function for accessing nested objects
 *
 * @param {String} path Target path to nested object
 * @method getIn
 * @private
 */
export const getIn = (path: string) => (object: any) => get(object, path);

export interface IPollingOptions {
    attempts?: number;
    maxAttempts?: number;
    pollStep?: number;
};

/**
 * Helper for polling
 *
 * @param {String} uri
 * @param {Function} isPollingDone
 * @param {Object} options for polling (maxAttempts, pollStep)
 * @private
 */
export const handlePolling = (xhrGet: any, uri: string, isPollingDone: Function, options: IPollingOptions = {}) => { // TODO
    const {
        attempts = 0,
        maxAttempts = 50,
        pollStep = 5000
    } = options;

    return xhrGet(uri)
        .then((r: any) => r.getData())
        .then((response: any) => {
            if (attempts > maxAttempts) {
                return Promise.reject(new Error(response));
            }
            return isPollingDone(response) ?
                Promise.resolve(response) :
                delay(pollStep).then(() => {
                    return handlePolling(xhrGet, uri, isPollingDone, {
                        ...options,
                        attempts: attempts + 1
                    });
                });
        });
};


/**
 * Builds query string from plain object
 * (Refactored from admin/routes.js)
 *
 * @param {Object} query parameters possibly including arrays inside
 * @returns {string} querystring
 */
export function queryString(query: any) {
    function getSingleParam(key: string, value: string) {
        return (Array.isArray(value) ?
            value.map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`).join('&') :
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    return query ? `?${Object.keys(query).map(k => getSingleParam(k, query[k])).join('&')}` : '';
}
