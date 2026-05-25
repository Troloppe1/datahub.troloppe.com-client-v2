import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { MyMatIconComponent } from '../my-mat-icon/my-mat-icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-btn',
  standalone: true,
  imports: [MyMatIconComponent],
  template: `<button class="btn btn-ghost" (click)="goBack()">
    <my-mat-icon>arrow_back_ios</my-mat-icon>
  </button>`,
})
export class BackBtnComponent {
  @Input() to?: string;
  constructor(
    protected location: Location,
    protected router: Router,
  ) {}

  goBack() {
    if (this.to) {
      this.router.navigateByUrl(this.to);
      return;
    }
    this.location.back();
  }
}
