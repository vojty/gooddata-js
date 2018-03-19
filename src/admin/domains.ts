import {
    interpolate,
    parse,
    CONTRACT_DOMAIN,
    CONTRACT_DOMAINS,
    CONTRACT_DOMAIN_USERS,
    CONTRACT_DOMAIN_PROJECTS
} from './routes';
import { IXhr } from '../interfaces';

const transformDomain = (item: any) => {
    const { domainId, contractId }: any = parse(item.domain.links.self, CONTRACT_DOMAIN);
    return {
        id: domainId,
        contractId,
        ...item.domain
    };
};

const transformDomainUser = ({ user }: any) => {
    const params = parse(user.links.domain, CONTRACT_DOMAIN);
    return {
        id: user.login,
        ...params,
        fullName: `${user.firstName} ${user.lastName}`,
        ...user
    };
};

export function createModule(xhr: IXhr) {
    const getDomain = (contractId: string, domainId: string, query: any) => {
        const uri = interpolate(CONTRACT_DOMAIN, { contractId, domainId }, query);

        return xhr.get(uri).then(transformDomain);
    };

    const getDomains = (contractId: string, query: any) => {
        return xhr.get(interpolate(CONTRACT_DOMAINS, { contractId }, query))
            .then((result: any) => ({ items: result.domains.items.map(transformDomain) })); // TODO: paging?
    };

    const getDomainUsers = (contractId: string, domainId: string, query: any, paging: any) => {
        if (paging && !paging.next) {
            return Promise.resolve({ items: [], paging: {} });
        }

        const uri = paging ?
            paging.next : interpolate(CONTRACT_DOMAIN_USERS, { contractId, domainId }, query);

        return xhr.get(uri).then((result: any) => ({
            ...result.domainUsers,
            items: result.domainUsers.items.map(transformDomainUser)
        }));
    };

    const getDomainProjects = (contractId: string, domainId: string, state: any, query: any, paging: any) => {
        if (paging && !paging.next) {
            return Promise.resolve({ items: [], paging: {} });
        }

        const uri = paging ?
            paging.next : interpolate(
                CONTRACT_DOMAIN_PROJECTS,
                { contractId, domainId }, state || query ?
                    Object.assign(state && { state }, query && { prefixSearch: query }) : null
            );

        return xhr.get(uri).then((result: any) => ({
            ...result.domainProjects,
            items: result.domainProjects.items.map((item: any) => item.project)
        }));
    };

    return {
        getDomain,
        getDomains,
        getDomainUsers,
        getDomainProjects
    };
}
