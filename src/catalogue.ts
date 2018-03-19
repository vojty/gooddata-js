import { get, find, omit, cloneDeep } from 'lodash';
import { IXhr, IExecution } from './interfaces';

const REQUEST_DEFAULTS = {
    types: ['attribute', 'metric', 'fact'],
    paging: {
        offset: 0
    }
};

const LOAD_DATE_DATASET_DEFAULTS = {
    includeUnavailableDateDataSetsCount: true,
    includeAvailableDateAttributes: true
};

/**
 * Convert specific params in options to "requiredDataSets" structure. For more details look into
 * res file https://github.com/gooddata/gdc-bear/blob/develop/resources/specification/internal/catalog.res
 *
 * @param options Supported keys in options are:
 * <ul>
 * <li>dataSetIdentifier - in value is string identifier of dataSet - this leads to CUSTOM type
 * <li>returnAllDateDataSets - true value means to return ALL values without dataSet differentiation
 * <li>returnAllRelatedDateDataSets - only related date dataSets are loaded across all dataSets
 * <li>by default we get PRODUCTION dataSets
 * </ul>
 * @returns {Object} "requiredDataSets" object hash.
 */
const getRequiredDataSets = (options: any) => {
    if (get(options, 'returnAllRelatedDateDataSets')) {
        return {};
    }

    if (get(options, 'returnAllDateDataSets')) {
        return { requiredDataSets: { type: 'ALL' } };
    }

    if (get(options, 'dataSetIdentifier')) {
        return { requiredDataSets: {
            type: 'CUSTOM',
            customIdentifiers: [get(options, 'dataSetIdentifier')]
        } };
    }

    return { requiredDataSets: { type: 'PRODUCTION' } };
};

export function createModule(xhr: IXhr, execution: IExecution) {
    function bucketItemsToExecConfig(projectId: string, mdObj: any, options = {}) {
        return execution.mdToExecutionDefinitionsAndColumns(projectId, mdObj, options).then((definitionsAndColumns: any) => {
            const definitions = get(definitionsAndColumns, 'definitions');

            return get(definitionsAndColumns, 'columns', []).map((column: any) => {
                const definition = find(definitions, ({ metricDefinition }) =>
                    get(metricDefinition, 'identifier') === column
                );
                const maql = get(definition, 'metricDefinition.expression');

                if (maql) {
                    return maql;
                }
                return column;
            });
        });
    }

    function loadCatalog(projectId: string, catalogRequest: any) {
        const uri = `/gdc/internal/projects/${projectId}/loadCatalog`;

        return xhr.post(uri, { data: { catalogRequest } })
            .then((r => r.getData()))
            .then(data => data.catalogResponse);
    }

    function loadItems(projectId: string, options = {}) {
        const request = omit({
            ...REQUEST_DEFAULTS,
            ...options,
            ...getRequiredDataSets(options)
        }, [
            'dataSetIdentifier',
            'returnAllDateDataSets',
            'attributesMap'
        ]);

        const mdObj = get(cloneDeep(options), 'bucketItems');
        const attributesMap = get(options, 'attributesMap');
        const hasBuckets = get(mdObj, 'buckets') !== undefined;
        if (hasBuckets) {
            return bucketItemsToExecConfig(projectId, mdObj, { attributesMap }).then((bucketItems: any) =>
                loadCatalog(projectId, {
                    ...request,
                    bucketItems
                })
            );
        }

        return loadCatalog(projectId, request);
    }

    function requestDateDataSets(projectId: string, dateDataSetsRequest: any) {
        const uri = `/gdc/internal/projects/${projectId}/loadDateDataSets`;

        return xhr.post(uri, { data: { dateDataSetsRequest } })
            .then((r => r.getData()))
            .then(data => data.dateDataSetsResponse);
    }

    function loadDateDataSets(projectId: string, options: any) {
        const mdObj = get(cloneDeep(options), 'bucketItems');
        const bucketItemsPromise = mdObj ?
            bucketItemsToExecConfig(projectId, mdObj, { removeDateItems: true, attributesMap: get(options, 'attributesMap') }) :
            Promise.resolve();

        return bucketItemsPromise.then((bucketItems: any) => {
            const omittedOptions = ['filter', 'types', 'paging', 'dataSetIdentifier', 'returnAllDateDataSets', 'returnAllRelatedDateDataSets', 'attributesMap'];
            // includeObjectsWithTags has higher priority than excludeObjectsWithTags,
            // so when present omit excludeObjectsWithTags
            if (options.includeObjectsWithTags) {
                omittedOptions.push('excludeObjectsWithTags');
            }

            const request = omit({
                ...LOAD_DATE_DATASET_DEFAULTS,
                ...REQUEST_DEFAULTS,
                ...options,
                ...getRequiredDataSets(options),
                bucketItems
            }, omittedOptions);

            return requestDateDataSets(projectId, request);
        });
    }

    return {
        loadItems,
        loadDateDataSets
    };
}

