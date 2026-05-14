declare const AppSha: string;
declare const AppVersion: string;

import {
  Component,
  computed,
  ChangeDetectionStrategy,
  inject,
  output,
  ViewEncapsulation
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SystemService } from '../../system/system.service';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'core-app-switcher',
  imports: [MatIconModule, MatListModule, MatDividerModule, NgOptimizedImage],
  templateUrl: './app-switcher.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AppSwitcherComponent {

  private system = inject(SystemService);

  environment = this.system.environment;
  apps = this.system.apps;
  currentAppId = computed(() => this.environment()?.appId || '');
  readonly appSha = AppSha;
  readonly appVersion = AppVersion;

  close = output<void>();
}
