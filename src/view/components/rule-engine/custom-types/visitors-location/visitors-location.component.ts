import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from 'angular2/core';
import {FORM_DIRECTIVES, CORE_DIRECTIVES, DecimalPipe, Control} from "angular2/common";
import {AreaPickerDialogComponent} from "../../../../../view/components/common/google-map/area-picker-dialog.component";
import {Observable} from "rxjs/Observable";
import {Dropdown, InputOption} from "../../../semantic/modules/dropdown/dropdown";
import {InputText} from "../../../semantic/elements/input-text/input-text";
import {GCircle} from "../../../../../api/maps/GoogleMapService";

interface Param<T> {
  key:string
  priority?:number
  value:T
}

interface VisitorsLocationParams {
  comparison:Param<string>
  latitude:Param<number>
  longitude:Param<number>
  radius:Param<number>
  preferredDisplayUnits:Param<string>


}

const UNITS = {
  mi: {
    toMeters: ((len) => len * 1609.34),
    toMiles: ((len) => len  ),
    toKm: ((len) => len / 1.60934),
  },
  km: {
    toMeters: ((len) => len * 1000),
    toMiles: ((len) => len / 1.60934 ),
    toKm: ((len) => len),
  },
  m: {
    toMeters: ((len) => len ),
    toKm: ((len) => len / 1000),
    toMiles: ((len) => len / 1609.34 ),
  }

}
const I8N_BASE:string = 'api.sites.ruleengine'
@Component({
  selector: 'cw-visitors-location-component',
  providers:[DecimalPipe],
  directives: [FORM_DIRECTIVES, CORE_DIRECTIVES, AreaPickerDialogComponent, Dropdown, InputOption, InputText],
  template: `<div flex layout="row" class="cw-condition-component-body" *ngIf="comparisonDropdown != null">

  <cw-input-dropdown flex
                     class="cw-input"
                     [ngFormControl]="comparisonDropdown.control"
                     [required]="true"
                     [class.cw-comparator-selector]="true"
                     (change)="comparisonChange.emit($event)"
                     placeholder="{{comparisonDropdown.placeholder}}">
    <cw-input-option *ngFor="#opt of comparisonDropdown.options"
                     [value]="opt.value"
                     [label]="opt.label"
                     icon="{{opt.icon}}"></cw-input-option>
  </cw-input-dropdown>
  <div flex="15" layout-fill layout="row" layout-align="start center" class="cw-input">
    <cw-input-text
        flex
        [type]="text"
        [value]="getRadiusInPreferredUnit() | number:'1.0-0'"
        [readonly]="true">
    </cw-input-text>
    <label class="cw-input-label-right">{{preferredUnit}}</label>
  </div>
  <div flex layout-fill layout="row" layout-align="start center" class="cw-input">
    <label class="cw-input-label-left">{{fromLabel}}</label>
    <cw-input-text
        flex
        [type]="text"
        [value]="getLatLong()"
        [readonly]="true">
    </cw-input-text>
  </div>
  <div flex layout="column" class="cw-input cw-last">
    <button class="ui button cw-button-add" aria-label="Show Map" (click)="toggleMap()">
      <i class="plus icon" aria-hidden="true"></i>Show Map
    </button>
  </div>
</div>
<cw-area-picker-dialog-component
    [headerText]="'Select an area'"
    [hidden]="!showingMap"
    [apiKey]="apiKey"
    [circle]="circle"
    (circleUpdate)="onUpdate($event)"
    (cancel)="showingMap = !showingMap"
></cw-area-picker-dialog-component>
`,  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class VisitorsLocationComponent {


  @Input() circle:GCircle = {center: {lat:38.89, lng: -77.04}, radius: 10000}
  @Input() comparisonValue:string
  @Input() comparisonControl:Control
  @Input() comparisonOptions:{}[]
  @Input() comparisonLabel:string
  @Input() fromLabel:string = 'from'
  @Input() changedHook:number = 0

  @Output() areaChange:EventEmitter<GCircle> = new EventEmitter(false)
  @Output() comparisonChange:EventEmitter<string> = new EventEmitter(false)

  showingMap:boolean = false
  comparisonDropdown:any
  apiKey:string
  preferredUnit:string = 'm'
  private _rsrcCache:{[key:string]:Observable<string>}

  oldRadius:number = 0

  constructor(public decimalPipe:DecimalPipe) {
    console.log("VisitorsLocationComponent", "constructor")
  }

  ngOnChanges(change){
    console.log("VisitorsLocationComponent", "ngOnChanges", change)

    if(change.comparisonOptions){
      this.comparisonDropdown = {
        name: 'comparison',
        control: this.comparisonControl,
        placeholder: '',
        value: this.comparisonValue,
        options: this.comparisonOptions
      }
    }
  }

  getLatLong():string{
    let lat = this.circle.center.lat
    let lng = this.circle.center.lng
    let latStr = this.decimalPipe.transform(parseFloat(lat+''), ['1.6-6'])
    let lngStr = this.decimalPipe.transform(parseFloat(lng+''), ['1.6-6'])
    return latStr + ', ' + lngStr
  }

  getRadiusInPreferredUnit():number{
    let r = this.circle.radius
    console.log("VisitorsLocationComponent", "getRadiusInPreferredUnit", r)
    return UNITS[this.preferredUnit].toMeters(r)
  }

  toggleMap(){
    this.showingMap = !this.showingMap
    // this.apiKey = "AIzaSyBqi1S9mgFHW7J-PkAp1hd1VWRKILgkL-8"
    this.apiKey = ""
  }

  onUpdate(circle:GCircle){
    this.showingMap = false
    this.areaChange.emit(circle)
  }


  delayedValue(value:string, delay:number){
    return Observable.timer(delay).map(x => value)
  }

}


