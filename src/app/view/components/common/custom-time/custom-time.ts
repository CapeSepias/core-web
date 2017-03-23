import {Component, ViewEncapsulation, Input} from '@angular/core';
import {FormatDateService} from "../../../../api/services/format-date-service";
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName,
    selector: 'custom-time',
    styleUrls: ['custom-time.css'],
    templateUrl: ['custom-time.html'],

})
export class CustomTimeComponent {
    @Input() time;

    private formattedTime:Subject<string> = new BehaviorSubject('');

    constructor(private formatDateService: FormatDateService) {

    }

    ngOnInit(): void {
        this.formattedTime.next(this.formatDateService.getRelative(this.time));
    }

    // TODO: this it's running every time the UI changes no matter where, need to fix it, should only run when custom-time shows
    ngAfterViewChecked() {
        // TODO: this is triggering even when open other dropdown component instance, need to check that.
        this.formattedTime.next(this.formatDateService.getRelative(this.time));
    }
}