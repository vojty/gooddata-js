// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
import { get, clone } from 'lodash';
import * as invariant from 'invariant';
import * as qs from 'qs';
import { Execution, AFM } from '@gooddata/typings';
import { IXhr } from '../interfaces';

const PAGE_SIZE = 500;
const DEFAULT_DIMENSION_COUNT = 2;

function getDimensionality(execution: AFM.IExecution): number {
    const dimensions = get(execution, 'execution.resultSpec.dimensions');
    return dimensions
        ? dimensions.length
        : DEFAULT_DIMENSION_COUNT;
}

function getLimit(offset: number[]) {
    return Array(offset.length).fill(PAGE_SIZE);
}

// works only for one or two dimensions
export function mergePageData(result: Execution.IExecutionResult, currentPage: Execution.IExecutionResult) {
    const { paging, data, headerItems } = currentPage.executionResult;
    const rowOffset = paging.offset[0];
    if (result.executionResult.data[rowOffset]) { // appending columns to existing rows
        for (let i = 0; i < data.length; i += 1) {
            result.executionResult.data[i + rowOffset].push(...data[i]);
        }
    } else { // appending new rows
        result.executionResult.data.push(...data);
    }

    const doDimension = (dim: number) => {
        const otherDimension = (dim === 0 ? 1 : 0);
        const isEdge = (paging.offset[otherDimension] === 0);
        if (isEdge) {
            for (let attrIdx = 0; attrIdx < headerItems[dim].length; attrIdx += 1) {
                result.executionResult.headerItems[dim][attrIdx].push(...headerItems[dim][attrIdx]);
            }
        }
    };

    // careful: for 1 dimension we already have the headers from first page
    if (paging.offset.length > 1) {
        doDimension(0);
        doDimension(1);
    }

    return result;
}

export function nextPageOffset({ offset, total }: { offset: number[], total: number[]}) {
    const newOffset = clone(offset);
    const maxDimension = offset.length - 1;
    // we need last dimension first (aka columns, then rows) to allow array appending in merge fnc
    for (let i = maxDimension; i >= 0; i -= 1) {
        if (newOffset[i] + PAGE_SIZE < total[i]) {
            newOffset[i] += PAGE_SIZE;
            return newOffset;
        }
        newOffset[i] = 0;
    }
    return false;
}

export function createModule(xhr: IXhr) {
    function fetchExecutionResult(pollingUri: string, offset: number[]) {
        const [uriPart, queryPart] = pollingUri.split(/\?(.+)/);
        const query = {
            ...qs.parse(queryPart),
            limit: getLimit(offset).join(','),
            offset: offset.join(',')
        };
        const finalPollingUri = uriPart + qs.stringify(query, { addQueryPrefix: true });
        return xhr.ajax(finalPollingUri, { method: 'GET' }).then((r) => {
            if (r.response.status === 204) {
                return null;
            }
            return r.getData();
        });
    }

    function getOnePage(pollingUri: string, offset: number[], prevResult = null) {
        return fetchExecutionResult(pollingUri, offset).then((executionResult: Execution.IExecutionResult) => {
            if (executionResult === null) {
                return null;
            }

            const newResult = prevResult ? mergePageData(prevResult, executionResult) : executionResult;

            const nextOffset = nextPageOffset(executionResult.executionResult.paging);
            return nextOffset
                ? getOnePage(pollingUri, nextOffset, newResult)
                : newResult;
        });
    }

    /**
     * Execute AFM and fetch data results
     *
     * @method executeAfm
     * @param {String} projectId - GD project identifier
     * @param {Object} execution - See https://github.com/gooddata/gooddata-typings/blob/master/index.ts#L4
     *
     * @return {Object} Structure with `executionResult` and `executionResponse` -
     *  See https://github.com/gooddata/gooddata-typings/blob/master/index.ts#L294
     */
    function executeAfm(projectId: string, execution: AFM.IExecution) {
        const dimensionality = getDimensionality(execution);
        invariant(dimensionality <= 2, 'executeAfm does not support more than 2 dimensions');

        return xhr.post(`/gdc/app/projects/${projectId}/executeAfm`, { body: JSON.stringify(execution) })
            .then((r => r.getData()))
            .then((executionResponse) => {
                const offset = Array(dimensionality).fill(0); // offset holds information on dimensionality
                const pollingUri = executionResponse.executionResponse.links.executionResult;
                return getOnePage(pollingUri, offset).then((executionResult: Execution.IExecutionResult) => {
                    return {
                        executionResponse,
                        executionResult
                    };
                });
            });
    }

    return executeAfm;
}
