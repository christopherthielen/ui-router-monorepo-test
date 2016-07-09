"use strict";
exports.welcome = {
    template: "\n    <div class=\"container-fluid\">\n    \n      <h3>UI-Router Sample App</h3>\n    \n      <p>Welcome to the sample app!</p>\n      <p>This is a demonstration app intended to highlight some patterns that can be used within UI-Router.\n        These patterns should help you to to build cohesive, robust apps.  Additionally, this app uses state-vis\n        to show the tree of states, and a transition log visualizer.</p>\n    \n      <h4>App Overview</h4>\n      <p>\n        First, start exploring the application's functionality at a high level by activating\n        one of the three submodules: Messages, Contacts, or Preferences. If you are not already logged in,\n        you will be taken to an authentication screen (the authentication is fake; the password is \"password\")\n        <div>\n          <button class=\"btn btn-primary\" ui-sref=\"mymessages\"><i class=\"fa fa-envelope\"></i><span>Messages</span></button>\n          <button class=\"btn btn-primary\" ui-sref=\"contacts\"><i class=\"fa fa-users\"></i><span>Contacts</span></button>\n          <button class=\"btn btn-primary\" ui-sref=\"prefs\"><i class=\"fa fa-cogs\"></i><span>Preferences</span></button>\n        </div>\n      </p>\n    \n      <h4>Patterns and Recipes</h4>\n      <ul>\n        <li>Require Authentication</li>\n        <li>Previous State</li>\n        <li>Redirect Hook</li>\n        <li>Default Param Values</li>\n      </ul>\n    </div>"
};
//# sourceMappingURL=welcome.component.js.map