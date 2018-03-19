import { omit } from 'lodash';

import {
    interpolate,
    parse,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLONE,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_RENAME,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_SYNC,
    DEPLOY_SEGMENT
} from './routes';
import { IXhr } from '../interfaces';

export const transformDomainSegment = (item: any) => {
    const { contractId, dataProductId, segmentId, domainId }: any =
        parse(item.domainSegment.links.self, CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT);

    return {
        contractId,
        dataProductId,
        segmentId,
        domainId,
        ...item.domainSegment
    };
};

export function createModule(xhr: IXhr) {
    const getDomainSegments = (contractId: string, dataProductId: string, segmentId: string, query: any) => {
        return xhr.get(interpolate(
            CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS,
            { contractId, dataProductId, segmentId },
            query
        ))
            .then((result: any) => ({ items: result.domainSegments.items.map(transformDomainSegment) }));
    };

    const getDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string, query: any) => {
        return xhr.get(interpolate(
            CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT,
            { contractId, dataProductId, segmentId, domainId },
            query
        ))
            .then(result => transformDomainSegment(result));
    };

    const cloneDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string, newSegmentId: string, newDomainId: string) =>
        xhr.post(
            interpolate(
                CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLONE,
                { contractId, dataProductId, segmentId, domainId }
            ),
            {
                body: JSON.stringify({
                    cloneSegmentRequest: {
                        clonedSegmentId: newSegmentId,
                        domain: newDomainId
                    }
                })
            }
        );

    const deleteDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string) =>
        xhr.del(
            interpolate(CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT,
                { contractId, dataProductId, segmentId, domainId }
            ));

    const renameDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string, newSegmentId: string) =>
        xhr.post(
            interpolate(
                CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_RENAME,
                { contractId, dataProductId, segmentId, domainId }
            ),
            {
                body: JSON.stringify({
                    domainSegmentRename: {
                        id: newSegmentId
                    }
                })
            }
        );

    const syncDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string) =>
        xhr.post(interpolate(
            CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_SYNC,
            { contractId, dataProductId, segmentId, domainId }
        ));

    const deployDomainSegment = (contractId: string, dataProductId: string, segmentId: string, domainId: string, targetDomainId: string, synchronize: boolean) =>
        xhr.post(
            interpolate(
                DEPLOY_SEGMENT,
                { contractId, dataProductId, segmentId, domainId },
                synchronize && { synchronize }
            ),
            { body: JSON.stringify({ deploySegmentRequest: { domain: targetDomainId } }) }
        );

    const updateDomainSegment = (domainSegment: any) =>
        xhr.put(interpolate(CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT, domainSegment), {
            body: JSON.stringify({
                domainSegment: omit(
                    domainSegment, ['contractId', 'dataProductId', 'segmentId', 'domainId']
                )
            })
        })
            .then(result => result.json())
            .then(result => transformDomainSegment(result));

    return {
        getDomainSegments,
        getDomainSegment,
        cloneDomainSegment,
        deleteDomainSegment,
        renameDomainSegment,
        syncDomainSegment,
        deployDomainSegment,
        updateDomainSegment
    };
}
