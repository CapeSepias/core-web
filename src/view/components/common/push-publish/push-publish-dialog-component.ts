import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from "@angular/core";
import {Dropdown, InputOption} from "../../semantic/modules/dropdown/dropdown";
import {ModalDialogComponent} from "../modal-dialog/dialog-component";
import {IPublishEnvironment} from "../../../../api/services/bundle-service";

@Component({
  selector: 'cw-push-publish-dialog-component',
  directives: [ModalDialogComponent, Dropdown, InputOption],
  template: `<cw-modal-dialog
    [headerText]="'Push Publish'"
    [okButtonText]="'Push'"
    [hidden]="hidden"
    [okEnabled]="selectedEnvironmentId != null"
    [errorMessage]="errorMessage"
    width="25em"
    height="auto"
    (ok)="doPushPublish.emit(selectedEnvironmentId)"
    (cancel)="cancel.emit()">
  <cw-input-dropdown
      flex
      [value]="environmentStores[0]?.id"
      (click)="$event.stopPropagation()"
      (change)="setSelectedEnvironment($event)">
    <cw-input-option
        *ngFor="let opt of environmentStores"
        [value]="opt.id"
        [label]="opt.name"
    ></cw-input-option>
  </cw-input-dropdown>
</cw-modal-dialog>`
  , changeDetection: ChangeDetectionStrategy.OnPush
})
export class PushPublishDialogComponent {
  @Input() hidden:boolean = false
  @Input() environmentStores:IPublishEnvironment[];
  @Input() errorMessage:string = null

  @Output() close:EventEmitter<{isCanceled:boolean}> = new EventEmitter(false)
  @Output() cancel:EventEmitter<boolean> = new EventEmitter(false)
  @Output() doPushPublish:EventEmitter<IPublishEnvironment> = new EventEmitter(false)

  public selectedEnvironmentId:string;

  constructor() { }

  ngOnChanges(change){
    if (change.environmentStores) {
      this.selectedEnvironmentId = change.environmentStores.currentValue[0];
      //console.log("PushPublishDialogComponent", "ngOnChanges", change.environmentStores.currentValue)
    }
  }

  setSelectedEnvironment(environmentId:string) {
    this.selectedEnvironmentId = environmentId
  }
}

