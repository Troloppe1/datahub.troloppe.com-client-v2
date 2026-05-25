import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../../../shared/components/spinner/spinner.component';
import { OverviewComponent } from '../overview/overview.component';
import { ChartComponent } from '../chart/chart.component';
import { ChartContainerComponent } from '../chart-container/chart-container.component';
import { TextButtonComponent } from '../../text-btn/text-btn.component';
import { RouterService } from '@core/services/router.service';
import { DummyInvestmentDataService } from '@core/services/dashboard/dummy-investment-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dashboard-investment-data-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OverviewComponent,
    SpinnerComponent,
    ChartComponent,
    ChartContainerComponent,
    TextButtonComponent,
  ],
  templateUrl: './investment-data-overview.component.html',
  styleUrl: './investment-data-overview.component.scss',
})
export class InvestmentDataOverviewComponent implements OnInit {
  investmentSectors = [
    { key: 'residential', label: 'Residential' },
    { key: 'land', label: 'Land' },
    { key: 'healthcare', label: 'Healthcare' },
    { key: 'retail', label: 'Retail' },
    { key: 'hotel', label: 'Hotel' },
    { key: 'office', label: 'Office' },
    { key: 'industrial', label: 'Industrial' },
    { key: 'street', label: 'Street' },
    { key: 'events', label: 'Events' },
  ];

  selectedSector: string = 'residential';
  currentSectorData = this.investmentSectors.find(
    (s) => s.key === this.selectedSector,
  );

  isLoading = true;
  sectorSummary: Array<{ name: string; value: number }> = [];
  locationSummary: Array<{ name: string; value: number }> = [];
  overviewItems = [
    {
      id: 1,
      totalSum: 0,
      overviewTitle: 'Total Investments',
      myMatIcon: 'real_estate_agent',
    },
    {
      id: 2,
      totalSum: 0,
      overviewTitle: 'States Covered',
      myMatIcon: 'public',
    },
    {
      id: 3,
      totalSum: 0,
      overviewTitle: 'Active Sectors',
      myMatIcon: 'apartment',
    },
    {
      id: 4,
      totalSum: 0,
      overviewTitle: 'Average Sale Price',
      myMatIcon: 'attach_money',
    },
  ];

  constructor(
    private readonly dummyService: DummyInvestmentDataService,
    private readonly router: RouterService,
  ) {}

  ngOnInit(): void {
    this.onInvestmentSectorChange(this.selectedSector);
  }

  onInvestmentSectorChange(sectorKey: string): void {
    this.selectedSector = sectorKey;
    this.currentSectorData = this.investmentSectors.find(
      (s) => s.key === sectorKey,
    );
    this.loadOverviewData();
  }

  loadOverviewData() {
    const data = this.dummyService.generateDummyData(this.selectedSector, 100);

    const states = new Set<string>();
    const sectors = new Set<string>();
    let totalSale = 0;
    let totalCount = 0;

    const sectorCounter: { [key: string]: number } = {};
    const locationCounter: { [key: string]: number } = {};

    for (const item of data) {
      states.add(item.State);
      sectors.add(item['Building Type']);
      totalCount++;

      const rawSale = item['Sale Price']?.replace(/[₦,]/g, '') || '0';
      totalSale += +rawSale;

      // Sector summary
      const sKey = item['Building Type'] || 'Unknown';
      sectorCounter[sKey] = (sectorCounter[sKey] || 0) + 1;

      // Location summary
      const loc = item.Region || 'Unknown';
      locationCounter[loc] = (locationCounter[loc] || 0) + 1;
    }

    this.overviewItems[0].totalSum = totalCount;
    this.overviewItems[1].totalSum = states.size;
    this.overviewItems[2].totalSum = sectors.size;
    this.overviewItems[3].totalSum = totalCount
      ? Math.floor(totalSale / totalCount)
      : 0;

    this.sectorSummary = Object.entries(sectorCounter).map(([name, value]) => ({
      name,
      value,
    }));
    this.locationSummary = Object.entries(locationCounter).map(
      ([name, value]) => ({ name, value }),
    );

    this.isLoading = false;
  }

  goToNewInvestment() {
    this.router.navigateByUrl('/dashboard/investments/new');
  }
}
