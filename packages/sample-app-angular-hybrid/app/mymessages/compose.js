let template = `
<div class="compose">
  <div class="header">
    <div class="flex-h"> <label>Recipient</label> <input type="text" id="to" name="to" ng-model="vm.message.to"> </div>
    <div class="flex-h"> <label>Subject</label> <input type="text" id="subject" name="subject" ng-model="vm.message.subject"> </div>
  </div>

  <div class="body">
    <textarea name="body" id="body" ng-model="vm.message.body" cols="30" rows="20"></textarea>
    <div class="buttons">
      <button class="btn btn-primary" ng-click="vm.goPrevious()"><i class="fa fa-times-circle-o"></i><span>Cancel</span></button>
      <button class="btn btn-primary" ng-click="vm.save(vm.message)"><i class="fa fa-save"></i><span>Save as Draft</span></button>
      <button class="btn btn-primary" ng-click="vm.send(vm.message)"><i class="fa fa-paper-plane-o"></i><span>Send</span></button>
    </div>
  </div>
</div>
`;

function ComposeController(AppConfig, $stateParams, $state, $transition$, statusApi, Messages) {
  this.goPrevious = function() {
    let hasPrevious = !!$transition$.from().name;
    let state = hasPrevious ? $transition$.from() : "mymessages.folder";
    let params = hasPrevious ? $transition$.params("from") : {};
    $state.go(state, params);
  };

  this.message = angular.extend({ from: AppConfig.emailAddress }, $stateParams.message);
  this.pristine = angular.copy(this.message);
  statusApi.isDirty = () => !angular.equals(this.pristine, this.message);
  resetPristine = () => this.pristine = this.message;

  this.send = (message) =>
      Messages.save(angular.extend(message, { date: new Date(), read: true, folder: 'sent' })).then(resetPristine).then(this.goPrevious);
  this.save = (message) =>
      Messages.save(angular.extend(message, { date: new Date(), read: true, folder: 'drafts' })).then(resetPristine).then(this.goPrevious);
}

let composeState = {
  name: 'mymessages.compose',
  url: '/compose',
  params: {
    message: {}
  },
  resolve: {
    statusApi: () => ({
      isDirty: () => false
    })
  },
  onExit: (dialogService, statusApi) => {
    if (statusApi.isDirty())
      return dialogService.confirm('You have not saved this message.', 'Navigate away and lose changes?', "Yes", "No");
  },
  controller: ComposeController,
  controllerAs: 'vm',
  views: {
    "!$default.$default": {
      template: template
    }
  }
};

export {composeState};