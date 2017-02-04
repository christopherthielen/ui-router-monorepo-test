import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome.component';
import { LoginComponent } from './login.component';
import { HomeComponent } from './home.component';
import { UIRouterModule, UIView } from 'ui-router-ng2';
import { APP_STATES } from './app.states';
import { GlobalModule } from './global/global.module';
import { routerConfigFn } from './router.config';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    LoginComponent,
    HomeComponent
  ],
  imports: [
    UIRouterModule.forRoot({
      states: APP_STATES,
      otherwise: { state: 'home' },
      config: routerConfigFn,
    }),
    GlobalModule,
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [UIView]
})
export class AppModule { }
