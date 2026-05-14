import {ToastComponent} from '../../components/toast.component/toast.component';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';

import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SystemService } from '../../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {ConfirmComponent} from '../../components/confirm.component/confirm.component';
import {AlertComponent} from '../../components/alert.component/alert.component';
import {ErrorPage} from '../../pages/error.page';
import {AppSwitcherComponent} from '../app-switcher/app-switcher.component';

@Component({
  selector: 'app-right-layout',
  imports: [
    MatButtonModule,
    ToastComponent,
    ConfirmComponent,
    AlertComponent,
    LoadingOverlayComponent,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterOutlet,
    ErrorPage,
    AppSwitcherComponent,
  ],
  templateUrl: './right-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class RightLayoutComponent {

  private system = inject(SystemService);

  whoami = this.system.whoami;
  environment = this.system.environment;
  layoutState = this.system.layoutState;
  extraSidenavOpen = signal(false);
  currentPageTitle = computed(() => this.environment()?.appDescription || 'Enterprise App');

  openExtraSidenav(): void {
    this.extraSidenavOpen.set(true);
  }

  closeExtraSidenav(): void {
    this.extraSidenavOpen.set(false);
  }
}
