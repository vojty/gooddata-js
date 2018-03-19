import {
    interpolate,
    parse,
    CONTRACT_DATA_PRODUCT,
    CONTRACT_DATA_PRODUCTS,
    CONTRACT_DOMAIN,
    CONTRACT_DATA_PRODUCT_RENAME
} from './routes';
import {
    transformSegment
} from './segments';
import * as domainDataProducts from './domainDataProducts';
import { IXhr } from '../interfaces';

export const transformDataProduct = (item: any) => {
    const { contractId }: any = parse(item.dataProduct.links.self, CONTRACT_DATA_PRODUCT);

    const dataProduct = {
        contractId,
        ...item.dataProduct
    };

    if (dataProduct.domainDataProducts) {
        dataProduct.domainDataProducts =
            dataProduct.domainDataProducts.map(domainDataProducts.transformDomainDataProduct);
    }
    if (dataProduct.segments) {
        dataProduct.segments = dataProduct.segments.map(transformSegment);
    }

    return dataProduct;
};

export function createModule(xhr: IXhr) {
    const getDataProducts = (contractId: string, include: any) =>
        xhr.get(interpolate(CONTRACT_DATA_PRODUCTS, { contractId }, include && { include }))
            .then((data: any) => ({
                items: data.dataProducts.items.map(transformDataProduct)
            }));

    const getDataProduct = (contractId: string, dataProductId: string, include: any, stats: any, state: any) =>
        xhr.get(interpolate(
            CONTRACT_DATA_PRODUCT, { contractId, dataProductId },
            Object.assign(include && { include }, stats && { stats }, state && { state })
        ))
            .then(data => transformDataProduct(data));

    const createDataProduct = (contractId: string, dataProductId: string, domainIds: string[]) =>
        xhr.post(interpolate(CONTRACT_DATA_PRODUCTS, { contractId }), {
            body: JSON.stringify({
                dataProductCreate: {
                    id: dataProductId,
                    domains: domainIds.map(
                        domainId => interpolate(CONTRACT_DOMAIN, { contractId, domainId })
                    )
                }
            })
        });

    const renameDataProduct = (contractId: string, dataProductId: string, newDataProductId: string) =>
        xhr.post(interpolate(CONTRACT_DATA_PRODUCT_RENAME, { contractId, dataProductId }), {
            body: JSON.stringify({ dataProductRename: { id: newDataProductId } })
        });

    const deleteDataProduct = (contractId: string, dataProductId: string) =>
        xhr.del(interpolate(CONTRACT_DATA_PRODUCT, { contractId, dataProductId }));

    return {
        getDataProducts,
        getDataProduct,
        createDataProduct,
        renameDataProduct,
        deleteDataProduct
    };
}

