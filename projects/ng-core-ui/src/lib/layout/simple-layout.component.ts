import {
  Component,
  computed,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import {SystemService} from '../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import {LIB_APP_ID, LIB_APP_VERSION,LIB_APP_SHA} from '../main';

@Component({
  selector: 'app-simple-layout',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    RouterOutlet,
  ],
  templateUrl: './simple-layout.component.html',
  styleUrls: ['./simple-layout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleLayoutComponent implements OnInit {

  private router :Router = inject(Router);

  private system :SystemService = inject(SystemService);

  public appId :string =    inject(LIB_APP_ID);
  public appSha:string =  inject(LIB_APP_SHA);
  public appVersion:string =  inject(LIB_APP_VERSION);

  whoami = this.system.whoamiSig;
  environment = this.system.environmentSig;
  apps = this.system.appsSig;
  contexts = this.system.contextsSig;
  currentAppId = this.appId;

  currentPageTitle = computed(() => {
    const apps = this.apps();
    const currentApp = apps?.find(app => app.id === this.currentAppId);
    if (currentApp) {
      return currentApp.description || currentApp.id;
    }
    return 'Enterprise App';
  });

  ngOnInit() {
    this.system.bootstrap();
  }
}
