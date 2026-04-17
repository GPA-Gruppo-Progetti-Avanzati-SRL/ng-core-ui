import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'core-confirm',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './confirm.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmComponent {
  protected readonly svc = inject(ConfirmService);
}
