import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <div class="text-2xl font-semibold mb-2">Forbidden</div>
      <div class="text-surface-500">Non hai i permessi per accedere a questa risorsa.</div>
    </div>
  `
})
export class ForbiddenComponent {}
