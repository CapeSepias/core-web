import {Component, Inject} from '@angular/core';
import {Accordion, AccordionGroup} from '../accordion/accordion';
import {RoutingService} from '../../../../api/services/routing-service';
import {provideRouter, ROUTES} from '@ngrx/router';
import {provide} from '@angular/core';

// Angular Material
import {MD_LIST_DIRECTIVES} from '@angular2-material/list/list';

@Component({
    directives: [MD_LIST_DIRECTIVES, Accordion, AccordionGroup],
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    providers: [],
    selector: 'dot-main-nav',
    styleUrls: ['main-navigation.css'],
    templateUrl: ['main-navigation.html'],
})

export class MainNavigation {

    constructor(@Inject('menuItems') private menuItems: Array<any>, private _routingService: RoutingService) {
        // TODO update dinamically menuItems and routes calling
        // this.updateRoutes();

    }

    /**
     * This method should allow to update the menuItems and routes dinamically
     * TODO the menu is displayed but the changes in the route and menuItem
     * are not visible in the other component
     */
    public updateRoutes(): void {
        this._routingService.getRoutes().subscribe(menu => {
            this.menuItems = menu.menuItems;
            provide('menuItems', {useValue: menu.menuItems});
            provideRouter(menu.routers);
            provide(ROUTES, { useValue: menu.routes });
        }, (error) => {
            console.log( error);
        });
    }
}
