import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import type { ConfirmData } from './confirm.service';

/** Contenuto del dialog aperto da `ConfirmService.confirm()`. Non va messo nei template. */
@Component({
  selector: 'core-confirm',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmComponent {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
  protected readonly danger = this.data.type === 'danger';
}
