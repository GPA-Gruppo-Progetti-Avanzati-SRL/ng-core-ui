import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'page-forbidden',
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <div class="text-2xl font-semibold mb-2 text-on-surface">Forbidden</div>
      <div class="text-on-surface-variant">Non hai i permessi per accedere a questa risorsa.</div>
    </div>
  `,
  host: { class: 'ui' },
})
export class ForbiddenPage {}
