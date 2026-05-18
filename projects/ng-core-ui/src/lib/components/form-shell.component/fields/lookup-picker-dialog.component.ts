import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LookupDialogConfig } from './lookup-field.component';

@Component({
  selector: 'core-lookup-picker-dialog',
  imports: [MatDialogModule, MatIconButton, MatIconModule, NgComponentOutlet],
  templateUrl: './lookup-picker-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupPickerDialogComponent {
  protected readonly pickerData = inject<LookupDialogConfig>(MAT_DIALOG_DATA);
  protected readonly dialogRef  = inject(MatDialogRef<LookupPickerDialogComponent>);
  protected readonly contentInjector: Injector;

  constructor() {
    this.contentInjector = Injector.create({
      providers: [{ provide: MAT_DIALOG_DATA, useValue: this.pickerData.data }],
      parent: inject(Injector),
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
