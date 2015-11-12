import {angular} from "angular"
import {SessionStorage} from "../util/sessionstorage"
import {uniqReduce} from "../util/util";
import {app} from "../app_module"

class Contact {
  constructor(raw) { angular.extend(this, raw); }
  toString = () => `${this.name.last}, ${this.name.first} <${this.email}>`
}

class ContactsService extends SessionStorage {
  constructor($http, $timeout, $q) {
    // http://beta.json-generator.com/api/json/get/V1g6UwwGx
    super($http, $timeout, $q, "contacts", "data/contacts.json");
  }
}

app.service("Contacts", ContactsService);
