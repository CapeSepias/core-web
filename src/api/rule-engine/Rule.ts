/// <reference path="../../../jspm_packages/npm/angular2@2.0.0-alpha.44/angular2.d.ts" />
/// <reference path="../../../jspm_packages/npm/@reactivex/rxjs@5.0.0-alpha.4/dist/cjs/Rx.KitchenSink.d.ts" />

import {Inject, EventEmitter} from 'angular2/angular2';
import * as Rx from '@reactivex/rxjs@5.0.0-alpha.4/dist/cjs/Rx.KitchenSink'


import {ApiRoot} from 'api/persistence/ApiRoot';
import {CwChangeEvent} from "api/util/CwEvent";
import {CwModel} from "api/util/CwModel";
import {EntityMeta, EntitySnapshot} from 'api/persistence/EntityBase'
import {ActionService, ActionModel} from "api/rule-engine/Action";
import Condition = protractor.until.Condition;
import {ConditionGroupService, ConditionGroupModel} from "./ConditionGroup";


export class RuleModel extends CwModel {
  snapshot:EntitySnapshot // annoying hack, this should die.
  private _name:string
  private _enabled:boolean
  private _fireOn:string


  private _groups:{ [key: string]: ConditionGroupModel }
  actions:{ [key: string]: boolean }


  constructor(key:string = null) {
    super(key)
    this.name = ''
    this._fireOn = 'EVERY_PAGE'
    this._enabled = false
    this.valid = this.isValid()
    this.actions = {}
    this._groups = {}
  }

  get fireOn():string {
    return this._fireOn;
  }

  set fireOn(value:string) {
    this._fireOn = value;
    this._changed('fireOn');
  }


  get enabled():boolean {
    return this._enabled;
  }

  set enabled(value:boolean) {
    this._enabled = value === true;
    this._changed('enabled');
  }

  get name():string {
    return this._name;
  }

  set name(value:string) {
    this._name = value;
    this._changed('name');
  }

  addGroup(group:ConditionGroupModel) {
    this._groups[group.key] = group
    this._changed('addGroup')
  }

  removeGroup(group:ConditionGroupModel) {
    delete this._groups[group.key]
    this._changed('removeGroup')
  }

  get groups():{ [key: string]: ConditionGroupModel } {
    // @todo clone this object.
    return this._groups
  }

  isValid() {
    let valid = !!this.name
    valid = valid && this.name.trim().length > 0
    return valid
  }

}

export class RuleService {
  ref:EntityMeta
  _removed:EventEmitter
  _added:EventEmitter
  onRemove:Rx.Observable
  onAdd:Rx.Observable

  constructor(@Inject(ApiRoot) apiRoot:ApiRoot,
              @Inject(ActionService) actionService:ActionService,
              @Inject(ConditionGroupService) conditionGroupService:ConditionGroupService) {
    this.ref = apiRoot.defaultSite.child('ruleengine/rules')
    this._added = new EventEmitter()
    this._removed = new EventEmitter()
    let onAdd = Rx.Observable.from(this._added.toRx())
    let onRemove = Rx.Observable.from(this._removed.toRx())
    this.onAdd = onAdd.share()
    this.onRemove = onRemove.share()

    actionService.onAdd.subscribe((actionModel:ActionModel) => {
      if (!actionModel.owningRule.actions[actionModel.key]) {
        actionModel.owningRule.actions[actionModel.key] = true
        this.save(actionModel.owningRule)
      }
    })

    actionService.onRemove.subscribe((actionModel:ActionModel) => {
      if (actionModel.owningRule.actions[actionModel.key]) {
        delete actionModel.owningRule.actions[actionModel.key]
        this.save(actionModel.owningRule)
      }
    })

    conditionGroupService.onAdd.subscribe((groupModel:ConditionGroupModel) => {
      if (!groupModel.owningRule.groups[groupModel.key]) {
        groupModel.owningRule.groups[groupModel.key] = groupModel
      }
    })

    conditionGroupService.onRemove.subscribe((groupModel:ConditionGroupModel) => {
      if (!groupModel.owningRule.groups[groupModel.key]) {
        delete groupModel.owningRule.groups[groupModel.key]
      }
    })
  }


  static toJson(rule:RuleModel):any {
    let json:any = {}
    json.key = rule.key
    json.enabled = rule.enabled
    json.fireOn = rule.fireOn
    json.name = rule.name
    json.priority = rule.priority
    json.conditionGroups = ConditionGroupService.toJsonList(rule.groups)
    json.ruleActions = rule.actions
    return json
  }

  static fromSnapshot(key, snapshot:EntitySnapshot):RuleModel {
    let rule = new RuleModel(key)
    let val:any = snapshot.val()
    rule.snapshot = snapshot
    rule.enabled = val.enabled
    rule.fireOn = val.fireOn
    rule.name = val.name
    rule.priority = val.priority
    rule.actions = val.ruleActions
    let groups = snapshot.child('conditionGroups')
    if(groups.exists()){
      groups.forEach((groupSnap) => {
        rule.addGroup(ConditionGroupService._fromSnapshot(rule, groupSnap))
      })
    }
    return rule

  }

  get(key:string, cb:Function) {
    this.ref.child(key).once('value', (snap) => {
      let rule = RuleService.fromSnapshot(key, snap)
      cb(rule)
    })
  }

  list():Rx.Observable {
    this.ref.once('value', (snap) => {
      let rules = snap['val']()
      Object.keys(rules).forEach((key) => {
        let rule = RuleService.fromSnapshot(key, snap.child(key))
        this._added.next(rule)
      })
    })
    return this.onAdd
  }

  add(rule:RuleModel, cb:Function = null) {
    this.ref.push(RuleService.toJson(rule), (resultSnapshot) => {
      rule.snapshot = resultSnapshot
      rule.key = resultSnapshot.key()
      this._added.next(rule)
      if (cb) {
        cb(rule)
      }
    }).catch((e)=> {
      console.log("Error pushing new rule: ", e)
      throw e
    })
  }

  save(rule:RuleModel, cb:Function = null) {
    if (!rule.isValid()) {
      throw new Error("Rule is not valid, cannot save.")
    }
    if (!rule.isPersisted()) {
      this.add(rule, cb)
    } else {
      this.ref.child(rule.key).set(RuleService.toJson(rule), ()=> {
        if(cb){
          cb(rule)
        }
      })
    }
  }

  remove(rule:RuleModel) {
    if (rule.isPersisted()) {
      rule.snapshot.ref().remove((key)=> {
        this._removed.next(rule)
      }).catch((e) => {
        console.log("Error removing rule", e)
        throw e
      })
    }
  }
}

