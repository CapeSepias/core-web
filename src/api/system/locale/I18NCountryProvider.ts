/// <reference path="../../../../typings/angular2/angular2.d.ts" />
import {Inject} from 'angular2/angular2';

import {ApiRoot} from 'api/persistence/ApiRoot';

export class I18NCountryProvider {
  countryRef:EntityMeta
  byIsoCode: any
  byName: any
  names: Array<string>
  promise:Promise
  userLocale:string

  constructor(@Inject(ApiRoot) apiRoot) {
    this.byIsoCode = {}
    this.byName = {}
    this.names = []
    this.userLocale = apiRoot.userModel.locale //i.e. 'en-US'
    this.countryRef = apiRoot.resourceRef.child(this.userLocale + '/system/locale/country')//i.e.'en-US/system/locale/country'
    this.init();
  }

  init() {
    this.promise = new Promise((resolve, reject) => {
      this.countryRef.once('value', (snap:EntitySnapshot) => {
        this.byIsoCode = snap.val()
        Object.keys(this.byIsoCode).forEach((key)=>{
          let country = this.byIsoCode[key]
          this.names.push(country.name)
          this.byName[country.name] = key
        })
        this.names.sort()
        resolve(this);
      })
    });
  }
}



