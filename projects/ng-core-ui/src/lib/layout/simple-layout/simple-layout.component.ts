declare const AppSha: string;
declare const AppVersion: string;

import {
  Component,
  computed,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SystemService} from '../../system/system.service';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';

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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class SimpleLayoutComponent implements OnInit {

  private system: SystemService = inject(SystemService);

  whoami = this.system.whoamiSig;
  environment = this.system.environmentSig;
  sites = this.system.sitesSig;
  appSha = computed(() => AppSha);
  appVersion = computed(() => AppVersion);

  currentPageTitle = computed(() => this.environment()?.appDescription || 'Enterprise App');

  ngOnInit() {
    this.system.bootstrap().catch(err => console.error('Bootstrap error in SimpleLayout', err));
  }
}
