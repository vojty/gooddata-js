import fetchMock from './fetch-mock';
import { createModule as attributesMapLoaderFactory } from '../../src/utils/attributesMapLoader';
import { createModule as xhrFactory } from '../../src/xhr';
import { createModule as mdFactory } from '../../src/metadata';
import { createModule as configFactory } from '../../src/config';
import * as fixtures from '../fixtures/attributesMapLoader';

const config = configFactory();
const xhr = xhrFactory(config);
const md = mdFactory(xhr);
const loadAttributesMap = attributesMapLoaderFactory(md);

describe('loadAttributesMap', () => {
    const projectId = 'mockProject';

    function setupFetchMock() {
        let callCount = 0;
        const twoCallsMatcher = () => {
            if (callCount === 0) {
                callCount = 1;
                return {
                    status: 200,
                    body: JSON.stringify({
                        objects: {
                            items: fixtures.displayForms
                        }
                    })
                };
            }

            return {
                status: 200,
                body: JSON.stringify({
                    objects: {
                        items: fixtures.attributeObjects
                    }
                })
            };
        };
        fetchMock.mock(
            `/gdc/md/${projectId}/objects/get`,
            twoCallsMatcher
        );
    }

    afterEach(() => {
        fetchMock.restore();
    });

    it('returns empty map for empty list of URIs', () => {
        return loadAttributesMap(projectId, []).then(attributesMap =>
            expect(attributesMap).toEqual({})
        );
    });

    it('returns map with keys generated from input URIs', () => {
        const URIs = [`/gdc/internal/projects/${projectId}/1028`, `/gdc/internal/projects/${projectId}/43`];

        setupFetchMock();

        return loadAttributesMap(projectId, URIs).then(attributesMap =>
            expect(attributesMap).toEqual(fixtures.expectedResult)
        );
    });
});
