// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
import { createModule as xhrFactory } from './xhr';
import { createModule as userFactory } from './user';
import { createModule as metadataFactory } from './metadata';
import { createModule as executionFactory } from './execution';
import { createModule as projectFactory } from './project';
import { createModule as configFactory } from './config';
import { createModule as catalogueFactory } from './catalogue';
import { createModule as adminFactory } from './admin';

/**
 * # JS SDK
 * Here is a set of functions that mostly are a thin wraper over the [GoodData API](https://developer.gooddata.com/api).
 * Before calling any of those functions, you need to authenticate with a valid GoodData
 * user credentials. After that, every subsequent call in the current session is authenticated.
 * You can find more about the GD authentication mechanism here.
 *
 * ## GD Authentication Mechansim
 * In this JS SDK library we provide you with a simple `login(username, passwd)` function
 * that does the magic for you.
 * To fully understand the authentication mechansim, please read
 * [Authentication via API article](http://developer.gooddata.com/article/authentication-via-api)
 * on [GoodData Developer Portal](http://developer.gooddata.com/)
 *
 * @module sdk
 * @class sdk
 */
// const gooddata = { config, xhr, user, md, execution, project, catalogue, admin };
// export default gooddata;
// module.exports = gooddata;

function factory(domain) {
    const config = configFactory();
    if (domain) {
        config.setCustomDomain(domain);
    }
    const xhr = xhrFactory(config);

    return {
        domain,
        config,
        xhr,
        user: userFactory(xhr),
        md: metadataFactory(xhr),
        execution: executionFactory(xhr),
        project: projectFactory(xhr),
        catalogue: catalogueFactory(xhr),
        admin: adminFactory(xhr)
    };
}

let defaultInstance; // eslint-disable-line import/no-mutable-exports
if (!defaultInstance) {
    defaultInstance = factory();
}

export {
    factory
};

export default defaultInstance;
