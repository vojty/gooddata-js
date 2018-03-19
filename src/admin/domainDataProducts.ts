import {
    interpolate,
    parse,
    CONTRACT_DATA_PRODUCT_DOMAIN_DATA_PRODUCT,
    CONTRACT_DATA_PRODUCT_DOMAIN_DATA_PRODUCTS
} from './routes';
import { IXhr } from '../interfaces';

export const transformDomainDataProduct = ({ domainDataProduct }: any) => {
    const { contractId, domainId, dataProductId }: any =
        parse(domainDataProduct.links.self, CONTRACT_DATA_PRODUCT_DOMAIN_DATA_PRODUCT);

    return {
        contractId,
        domainId,
        dataProductId,
        ...domainDataProduct
    };
};

export function createModule(xhr: IXhr) {
    const getDomainDataProducts = (contractId: string, dataProductId: string) =>
        xhr.get(interpolate(CONTRACT_DATA_PRODUCT_DOMAIN_DATA_PRODUCTS, { contractId, dataProductId }))
            .then((result: any) => {
                const { domainDataProducts: { items }, status }: any = result;
                return {
                    items: items.map(transformDomainDataProduct),
                    status
                };
            });

    return {
        getDomainDataProducts
    };
}
