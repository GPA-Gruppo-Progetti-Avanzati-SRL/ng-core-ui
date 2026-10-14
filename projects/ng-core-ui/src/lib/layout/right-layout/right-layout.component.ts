import {ToastComponent} from '../../components/toast.component/toast.component';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';

import {
  Component,
  signal,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CoreLabelsService } from '../../system/labels.service';
import { SystemService } from '../../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {ErrorPage} from '../../pages/error.page';
import {AppSwitcherComponent} from '../app-switcher/app-switcher.component';

@Component({
  selector: 'core-right-layout',
  imports: [
    MatButtonModule,
    ToastComponent,
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
  protected readonly t = inject(CoreLabelsService).labels;
  extraSidenavOpen = signal(false);
  currentPageTitle = this.system.currentPageTitle;

  openExtraSidenav(): void {
    this.extraSidenavOpen.set(true);
  }

  closeExtraSidenav(): void {
    this.extraSidenavOpen.set(false);
  }
}
