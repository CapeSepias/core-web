import {ApiRoot} from '../persistence/ApiRoot';
import {CoreWebService} from './core-web-service';
import {Http} from '@angular/http';
import {Injectable} from '@angular/core';
import {LoginService} from './login-service';
import {Observable} from 'rxjs/Rx';
import {RequestMethod} from '@angular/http';
import {Subject} from 'rxjs/Subject';
import {DotcmsEventsService} from './dotcms-events-service';

@Injectable()
export class ContentletService {
    private structureTypeView: StructureTypeView[];
    private _structureTypeView$: Subject<StructureTypeView[]> = new Subject<StructureTypeView[]>();

    constructor(loginService: LoginService, dotcmsEventsService: DotcmsEventsService,
                private coreWebService: CoreWebService) {

        loginService.watchUser(this.loadContentTypes.bind(this));

        dotcmsEventsService.subscribeTo('SAVE_BASE_CONTENT_TYPE').pluck('data').subscribe( contentTypeView => {
            let structureTypeView: StructureTypeView = this.getStructureTypeView(contentTypeView.type);
            structureTypeView.types.push(contentTypeView);
            this._structureTypeView$.next(this.structureTypeView);
        });

        dotcmsEventsService.subscribeTo('UPDATE_BASE_CONTENT_TYPE').pluck('data').subscribe( contentTypeViewUpdated => {
            let structureTypeView: StructureTypeView = this.getStructureTypeView(contentTypeViewUpdated.type);

            structureTypeView.types = structureTypeView.types.map(
                contentTypeView => contentTypeView.inode === contentTypeViewUpdated.inode ? contentTypeViewUpdated : contentTypeView);

            this._structureTypeView$.next(this.structureTypeView);
        });

        dotcmsEventsService.subscribeTo('DELETE_BASE_CONTENT_TYPE').pluck('data').subscribe( contentTypeViewRemoved => {
            let structureTypeView: StructureTypeView = this.getStructureTypeView(contentTypeViewRemoved.type);
            structureTypeView.types = structureTypeView.types.filter(
                contentTypeView => contentTypeView.inode !== contentTypeViewRemoved.inode);
            this._structureTypeView$.next(this.structureTypeView);
        });
    }

    get structureTypeView$(): Observable<StructureTypeView[]>{
        return this._structureTypeView$.asObservable();
    }

    private loadContentTypes(): void {
        this.coreWebService.requestView({
            method: RequestMethod.Get,
            url: 'v1/content/types'
        }).pluck('entity').subscribe(
            structureTypeView => {
                this.structureTypeView = structureTypeView;
                this._structureTypeView$.next(structureTypeView);
            }
        );
    }

    private getStructureTypeView(type: string): StructureTypeView {
        return this.structureTypeView.filter(structureTypeView => structureTypeView.name === type)[0];
    }
}

export interface ContentTypeView {
    'type': StructureType;
    'name': string;
    'inode': string;
    'action': string;
}

export interface StructureTypeView {
    'name': string;
    'label': string;
    'types': ContentTypeView[];
}

export enum StructureType {
    CONTENT,
    HTMLPAGE,
    FILEASSET,
    WIDGET,
    PERSONA,
}
