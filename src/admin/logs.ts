import {
    interpolate,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_LOG
}from './routes';
import { IXhr } from '../interfaces';

export function createModule(xhr: IXhr) {
    const getLogs = (contractId: string, dataProductId: string, domainId: string, segmentId: string) =>
        xhr.get(interpolate(CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_LOG, {
            contractId,
            dataProductId,
            domainId,
            segmentId
        })).then((data: any) => data.logs.map((item: any) => item.log));

    return {
        getLogs
    };
}
