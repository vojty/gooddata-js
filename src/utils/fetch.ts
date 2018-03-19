import * as invariant from 'invariant';

export type Fetch = typeof fetch;

let realFetch: Fetch;

export function setFetch(f: Fetch) {
    realFetch = f;
}

export function fetch(url: string, options: RequestInit): Promise<any> {
    invariant(realFetch, 'You have to define fetch implementation' +
        '(node-fetch, isomorphic-fetch) before using it.');

    return realFetch(url, options);
}
