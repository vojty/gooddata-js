import {
    CONTRACTS
} from './routes';
import { IXhr } from '../interfaces';

export function createModule(xhr: IXhr) {
    const getUserContracts = () => xhr.get(CONTRACTS).then((data: any) => ({
        items: data.contracts.items.map((item: any) => item.contract),
        paging: data.contracts.paging
    }));

    return {
        getUserContracts
    };
}
