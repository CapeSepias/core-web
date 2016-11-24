import {Component, ElementRef, ViewEncapsulation} from '@angular/core';
import {LoginService} from '../../../../api/services/login-service';
import {ActivatedRoute} from '@angular/router';
import {RoutingService} from '../../../../api/services/routing-service';
import {SafeResourceUrl, DomSanitizer} from '@angular/platform-browser';
import {SiteChangeListener} from '../../../../api/util/site-change-listener';
import {SiteService} from '../../../../api/services/site-service';
import {DotcmsEventsService} from '../../../../api/services/dotcms-events-service';
import {MessageService} from '../../../../api/services/messages-service';

@Component({
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    selector: 'dot-iframe',
    styleUrls: ['iframe-legacy-component.css'],
    templateUrl: ['iframe-legacy-component.html']
})
export class IframeLegacyComponent extends SiteChangeListener {
    iframe: SafeResourceUrl;
    iframeElement;
    private loadingInProgress: boolean = true;

    constructor(private route: ActivatedRoute, private routingService: RoutingService, private siteService: SiteService,
                private sanitizer: DomSanitizer, private element: ElementRef, private loginService: LoginService,
                private dotcmsEventsService: DotcmsEventsService, messageService: MessageService) {
        super(siteService, ['ask-reload-page-message'], messageService);
    }

    ngOnInit(): void {
        this.iframeElement = this.element.nativeElement.querySelector('iframe');

        this.initComponent();

        this.iframeElement.onload = () => this.loadingInProgress = false;
        let events: string[] = ['SAVE_FOLDER', 'UPDATE_FOLDER', 'DELETE_FOLDER', 'SAVE_PAGE_ASSET', 'UPDATE_PAGE_ASSET',
            'ARCHIVE_PAGE_ASSET', 'UN_ARCHIVE_PAGE_ASSET', 'DELETE_PAGE_ASSET', 'PUBLISH_PAGE_ASSET', 'UN_PUBLISH_PAGE_ASSET',
            'SAVE_FILE_ASSET', 'UPDATE_FILE_ASSET', 'ARCHIVE_FILE_ASSET', 'UN_ARCHIVE_FILE_ASSET', 'DELETE_FILE_ASSET',
            'PUBLISH_FILE_ASSET', 'UN_PUBLISH_FILE_ASSET', 'SAVE_LINK', 'UPDATE_LINK', 'ARCHIVE_LINK', 'UN_ARCHIVE_LINK',
            'MOVE_LINK', 'COPY_LINK', 'DELETE_LINK', 'PUBLISH_LINK', 'UN_PUBLISH_LINK', 'MOVE_FOLDER', 'COPY_FOLDER',
            'MOVE_FILE_ASSET', 'COPY_FILE_ASSET', 'MOVE_PAGE_ASSET', 'COPY_PAGE_ASSET'
        ];

        this.dotcmsEventsService.subscribeToEvents(events).subscribe( content => {
            if (this.routingService.currentPortletId === 'EXT_BROWSER') {

                if (confirm(this.i18nMessages['ask-reload-page-message'])) {
                    this.iframeElement.contentWindow.location.reload();
                }
            }
        });
    }

    initComponent(): void {
        this.route.params.pluck<string>('id').subscribe(id => {
            setTimeout(() => {
                    this.iframe = this.loadURL(this.routingService.getPortletURL(id) + '&in_frame=true&frame=detailFrame');
                },
            1);
        });
    }

    changeSiteReload(): void {
        if (this.iframeElement && this.iframeElement.contentWindow
            && this.routingService.currentPortletId !== 'EXT_HOSTADMIN') {

            this.loadingInProgress = true;
            this.iframeElement.contentWindow.location.reload();
        }
    }

    loadURL(url: string): SafeResourceUrl {
        this.loadingInProgress = true;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * Validate if the iframe window is send to the login page after jsessionid expired
     * then logout the user from angular session
     */
    checkSessionExpired(): void {
        if (this.iframeElement && this.iframeElement.contentWindow) {
            let currentPath = this.iframeElement.contentWindow.location.pathname;

            if (currentPath.indexOf('/c/portal_public/login') !== -1) {
                this.loginService.logOutUser().subscribe(data => {
                }, (error) => {
                    console.log(error);
                });
            }
        }
    }
}
