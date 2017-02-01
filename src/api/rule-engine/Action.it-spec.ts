import * as Rx from 'rxjs/Rx'

import {RuleModel, RuleService, ActionModel} from '../../api/rule-engine/Rule';
import {Injector} from '@angular/core';
import {ApiRoot} from '../../api/persistence/ApiRoot';
import {UserModel} from "../../api/auth/UserModel";
import {ActionService} from "../../api/rule-engine/Action";
import {ConditionGroupService} from "../../api/rule-engine/ConditionGroup";
import {ConditionService} from "../../api/rule-engine/Condition";
import {I18nService} from "../system/locale/I18n";
import {HTTP_PROVIDERS} from "@angular/http";

var injector = Injector.resolveAndCreate([ApiRoot,
  I18nService,
  UserModel,
  RuleService,
  ActionService,
  ConditionService,
  ConditionGroupService,
  HTTP_PROVIDERS
])


describe('Integration.api.rule-engine.ActionService', function () {

  var ruleService:RuleService
  var ruleOnAddSub:Rx.Subscription<RuleModel>

  var actionService:ActionService
  var ruleUnderTest:RuleModel
  var actionTypes = {}
  var setSessionActionlet

  beforeAll(function (done) {
    ruleService = injector.get(RuleService)
    actionService = injector.get(ActionService)
    ruleService.getRuleActionTypes().subscribe((typesAry)=> {
      typesAry.forEach((item) => actionTypes[item.key] = item)
      setSessionActionlet = actionTypes["SetSessionAttributeActionlet"]
      done()
    })
  })

  beforeEach(function (done) {
    Gen.createRules(ruleService)
    ruleOnAddSub = ruleService.loadRules().subscribe((rule:RuleModel[]) => {
      ruleUnderTest = rule[0]
      done()
    }, (err) => {
      expect(err).toBeUndefined("error was thrown.")
      done()
    })
  });

  afterEach(function (done) {
    ruleService.deleteRule(ruleUnderTest.key).subscribe(()=> {
      ruleUnderTest = null
      ruleOnAddSub.unsubscribe()
      done()
    });
  })

  it("Has rules that we can add actions to", function () {
    expect(ruleUnderTest.isPersisted()).toBe(true)
  })

  it("Can add a new Action", function (done) {
    console.log("can add new", setSessionActionlet)
    var anAction = new ActionModel(null, setSessionActionlet)
    anAction.setParameter("sessionKey", "foo")
    anAction.setParameter("sessionValue", "bar")

    actionService.createRuleAction(ruleUnderTest.key, anAction).subscribe((action:ActionModel) => {
      expect(action.isPersisted()).toBe(true, "Action is not persisted!")
      done()
    })
  })

  it("Action being added to the owning rule is persisted to server.", function (done) {
    var anAction = new ActionModel(null, setSessionActionlet)
    anAction.setParameter("sessionKey", "foo")
    anAction.setParameter("sessionValue", "bar")

    actionService.createRuleAction(ruleUnderTest.key, anAction).subscribe((action:ActionModel) => {
      ruleService.updateRule(ruleUnderTest.key, ruleUnderTest).subscribe( () => {
        ruleService.loadRule(ruleUnderTest.key).subscribe( (rule:RuleModel)=> {
          expect(rule.ruleActions[action.key]).toBe(true)
          let sub = actionService.allAsArray(rule.key, Object.keys(rule.ruleActions)).subscribe((actions:ActionModel[])=> {
            console.log("Rule: ", rule)
            console.log("Rehydrated Rule: ", rule)
            console.log("Rehydrated Actions: ", actions)
            let rehydratedAction = actions[0]
            expect(rehydratedAction.getParameterValue("sessionKey")).toEqual("foo")
            sub.unsubscribe()
            done()
          }, (e)=> {
            console.log(e)
            expect(e).toBeUndefined("Test Failed")
          })
        })
      })
    })
  })

  it("Will add a new action parameters to an existing action.", function (done) {
    var clientAction = new ActionModel(null, setSessionActionlet)
    clientAction.setParameter("sessionKey", "foo")
    clientAction.setParameter("sessionValue", "bar")

    let key = "sessionKey"
    let value = "aParamValue"

    actionService.createRuleAction(ruleUnderTest.key, clientAction).subscribe( ()=> {
      expect(clientAction.isPersisted()).toBe(true, "Action is not persisted!")

      clientAction.setParameter(key, value)
      actionService.updateRuleAction(ruleUnderTest.key, clientAction).subscribe( ()=> {
        // savedAction is also the same instance as resultAction
        actionService.get(ruleUnderTest.key, clientAction.key).subscribe( (updatedAction)=> {
          // updatedAction and clientAction SHOULD NOT be the same instance object.
          updatedAction['abc123'] = 100
          expect(clientAction['abc123']).toBeUndefined()
          expect(clientAction.getParameterValue(key)).toBe(value)
          expect(updatedAction.getParameterValue(key)).toBe(value)
          done()
        })
      })
    })
  })

  it("Can update action parameter values on existing action.", function (done) {
    let param1 = {key: 'sessionKey', v1: 'value1', v2: 'value2'}
    let param2 = {key: 'sessionValue', v1: 'abc123', v2: 'def456'}

    var clientAction = new ActionModel(null, setSessionActionlet)
    clientAction.setParameter(param1.key, param1.v1)
    clientAction.setParameter(param2.key, param2.v1)

    actionService.createRuleAction(ruleUnderTest.key, clientAction).subscribe( ()=> {
      clientAction.setParameter(param1.key, param1.v2)
      actionService.updateRuleAction(ruleUnderTest.key, clientAction).subscribe( ()=> {
        actionService.get(ruleUnderTest.key, clientAction.key).subscribe( (updatedAction)=> {
          expect(updatedAction.getParameterValue(param1.key)).toBe(param1.v2)
          expect(updatedAction.getParameterValue(param2.key)).toBe(param2.v1)
          done()
        })
      })
    })

  })
});

class Gen {
  static createRules(ruleService:RuleService) {
    console.log('Attempting to create rule.')
    let rule = new RuleModel(null)
    rule.enabled = true
    rule.name = "TestRule-" + new Date().getTime()

    return ruleService.createRule(rule)
  }
}