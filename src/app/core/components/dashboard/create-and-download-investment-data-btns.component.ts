import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TextButtonComponent } from './text-btn/text-btn.component';
import { RouterService } from '@core/services/router.service';

@Component({
  selector: 'create-and-download-investment-data-btns',
  standalone: true,
  imports: [TextButtonComponent],
  template: `
    <text-button 
      withIcon="plus" 
      [isFlexed]="true" 
      [text]="'Add New ' + sectorKey"
      (click)="handleClick()">
    </text-button>
  `,
})
export class CreateAndDownloadInvestmentDataBtnsComponent {
  @Input() sectorKey: string = 'Residential';
  @Output() sectorClicked = new EventEmitter<string>();

  /* handleClick() {
    this.sectorClicked.emit(this.sectorKey);
  } */

  constructor(
      private router: RouterService,
    ) { }

  handleClick() {
    this.router.navigateByUrl(`/dashboard/investment-data/${this.sectorKey}/new`);
  }
}
