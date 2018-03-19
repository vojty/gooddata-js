import {
    interpolate,
    parse,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENT,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENTS,
    CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENT_USERS
} from './routes';
import { IXhr } from '../interfaces';

const transformClient = (item: any) => {
    const { contractId, dataProductId, domainId, segmentId }: any =
        parse(item.client.links.self, CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENT);

    return {
        contractId,
        dataProductId,
        domainId,
        segmentId,
        ...item.client
    };
};

const transformClientUser = (user: any) => {
    return {
        id: user.login,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.roles[0],
        ...user
    };
};

export function createModule(xhr: IXhr) {
    const getClient = (contractId: string, dataProductId: string, segmentId: string, domainId: string, clientId: string) => {
        const query = { stats: 'user' };
        const uri = interpolate(
            CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENT,
            { contractId, dataProductId, segmentId, domainId, clientId },
            query
        );

        return xhr
            .get(uri).then(r => r.getData()).then(result => transformClient(result));
    };

    const getClients = (contractId: string, dataProductId: string, segmentId: string, domainId: string, filter: any, paging: any) => {
        const query = filter ? { clientPrefix: filter, stats: 'user' } : { stats: 'user' };
        const uri = paging ?
            paging.next :
            interpolate(
                CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENTS,
                { contractId, dataProductId, segmentId, domainId },
                query
            );

        if (uri) {
            return xhr.get(uri)
                .then(r => r.getData())
                .then(result => ({
                    items: result.clients.items.map(transformClient),
                    paging: result.clients.paging
                }));
        }

        return Promise.resolve({ items: [], paging: {} });
    };

    const getClientUsers = (contractId: string, dataProductId: string, domainId: string, segmentId: string, clientId: string, query: any, paging: any) => {
        if (paging && !paging.next) {
            return Promise.resolve({ items: [], paging: {} });
        }

        const uri = paging ?
            paging.next :
            interpolate(
                CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENT_CLIENT_USERS,
                { contractId, dataProductId, domainId, segmentId, clientId },
                query
            );

        return xhr.get(uri)
            .then((r => r.getData()))
            .then(result => ({
                ...result.clientUsers,
                items: result.clientUsers.items.map(transformClientUser)
            }));
    };

    return {
        getClient,
        getClients,
        getClientUsers
    };
}
