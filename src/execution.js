// Copyright (C) 2007-2017, GoodData(R) Corporation. All rights reserved.
// import { getData, getDataForVis } from './execution/experimental-executions';
import { createModule as executeAfmFactory } from './execution/execute-afm';

/**
 * Execution endpoints
 *
 * @module execution
 * @class execution
 *
 */
// export default {
//     getData,
//     getDataForVis,
//     executeAfm
// };

export function createModule(xhr) {
    return {
        executeAfm: executeAfmFactory(xhr)
    };
}
