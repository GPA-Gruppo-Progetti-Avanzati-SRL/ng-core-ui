import {ErrorPage} from '../../pages/error.page';

declare const AppSha: string;
declare const AppVersion: string;

import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SystemService} from '../../system/system.service';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';


@Component({
  selector: 'app-simple-layout',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    LoadingOverlayComponent,
    RouterOutlet,
    ErrorPage
  ],
  templateUrl: './simple-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class SimpleLayoutComponent {

  private system: SystemService = inject(SystemService);

  whoami = this.system.whoamiSig;
  environment = this.system.environmentSig;
  readonly appSha = AppSha;
  readonly appVersion = AppVersion;

  private readonly bootstrapFailed = signal(false);
  readonly layoutState = computed<'loading' | 'ready' | 'error'>(() => {
    if (this.bootstrapFailed()) return 'error';
    if (this.whoami())          return 'ready';
    return 'loading';
  });

  currentPageTitle = computed(() => this.environment()?.appDescription || 'Enterprise App');

  constructor() {
    this.system.bootstrap().catch(() => this.bootstrapFailed.set(true));
  }
}
