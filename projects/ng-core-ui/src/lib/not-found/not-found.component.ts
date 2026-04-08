import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <div class="text-on-surface-variant">The requested page could not be found.</div>
    </div>
  `,
  host: { class: 'ui' },
})
export class NotFoundComponent {}
