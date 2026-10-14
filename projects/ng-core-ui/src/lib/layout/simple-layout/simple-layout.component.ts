import { BUILD_INFO } from '../../system/build-info';
import {ErrorPage} from '../../pages/error.page';


import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CoreLabelsService } from '../../system/labels.service';
import {SystemService} from '../../system/system.service';
import {ToastComponent} from '../../components/toast.component/toast.component';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';


@Component({
  selector: 'core-simple-layout',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    LoadingOverlayComponent,
    ToastComponent,
    RouterOutlet,
    ErrorPage
  ],
  templateUrl: './simple-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class SimpleLayoutComponent {

  private system = inject(SystemService);

  whoami = this.system.whoami;
  environment = this.system.environment;
  layoutState = this.system.layoutState;
  protected readonly t = inject(CoreLabelsService).labels;
  readonly appSha = BUILD_INFO.sha;
  readonly appVersion = BUILD_INFO.version;

  currentPageTitle = this.system.currentPageTitle;
}
