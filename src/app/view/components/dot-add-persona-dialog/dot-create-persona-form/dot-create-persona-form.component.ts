import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Site, SiteService } from 'dotcms-js';
import { take, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DotMessageService } from '@services/dot-messages-service';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

@Component({
    selector: 'dot-create-persona-form',
    templateUrl: './dot-create-persona-form.component.html',
    styleUrls: ['./dot-create-persona-form.component.scss']
})
export class DotCreatePersonaFormComponent implements OnInit, OnDestroy {
    @Output() value: EventEmitter<FormGroup> = new EventEmitter();

    form: FormGroup;
    imageName: string;
    messagesKey: { [key: string]: string } = {};

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        public dotMessageService: DotMessageService,
        private fb: FormBuilder,
        private siteService: SiteService
    ) {}

    ngOnInit() {
        this.dotMessageService
            .getMessages([
                'modes.persona.upload.file',
                'modes.persona.name',
                'modes.persona.key.tag',
                'dot.common.choose',
                'dot.common.remove',
                'modes.persona.host',
                'error.form.mandatory'
            ])
            .pipe(take(1))
            .subscribe((messages: { [key: string]: string }) => {
                this.messagesKey = messages;
            });
        this.initPersonaForm();
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    /**
     * Handle the response of the p-fileUpload to update the form.
     *
     * @param {any} event
     * @memberof DotPersonaSelectorComponent
     */
    onFileUpload(event: any) {
        const response = JSON.parse(event.xhr.response);
        this.imageName = event.files[0].name;
        this.form.get('photo').setValue(response.tempFiles[0].id);
    }

    /**
     * Remove selected image.
     *
     * @memberof DotPersonaSelectorComponent
     */
    removeImage(): void {
        this.imageName = null;
        this.form.get('photo').setValue('');
    }

    /**
     * Update the site identifier in th form.
     *
     * @memberof DotPersonaSelectorComponent
     */
    siteChange(site: Site) {
        this.form.get('hostFolder').setValue(site.identifier);
    }

    /**
     * Set the key tag attribute with camelCase standard based on the name.
     *
     * @memberof DotPersonaSelectorComponent
     */
    setKeyTag(): void {
        this.form.get('keyTag').setValue(_.camelCase(this.form.get('name').value));
    }

    // /**
    //  * Call when a new persona is added and propagate set it as current.
    //  *
    //  * @memberof DotPersonaSelectorComponent
    //  */
    // savePersona(): void {
    //     if (this.newPersonaForm.valid) {
    //         this.dotContentService
    //             .create(this.newPersonaForm.getRawValue())
    //             .pipe(take(1))
    //             .subscribe((persona: DotPersona) => {
    //                 this.getPersonasList();
    //                 this.personaChange(persona);
    //                 this.addDialogVisible = false;
    //             });
    //     }
    // }

    private initPersonaForm(): void {
        this.imageName = null;
        this.form = this.fb.group({
            hostFolder: [this.siteService.currentSite.identifier, [Validators.required]],
            keyTag: [{ value: '', disabled: true }, [Validators.required]],
            name: ['', [Validators.required]],
            photo: ['', [Validators.required]],
            contentType: 'persona'
        });

        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.value.emit(this.form);
        });
        //
        // this.dialogActions = {
        //     accept: {
        //         action: () => {
        //             this.savePersona();
        //         },
        //         label: 'accept',
        //         disabled: !this.newPersonaForm.valid
        //     },
        //     cancel: {
        //         label: 'cancel',
        //         action: () => {
        //             this.addDialogVisible = false;
        //         }
        //     }
        // };
    }
}
