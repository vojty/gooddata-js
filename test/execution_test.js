// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
/* eslint func-names:0 handle-callback-err: 0 */
import * as ex from '../src/execution';
import fetchMock from 'fetch-mock';

describe('execution', () => {
    describe('with fake server', () => {
        let serverResponseMock;

        afterEach(function() {
            fetchMock.restore();
        });

        describe('Data Execution:', () => {
            beforeEach(function() {
                serverResponseMock = {
                    executionResult: {
                        columns: [
                            {
                                attributeDisplayForm: {
                                    meta: {
                                        identifier: 'attrId',
                                        uri: 'attrUri',
                                        title: 'Df Title'
                                    }
                                }
                            },
                            {
                                metric: {
                                    meta: {
                                        identifier: 'metricId',
                                        uri: 'metricUri',
                                        title: 'Metric Title'
                                    },
                                    content: {
                                        format: '#00'
                                    }
                                }
                            }
                        ],
                        tabularDataResult: '/gdc/internal/projects/myFakeProjectId/experimental/executions/23452345'
                    }
                };
            });

            describe('getData', () => {
                it('should resolve with JSON with correct data without headers', () => {
                    fetchMock.mock(
                        '/gdc/internal/projects/myFakeProjectId/experimental/executions',
                        { status: 200, body: JSON.stringify(serverResponseMock)}
                    );
                    fetchMock.mock(
                        /\/gdc\/internal\/projects\/myFakeProjectId\/experimental\/executions\/(\w+)/,
                        { status: 201, body: JSON.stringify({'tabularDataResult': {values: ['a', 1]}}) }
                    );

                    return ex.getData('myFakeProjectId', ['attrId', 'metricId']).then(function(result) {
                        expect(result.headers[0].id).to.be('attrId');
                        expect(result.headers[0].uri).to.be('attrUri');
                        expect(result.headers[0].type).to.be('attrLabel');
                        expect(result.headers[0].title).to.be('Df Title');
                        expect(result.headers[1].id).to.be('metricId');
                        expect(result.headers[1].uri).to.be('metricUri');
                        expect(result.headers[1].type).to.be('metric');
                        expect(result.headers[1].title).to.be('Metric Title');
                        expect(result.rawData[0]).to.be('a');
                        expect(result.rawData[1]).to.be(1);
                    });
                });

                it('should resolve with JSON with correct data including headers', () => {
                    const responseMock = JSON.parse(JSON.stringify(serverResponseMock));

                    responseMock.executionResult.headers = [
                        {
                            id: 'attrId',
                            title: 'Atribute Title',
                            type: 'attrLabel',
                            uri: 'attrUri'
                        },
                        {
                            id: 'metricId',
                            title: 'Metric Title',
                            type: 'metric',
                            uri: 'metricUri'
                        }
                    ];

                    fetchMock.mock(
                        '/gdc/internal/projects/myFakeProjectId/experimental/executions',
                        { status: 200, body: JSON.stringify(responseMock) }
                    );
                    fetchMock.mock(
                        /\/gdc\/internal\/projects\/myFakeProjectId\/experimental\/executions\/(\w+)/,
                        { status: 201, body: JSON.stringify({'tabularDataResult': {values: ['a', 1]}}) }
                    );

                    return ex.getData('myFakeProjectId', ['attrId', 'metricId']).then(function(result) {
                        expect(result.headers[0].id).to.be('attrId');
                        expect(result.headers[0].uri).to.be('attrUri');
                        expect(result.headers[0].type).to.be('attrLabel');
                        expect(result.headers[0].title).to.be('Atribute Title');
                        expect(result.headers[1].id).to.be('metricId');
                        expect(result.headers[1].uri).to.be('metricUri');
                        expect(result.headers[1].type).to.be('metric');
                        expect(result.headers[1].title).to.be('Metric Title');
                        expect(result.rawData[0]).to.be('a');
                        expect(result.rawData[1]).to.be(1);
                    });
                });

                it('should not fail if tabular data result is missing', () => {
                    fetchMock.mock(
                        '/gdc/internal/projects/myFakeProjectId/experimental/executions',
                        { status: 200, body: JSON.stringify(serverResponseMock) }
                    );
                    fetchMock.mock(
                        /\/gdc\/internal\/projects\/myFakeProjectId\/experimental\/executions\/(\w+)/,
                        { status: 200, body: JSON.stringify('TEMPORARY_HACK') } // should be just 204, but see https://github.com/wheresrhys/fetch-mock/issues/36
                    );

                    return ex.getData('myFakeProjectId', ['attrId', 'metricId']).then(function(result) {
                        expect(result.rawData).to.eql([]);
                    });
                });

                it('should reject when execution fails', () => {
                    fetchMock.mock(
                        '/gdc/internal/projects/myFakeProjectId/experimental/executions',
                        400
                    );

                    return ex.getData('myFakeProjectId', ['attrId', 'metricId']).then(null, (err) => {
                        expect(err).to.be.an(Error);
                    });
                });

                it('should reject with 400 when data result fails', () => {
                    fetchMock.mock(
                        '/gdc/internal/projects/myFakeProjectId/experimental/executions',
                        { status: 200, body: JSON.stringify(serverResponseMock)}
                    );
                    fetchMock.mock(
                        /\/gdc\/internal\/projects\/myFakeProjectId\/experimental\/executions\/(\w+)/,
                        { status: 400, body: JSON.stringify({'tabularDataResult': {values: ['a', 1]}}) }
                    );

                    return ex.getData('myFakeProjectId', [{type: 'metric', uri: '/metric/uri'}]).then(null, (err) => {
                        expect(err).to.be.an(Error);
                    });
                });
            });

            describe('getData with execution context filters', () => {
                it('should propagate execution context filters to the server call', () => {
                    const matcher = '/gdc/internal/projects/myFakeProjectId/experimental/executions';
                    // prepare filters and then use them with getData
                    const filters = [{
                        'uri': '/gdc/md/myFakeProjectId/obj/1',
                        'constraint': {
                            'type': 'list',
                            'elements': ['/gdc/md/myFakeProjectId/obj/1/elements?id=1']
                        }
                    }];
                    fetchMock.mock(matcher, 200);
                    ex.getData('myFakeProjectId', ['attrId', 'metricId'], {
                        filters: filters
                    });
                    const [url, settings] = fetchMock.lastCall(matcher);
                    const requestBody = JSON.parse(settings.body);

                    expect(requestBody.execution.filters).to.eql(filters);
                });
            });

            describe('getData with order', () => {
                it('should propagate orderBy to server call', () => {
                    const matcher = '/gdc/internal/projects/myFakeProjectId/experimental/executions';
                    const orderBy = [
                        {
                            column: 'column1',
                            direction: 'asc'
                        },
                        {
                            column: 'column2',
                            direction: 'desc'
                        }
                    ];
                    let url;
                    let settings;
                    let requestBody;
                    fetchMock.mock(matcher, 200)

                    ex.getData('myFakeProjectId', ['attrId', 'metricId'], {
                        orderBy: orderBy
                    });

                    [url, settings] = fetchMock.lastCall(matcher);
                    requestBody = JSON.parse(settings.body);
                    expect(requestBody.execution.orderBy).to.eql(orderBy);
                });
            });

            describe('getData with definitions', () => {
                it('should propagate orderBy to server call', () => {
                    const matcher = '/gdc/internal/projects/myFakeProjectId/experimental/executions';
                    const definitions = [
                        {
                            metricDefinition: {
                                'title': 'Closed Pipeline - previous year',
                                'expression': 'SELECT (SELECT {adyRSiRTdnMD}) FOR PREVIOUS ({date.year})',
                                'format': '#,,.00M',
                                'identifier': 'adyRSiRTdnMD.generated.pop.1fac4f897bbb5994a257cd2c9f0a81a4'
                            }
                        }
                    ];
                    fetchMock.mock(matcher, 200);
                    ex.getData('myFakeProjectId', ['attrId', 'metricId'], {
                        definitions: definitions
                    });

                    /*eslint-disable vars-on-top*/
                    const [url, settings] = fetchMock.lastCall(matcher);
                    const requestBody = JSON.parse(settings.body);
                    /*eslint-enable vars-on-top*/
                    expect(requestBody.execution.definitions).to.eql(definitions);
                });
            });

            describe('getData with query language filters', () => {
                it('should propagate filters to the server call', () => {
                    // prepare filters and then use them with getData
                    const matcher = '/gdc/internal/projects/myFakeProjectId/experimental/executions';
                    fetchMock.mock(matcher, 200);
                    const where = {
                        'label.attr.city': { '$eq': 1 }
                    };
                    ex.getData('myFakeProjectId', ['attrId', 'metricId'], {
                        where: where
                    });
                    /*eslint-disable vars-on-top*/
                    const [url, settings] = fetchMock.lastCall(matcher);
                    const requestBody = JSON.parse(settings.body);
                    /*eslint-enable vars-on-top*/

                    expect(requestBody.execution.where).to.eql(where);
                });
            });
        });
    });
});

