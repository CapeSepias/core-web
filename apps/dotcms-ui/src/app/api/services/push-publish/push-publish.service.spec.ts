import { of } from 'rxjs';
import { PushPublishService } from './push-publish.service';
import { TestBed } from '@angular/core/testing';
import { DotCurrentUserService } from '../dot-current-user/dot-current-user.service';
import { DotPushPublishData } from '@models/dot-push-publish-data/dot-push-publish-data';
import { ApiRoot, CoreWebService, LoggerService, StringUtils, UserModel } from '@dotcms/dotcms-js';
import { CoreWebServiceMock } from '@tests/core-web.service.mock';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

const mockResponse = {
    errorMessages: [],
    total: 1,
    bundleId: '1234-id-7890-entifier',
    errors: 0
};

const mockFormValue: DotPushPublishData = {
    pushActionSelected: 'publish',
    publishDate: 'Wed Jul 08 2020 10:10:50',
    expireDate: 'Wed Jul 15 2020 22:10:50',
    environment: ['env1'],
    filterKey: 'hol',
    timezoneId: 'Costa Rica'
};

describe('PushPublishService', () => {
    let dotCurrentUserService: DotCurrentUserService;

    let pushPublishService: PushPublishService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: CoreWebService, useClass: CoreWebServiceMock },
                PushPublishService,
                DotCurrentUserService,
                ApiRoot,
                LoggerService,
                UserModel,
                StringUtils
            ]
        });
        pushPublishService = TestBed.inject(PushPublishService);
        dotCurrentUserService = TestBed.inject(DotCurrentUserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should get push publish environments', () => {
        spyOn<any>(dotCurrentUserService, 'getCurrentUser').and.returnValue(
            of({
                roleId: '1234'
            })
        );

        const response = [
            {
                name: '',
                id: '0'
            },
            {
                name: 'environment1',
                id: '1sdf5-23fs-dsf2-sf3oj23p4p42d'
            },
            {
                name: 'environment2',
                id: '1s24z-23fs-d232-sf334fdf4p42d'
            }
        ];

        pushPublishService.getEnvironments().subscribe((items: any) => {
            expect(items).toEqual(response.splice(1));
        });

        const req = httpMock.expectOne('/api/environment/loadenvironments/roleId/1234/name=0');
        expect(req.request.method).toBe('GET');
        req.flush(response);
    });

    it('should do a post request and push publish an asset', () => {
        const assetIdentifier = '1234567890 +0';
        const assetIdentifierEncoded = encodeURIComponent(assetIdentifier);
        pushPublishService
            .pushPublishContent(assetIdentifier, mockFormValue, false)
            .subscribe((items: any) => {
                expect(items).toEqual(mockResponse);
            });

        const req = httpMock.expectOne(() => true);
        expect(
            req.request.url.indexOf(
                '/DotAjaxDirector/com.dotcms.publisher.ajax.RemotePublishAjaxAction/cmd/publish'
            )
        ).toBeGreaterThan(-1);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBe(
            `assetIdentifier=${assetIdentifierEncoded}&remotePublishDate=2020-07-08&remotePublishTime=10-10&remotePublishExpireDate=2020-07-15&remotePublishExpireTime=22-10&timezoneId=Costa Rica&iWantTo=publish&whoToSend=env1&bundleName=&bundleSelect=&filterKey=hol`
        );
        req.flush(mockResponse);
    });

    it('should do a post request and push publish an asset with no filter', () => {
        const formValue: DotPushPublishData = { ...mockFormValue, filterKey: null };
        pushPublishService
            .pushPublishContent('1234567890', formValue, false)
            .subscribe((items: any) => {
                expect(items).toEqual(mockResponse);
            });

        const req = httpMock.expectOne(() => true);
        expect(req.request.body).toBe(
            'assetIdentifier=1234567890&remotePublishDate=2020-07-08&remotePublishTime=10-10&remotePublishExpireDate=2020-07-15&remotePublishExpireTime=22-10&timezoneId=Costa Rica&iWantTo=publish&whoToSend=env1&bundleName=&bundleSelect='
        );
        req.flush(mockResponse);
    });

    it('should do a post with the correct URL when is a bundle', () => {
        pushPublishService
            .pushPublishContent('1234567890', mockFormValue, true)
            .subscribe((items: any) => {
                expect(items).toEqual(mockResponse);
            });

        const req = httpMock.expectOne(() => true);
        expect(req.request.body).toBe(
            'assetIdentifier=1234567890&remotePublishDate=2020-07-08&remotePublishTime=10-10&remotePublishExpireDate=2020-07-15&remotePublishExpireTime=22-10&timezoneId=Costa Rica&iWantTo=publish&whoToSend=env1&bundleName=&bundleSelect=&filterKey=hol'
        );
        req.flush(mockResponse);
    });

    afterEach(() => {
        httpMock.verify();
    });
});
