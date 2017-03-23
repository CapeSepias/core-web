import {BaseComponent} from '../_base/base-component';
import {Component, ViewEncapsulation} from '@angular/core';
import {MessageService} from '../../../../api/services/messages-service';

@Component({
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName,
    selector: 'dot-global-search',
    styleUrls: ['global-search.css'],
    templateUrl: ['global-search.html'],
})
export class GlobalSearch extends BaseComponent{
    constructor(private messageService: MessageService) {
        super(['search'], messageService);
    }
}