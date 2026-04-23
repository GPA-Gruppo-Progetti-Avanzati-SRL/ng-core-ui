import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIcon} from '@angular/material/icon';
declare const AppSha: string;
declare const AppVersion: string;
@Component({
  selector: 'page-error',
  standalone: true,
  imports: [CommonModule, MatIcon],
  template: `
    <div class="flex flex-col items-center justify-center h-screen gap-6 text-center bg-surface text-on-surface">
      <mat-icon class="!text-[96px] !w-[96px] !h-[96px] opacity-30">cloud_off</mat-icon>
      <div>
        <p class="text-2xl font-semibold m-0">Servizio non disponibile</p>
        <p class="mt-2 m-0 opacity-60">Impossibile avviare l'applicazione.<br>Contattare l'amministratore di sistema.</p>
      </div>
    </div>
    <div class="fixed bottom-2 right-4 text-[10px] text-error opacity-80 pointer-events-none z-[1000]">
      Version : {{ appVersion }} - Sha: {{ appSha }}
    </div>
  `,
  host: { class: 'ui' },
})
export class ErrorPage {
  readonly appSha = AppSha;
  readonly appVersion = AppVersion;
}
