import {
    get,
    set
} from 'lodash';
import { IMetadata } from '../interfaces';

function getAttributeUris(displayForms: any) {
    return displayForms.map(
        (displayForm: any) => get(displayForm, ['attributeDisplayForm', 'content', 'formOf'])
    );
}

function createAttributesMap(displayForms: any, attributes: any) {
    return displayForms.reduce((attributesMap: any, displayForm: any) => {
        const dfUri = get(displayForm, ['attributeDisplayForm', 'meta', 'uri']);
        const attribute = attributes.find((attr: any) =>
            get(attr, ['attribute', 'meta', 'uri']) === get(displayForm, ['attributeDisplayForm', 'content', 'formOf'])
        );

        return set(attributesMap, [dfUri], attribute);
    },
    {});
}

export function getMissingUrisInAttributesMap(displayFormsUris: string[], attributesMap: any) {
    const uris = displayFormsUris || [];
    return uris.filter(uri => !attributesMap[uri]);
}

export function createModule(md: IMetadata) {
    return function loadAttributesMap(projectId: string, attributeDisplayFormUris: string[]) {
        if (attributeDisplayFormUris.length === 0) {
            return Promise.resolve({});
        }

        return md.getObjects(projectId, attributeDisplayFormUris).then((displayForms) => {
            const attributeUris = getAttributeUris(displayForms);
            return md.getObjects(projectId, attributeUris).then((attributes) => {
                return createAttributesMap(displayForms, attributes);
            });
        });
    };
}
