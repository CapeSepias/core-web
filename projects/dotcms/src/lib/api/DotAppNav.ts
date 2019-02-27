import { DotAppBase, DotAppConfigParams } from './DotAppBase';
import { DotAppNavItem } from '../models';

export class DotAppNav extends DotAppBase {
    constructor(config: DotAppConfigParams) {
        super(config);
    }

    get(deep = '2', location = '/'): Promise<DotAppNavItem> {
        return this.request({
            url: `/api/v1/nav/${location}?depth=${deep}`
        })
            .then((response: Response) => response.json())
            .then((data) => data.entity);
    }
}
