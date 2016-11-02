import {Component,ViewEncapsulation} from '@angular/core';
import {HttpRequestUtils} from '../../../../../api/util/httpRequestUtils';
import {LoginService} from '../../../../../api/services/login-service';
import {DotRouterService} from '../../../../../api/services/dot-router-service';

@Component({
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    providers: [HttpRequestUtils],
    selector: 'dot-login-container',
    template: `
        <dot-login-component
            [message]="message"
            [isLoginInProgress] = "isLoginInProgress"
            (login)="logInUser($event)"
            (recoverPassword)="showForgotPassword()"
            [passwordChanged]="passwordChanged"
            [resetEmailSent]="resetEmailSent"
            [resetEmail]="resetEmail"
        >
        </dot-login-component>
    `,
})
export class LoginContainer{
    private isLoginInProgress: boolean = false;
    private message:string;
    private passwordChanged: boolean = false;
    private resetEmail: string = '';
    private resetEmailSent: boolean = false;

    constructor(private loginService: LoginService, private router: DotRouterService, private httprequestUtils: HttpRequestUtils) {
        // TODO: change the httpRequestUtils.getQueryParams() with an NG2 method equivalent to QueryParams on NGRX.
        let queryParams: Map = this.httprequestUtils.getQueryParams();
        if (<boolean> queryParams.get('changedPassword')) {
            this.passwordChanged = queryParams.get('changedPassword');
        } else if (<boolean> queryParams.get('resetEmailSent')) {
            this.resetEmailSent = queryParams.get('resetEmailSent');
            this.resetEmail = decodeURIComponent(queryParams.get('resetEmail'));
        }
    }

    logInUser(loginData:LoginData): void {
        this.isLoginInProgress = true;
        this.message = '';

        this.loginService.loginUser(loginData.login, loginData.password, loginData.remenberMe, loginData.language).subscribe((result: any) => {
            this.message = '';
            this.router.goToMain();
         }, (error) => {

            if (error.response.status === 400 || error.response.status === 401) {
                this.message = error.errorsMessages;
            } else {
                console.log(error);
            }
            this.isLoginInProgress = false
            ;
        });
    }

    /**
     * Display the forgot password card
     */
    showForgotPassword(): void {
        this.router.goToForgotPassword();
    }

}

export interface LoginData {
    login: string;
    password: string;
    remenberMe: boolean;
    language: string;
}
