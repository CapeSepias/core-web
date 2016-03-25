import {bootstrap} from 'angular2/bootstrap'
import {
    Attribute,
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    Optional
} from 'angular2/core'
import {Control, Validators, NgControl, ControlValueAccessor} from 'angular2/common'
import {isBlank} from 'angular2/src/facade/lang';
/**
 * Angular 2 wrapper around Semantic UI Input Element.
 * @see http://semantic-ui.com/elements/input.html
 */
@Component({
  selector: 'cw-input-text',
  host: {'role': 'text'},
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div flex layout="row" layout-wrap class="ui fluid input"  [ngClass]="{disabled: disabled, icon: icon, required: required}">
    <input flex
           type="{{type}}"
           [value]="_modelValue"
           [disabled]="disabled"
           [readonly]="readonly"
           tabindex="{{tabIndex || ''}}"
           placeholder="{{placeholder}}"
           (blur)="onBlur($event)"
           (change)="$event.stopPropagation()"
           (input)="onChange($event.target.value)" />
    <i [ngClass]="icon" *ngIf="icon"></i>
</div>
  `,
  directives: []
})
  export class InputText implements ControlValueAccessor {

  @Input() placeholder:string = ""
  @Input() type:string = "text"
  @Input() icon:string
  @Input() disabled:boolean = false
  @Input() readonly:boolean = false
  @Input() focused:boolean = false
  @Input() tabIndex:number = null
  @Input() required:boolean = false



  @Output() blur:EventEmitter<any> = new EventEmitter()

  errorMessage:string
  onChange:Function
  onTouched:Function

  private _modelValue:any
  
  constructor( @Optional() control:NgControl, private _elementRef:ElementRef) {
    if(control){
      control.valueAccessor = this;
    }
  }

  ngOnChanges(change) {
    if (change.focused) {
      let f = change.focused.currentValue === true || change.focused.currentValue == 'true'
      if (f) {
        let el = this._elementRef.nativeElement
        el.children[0].children[0].focus()
      }
    }
  }

  @Input()
  set value(v:string){
    this.writeValue(v)
  }
  get value():string {
    return this._modelValue
  }

  onBlur(value) {
    this.onTouched()
    this.blur.emit(value)
  }

  writeValue(value:any) {
    this._modelValue = isBlank(value) ? '' : value
    this._elementRef.nativeElement.firstElementChild.firstElementChild.setAttribute('value', this._modelValue)
  }

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }
}

