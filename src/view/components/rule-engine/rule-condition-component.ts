/// <reference path="../../../../jspm_packages/npm/angular2@2.0.0-alpha.44/angular2.d.ts" />


import {Attribute, Component, Directive, View, NgFor, NgIf, EventEmitter, Inject} from 'angular2/angular2';

import {ApiRoot} from 'api/persistence/ApiRoot'
import {ConditionTypesProvider, ConditionTypeModel} from 'api/rule-engine/ConditionTypes';


import {BrowserConditionlet} from './conditionlets/browser-conditionlet/browser-conditionlet'
import {RequestHeaderConditionlet} from './conditionlets/request-header-conditionlet/request-header-conditionlet'
import {CountryCondition} from './conditionlets/country/country-condition'


@Component({
  selector: 'rule-condition',
  properties: ["conditionMeta", "index"]
})
@View({
  template: `<div flex layout="column" layout-align="center-start" class="cw-condition cw-entry">
  <div flex layout="row" layout-align="space-between-center">

    <div class="cw-btn-group" >
      <div class="ui basic icon buttons" (click)="toggleOperator()" *ng-if="index !== 0">
        <button flex="none" class="ui button cw-button-toggle-operator" aria-label="Swap And/Or" (click)="toggleOperator()">
          {{condition.operator}}
        </button>
      </div>
    </div>
    <div class="cw-spacer cw-condition-operator" (click)="toggleOperator()" *ng-if="index === 0"></div>
    <select [value]="conditionType?.id" (change)="setConditionlet($event.target.value)">
      <option value="{{conditionType.id}}" *ng-for="var conditionType of conditionTypes; var i=index">
        {{conditionType.name}}
      </option>
    </select>

    <cw-request-header-conditionlet
        flex="grow"
        *ng-if="conditionType?.id == 'UsersBrowserHeaderConditionlet'"
        [comparator-value]="condition?.comparison"
        [comparison-values]="conditionValue"
        (change)="conditionChanged($event)">
    </cw-request-header-conditionlet>
    <cw-browser-conditionlet
        flex="grow"
        *ng-if="conditionType?.id == 'UsersBrowserConditionlet'">
    </cw-browser-conditionlet>
    <cw-country-condition
        flex="grow"
        *ng-if="conditionType?.id == 'UsersCountryConditionlet'"
        [comparator-value]="condition?.comparison"
        [comparison-values]="conditionValue"
        (change)="conditionChanged($event)">
    </cw-country-condition>

    <div class="cw-btn-group">
      <div class="ui basic icon buttons">
        <button class="ui button" aria-label="Delete Condition" (click)="removeCondition()">
          <i class="trash icon" (click)="removeCondition()"></i>
        </button>
    </div>
  </div>
`,
  directives: [NgIf, NgFor,
    RequestHeaderConditionlet,
    CountryCondition,
    BrowserConditionlet
  ]
})
class ConditionComponent {
  index:number
  _conditionMeta:any
  condition:any
  conditionValue:string
  conditionType:ConditionTypeModel
  conditionTypes:Array<any>
  typesProvider:ConditionTypesProvider

  constructor(@Inject(ApiRoot) apiRoot:ApiRoot, @Inject(ConditionTypesProvider) typesProvider:ConditionTypesProvider) {
    this.conditionType = new ConditionTypeModel('', {})
    this.conditionTypes = []
    this.typesProvider = typesProvider
    typesProvider.promise.then(()=> {
      this.conditionTypes = typesProvider.ary
    })
    this.condition = {}
    this.conditionValue = ''
    this.index = 0
  }

  onSetConditionMeta(snapshot) {
    this.condition = snapshot.val()
    this.typesProvider.promise.then(() => {
      this.conditionType = this.typesProvider.getType(this.condition.conditionlet)
      this.conditionValue = this.condition.values
    } );

  }

  set conditionMeta(conditionRef) {
    this._conditionMeta = conditionRef
    conditionRef.once('value', this.onSetConditionMeta.bind(this))
  }

  get conditionMeta() {
    return this._conditionMeta;
  }


  setConditionlet(conditionTypeId) {
    let newVal = ''
    this.conditionType = this.typesProvider.getType(conditionTypeId)
    this.conditionValue = newVal
    this.condition.conditionlet = conditionTypeId
    this.condition.values = {}
    this.updateCondition()
  }

  toggleOperator() {
    this.condition.operator = this.condition.operator === 'AND' ? 'OR' : 'AND'
    this.updateCondition()
  }


  updateCondition() {
    this.conditionMeta.set(this.condition)
  }

  removeCondition() {
    this.conditionMeta.remove()
  }


  conditionChanged(event) {
    let target = event.ngTarget
    let val = target.value
    let parameterKeys = val['parameterKeys']
    let oldVals = this.condition.values

    parameterKeys.forEach((key)=>{
      let oldVal = oldVals[key]
      let id = oldVal ? oldVal.id : ''
      this.condition.values[key] = {
        id: id,
        key: key,
        value: val[key] || oldVal[key],
        priority: 0
      }
    })

    this.condition.comparison = val.comparatorValue

    this.updateCondition()

  }
}

export {ConditionComponent}