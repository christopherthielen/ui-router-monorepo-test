import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComposeComponent } from './compose.component';
import { MessageComponent } from './message.component';
import { MessageListComponent } from './message-list.component';
import { MymessagesComponent } from './mymessages.component';
import { UIRouterModule } from 'ui-router-ng2';
import { MYMESSAGES_STATES } from './mymessages.states';
import { FormsModule } from '@angular/forms';
import { MessagesService } from './messages.service';
import { FoldersService } from './folders.service';

@NgModule({
  imports: [
    UIRouterModule.forChild({ states: MYMESSAGES_STATES }),
    FormsModule,
    CommonModule
  ],
  declarations: [
    ComposeComponent,
    MessageComponent,
    MessageListComponent,
    MymessagesComponent
  ],
  providers: [
    MessagesService,
    FoldersService,
  ]
})
export class MymessagesModule { }
