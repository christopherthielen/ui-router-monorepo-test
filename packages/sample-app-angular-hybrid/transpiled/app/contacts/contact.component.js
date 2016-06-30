"use strict";
var ngmodule_1 = require("../bootstrap/ngmodule");
exports.contactComponent = "contact";
var contactTemplate = "\n<div class=\"contact\">\n  <div class=\"flex-h\">\n    <div class=\"details\">\n      <h3>{{$ctrl.contact.name.first}} {{$ctrl.contact.name.last}}</h3>\n      <div><label>Company</label><div>{{$ctrl.contact.company}}</div></div>\n      <div><label>Age</label><div>{{$ctrl.contact.age}}</div></div>\n      <div><label>Phone</label><div>{{$ctrl.contact.phone}}</div></div>\n      <div><label>Email</label><div>{{$ctrl.contact.email}}</div></div>\n      <div class=\"flex-h\">\n        <label>Address</label>\n        <div>{{$ctrl.contact.address.street}}<br>\n              {{$ctrl.contact.address.city}}, {{$ctrl.contact.address.state}} {{$ctrl.contact.address.zip}}\n        </div>\n      </div>\n    </div>\n\n    <div class=\"flex nogrow\">\n      <img ng-src=\"{{$ctrl.contact.picture}}\"/>\n    </div>\n  </div>\n\n  <!-- This button has an ui-sref to the mymessages.compose state. The ui-sref provides the mymessages.compose\n       state with an non-url parameter, which is used as the initial message model -->\n  <button class=\"btn btn-primary\" ui-sref=\"mymessages.compose({ message: { to: $ctrl.contact.email } })\">\n    <i class=\"fa fa-envelope\"></i><span>Message</span>\n  </button>\n\n  <!-- This button has a relative ui-sref to the contacts.contact.edit state. -->\n  <button class=\"btn btn-primary\" ui-sref=\".edit\">\n    <i class=\"fa fa-pencil\"></i><span>Edit Contact</span>\n  </button>\n</div>";
ngmodule_1.ngmodule.component(exports.contactComponent, {
    bindings: { contact: '<' },
    template: contactTemplate
});
//# sourceMappingURL=contact.component.js.map