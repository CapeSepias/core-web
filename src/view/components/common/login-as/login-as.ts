import {BaseComponent} from '../_base/base-component';
import {Component, Output, EventEmitter} from '@angular/core';
import {LoginService, User} from '../../../../api/services/login-service';
import {MessageService} from '../../../../api/services/messages-service';
import {DotRouterService} from '../../../../api/services/dot-router-service';

@Component({
    directives: [],
    moduleId: __moduleName,
    providers: [],
    selector: 'dot-login-as',
    styleUrls: ['login-as.css'],
    templateUrl: ['login-as.html']
})
export class LoginAsComponent extends BaseComponent {
    @Output() cancel = new EventEmitter<>();

    private needPassword: boolean = false;
    private userLists: Array<User>;
    private filteredLoginAsUsersResults: Array<any>;

    constructor(private loginService: LoginService, private router: DotRouterService, private messageService: MessageService) {
        super(['change', 'cancel', 'password', 'loginas.select.loginas.user'], messageService);
    }

    ngOnInit(): void {
        this.loginService.getLoginAsUsersList().subscribe(data => {
            this.userLists = data;
        });
    }

    close(): void {
        this.cancel.emit(true);
        return false;
    }

    /**
     * Calls the back-end service that will change the appropriate request and session
     * attributes in order to impersonate the specified user. If an error occurs, a
     * message will be displayed to the user indicating so.
     *
     * @param options - The parameters required by the back-end service.
     */
    dolLoginAs(options: any): void {
        let parameters = {userId: options.user.value, password: options.password};
        this.loginService.loginAs(parameters).subscribe(data => {
            if (data) {
                this.router.goToMain();
                this.close();
            }
            // TODO: Replace the alert below with a modal error message.
        }, message => alert(message));
    }

    userSelectedHandler($event): void {
        this.needPassword = this.loginService.getLoginAsUser($event.value).requestPassword || false;
    }

    /**
     * Filter the users displayed in the dropdown by comparing if
     * the user name characters set on the drowpdown search box matches
     * some on the user names set on the userlist variable loaded on the
     * ngOnInit method
     *
     * @param event - The event with the query parameter to filter the users
     */
    filterUsers(event): void {
        this.filteredLoginAsUsersResults = this.userLists.
        filter( user => user.fullName.toLowerCase().indexOf(event.query.toLowerCase()) >= 0)
            .map( user => {
                return {
                label: user.fullName,
                value: user.userId,
                };
            });
    }

    /**
     * Display all the existing login as users availables loaded on the
     * userList variable initialized on the ngOnInit method
     *
     * @param event - The click event to display the dropdown options
     */
    handleLoginAsUsersDropdownClick(): void {
        this.filteredLoginAsUsersResults = [];

        /**
         * This time out is included to imitate a remote call and
         * avoid that the suggestion box is not displayed, because
         * the autocomplete hide method is execute after the the show
         * method.
         *
         * TODO - remove the setTimeout when we add the pagination option
         * making a call to the login service to get a subset of login as users
         * paginated to display on the dropdown sugestions pannel.
         *
         */
        setTimeout(() => {
            this.filteredLoginAsUsersResults = this.userLists.map( user => {
                return {
                    label: user.fullName,
                    value: user.userId,
                };
            });
        }, 100);
    }

}