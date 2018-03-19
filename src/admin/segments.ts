import {
    interpolate,
    parse,
    CONTRACT_DATA_PRODUCT_SEGMENT,
    CONTRACT_DATA_PRODUCT_SEGMENT_RENAME,
    CONTRACT_DATA_PRODUCT_SEGMENTS,
    CONTRACT_DOMAIN
} from './routes';
import * as domainSegments from './domainSegments';
import { IXhr } from '../interfaces';

export const transformSegment = (item) => {
    const { contractId, dataProductId }: any = parse(
        item.segment.links.self, CONTRACT_DATA_PRODUCT_SEGMENT
    );

    const segment = {
        contractId,
        dataProductId,
        ...item.segment
    };

    if (segment.domainSegments) {
        segment.domainSegments = segment.domainSegments.map(domainSegments.transformDomainSegment);
    }

    return segment;
};

export function createModule(xhr: IXhr) {
    const getDataProductSegments = (contractId: string, dataProductId) =>
        xhr.get(interpolate(CONTRACT_DATA_PRODUCT_SEGMENTS, { contractId, dataProductId }))
            .then((data: any) => ({
                items: data.segments.items.map(transformSegment),
                status: data.segments.status
            }));

    const createSegment = (contractId, dataProductId, segmentId, domainIds) =>
        xhr.post(interpolate(CONTRACT_DATA_PRODUCT_SEGMENTS, { contractId, dataProductId }), {
            body: JSON.stringify({
                segmentCreate: {
                    id: segmentId,
                    title: segmentId,
                    domains: domainIds.map(
                        domainId => interpolate(CONTRACT_DOMAIN, { contractId, domainId })
                    )
                }
            })
        });

    const renameSegment = (contractId, dataProductId, segmentId, newSegmentId) =>
        xhr.post(
            interpolate(CONTRACT_DATA_PRODUCT_SEGMENT_RENAME, { contractId, dataProductId, segmentId }),
            {
                body: JSON.stringify({ segmentRename: { id: newSegmentId } })
            }
        );

    const deleteSegment = (contractId, dataProductId, segmentId) =>
        xhr.del(interpolate(CONTRACT_DATA_PRODUCT_SEGMENT, { contractId, dataProductId, segmentId }));

    return {
        transformSegment,
        getDataProductSegments,
        createSegment,
        renameSegment,
        deleteSegment
    };
}

