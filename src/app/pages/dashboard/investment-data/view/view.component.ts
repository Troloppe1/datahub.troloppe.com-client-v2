// investment-view.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TextButtonComponent } from '@core/components/dashboard/text-btn/text-btn.component';
import { Amenity, DummyInvestmentData } from '@core/services/dashboard/dummy-investment-data.service';
import { RouterService } from '@core/services/router.service';
import { LoaderService } from '@shared/services/loader.service';
import { Subject, takeUntil } from 'rxjs';
import { BackBtnComponent } from "@shared/components/back-btn/back-btn.component";
import { SpinnerComponent } from "@shared/components/spinner/spinner.component";
import { PermissionService } from '@shared/services/permission.service';
import { InvestmentDataService } from '@core/services/dashboard/investment-data.service';
import { CommonModule } from '@angular/common';
import { RecordNavigatorComponent } from "@shared/components/record-navigator/record-navigator.component";

@Component({
  selector: 'app-investment-view',
  standalone: true,
  imports: [TextButtonComponent, BackBtnComponent, SpinnerComponent, CommonModule, RecordNavigatorComponent],
  templateUrl: 'view.component.html',
  styleUrl: 'view.component.scss'
})
export class ViewComponent implements OnInit, OnDestroy {
  public Object = Object;
  public basePath!: string;
  public previousRecordId: number | null = null;
  public nextRecordId: number | null = null;
  public investmentData: DummyInvestmentData | null = null;
  public amenities: Amenity[] | null = null;
  public sector: string = '';
  public fetchedData: boolean = false;
  public loadingProperty: boolean = false;
  public loadingAmenities: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: RouterService,
    private readonly angularRouter: Router,
    private readonly investmentDataService: InvestmentDataService,
    private readonly loaderService: LoaderService,
    public readonly permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.sector = this.route.snapshot.paramMap.get('sector') || 'residential';
    this.basePath = `/dashboard/investment-data/${this.sector}`;
    const storedData = this.router.getState(`${this.basePath}/${id}`);

    if (storedData) {
      this.investmentData = storedData;
    }


    this.route.paramMap.subscribe(params => {
      this.fetchInvestmentData(+params.get('id')!);
      this.fetchAmenities(this.investmentData?.id ?? +params.get('id')!);
    })
  }


  // Get filtered keys for display (exclude certain fields)
  get investmentDataKeys(): string[] {
    if (!this.investmentData) return [];

    const excludedKeys = ['id', 'Updated By']; // Add more keys to exclude if needed
    return Object.keys(this.investmentData).filter(key => !excludedKeys.includes(key));
  }

  // Get grouped data for better organization
  get groupedData(): { [category: string]: { [key: string]: any } } {
    if (!this.investmentData) return {};

    const basicInfo: { [key: string]: any } = {};
    const locationInfo: { [key: string]: any } = {};
    const propertyDetails: { [key: string]: any } = {};
    const financialInfo: { [key: string]: any } = {};
    const contactInfo: { [key: string]: any } = {};
    const otherInfo: { [key: string]: any } = {};

    const locationKeys = ['State', 'Region', 'Locality', 'Section', 'L.G.A', 'L.C.D.A', 'Street Name'];
    const propertyKeys = ['Building Type', 'Classification', 'No of Units', 'No of Beds', 'No of Floors', 'Land Area', 'NLFA', 'Number of Keys', 'No of Seats', 'No of Bay', 'No of Plots', 'No of Streets'];
    const financialKeys = ['Rental Price', 'Sale Price', 'Daily Rate', 'Daily Rates', 'Annual Service Charge'];
    const contactKeys = ['Contact Name', 'Contact Number'];
    const basicKeys = ['Date', 'Status', 'Completion Year', 'Period'];

    Object.keys(this.investmentData).forEach(key => {
      if (key === 'id' || key === 'Updated By') return;

      const value = this.investmentData![key];

      if (locationKeys.includes(key)) {
        locationInfo[key] = value;
      } else if (propertyKeys.includes(key)) {
        propertyDetails[key] = value;
      } else if (financialKeys.includes(key)) {
        financialInfo[key] = value;
      } else if (contactKeys.includes(key)) {
        contactInfo[key] = value;
      } else if (basicKeys.includes(key)) {
        basicInfo[key] = value;
      } else {
        otherInfo[key] = value;
      }
    });

    const result: { [category: string]: { [key: string]: any } } = {};

    if (Object.keys(basicInfo).length) result['Basic Information'] = basicInfo;
    if (Object.keys(locationInfo).length) result['Location Details'] = locationInfo;
    if (Object.keys(propertyDetails).length) result['Property Details'] = propertyDetails;
    if (Object.keys(financialInfo).length) result['Financial Information'] = financialInfo;
    if (Object.keys(contactInfo).length) result['Contact Information'] = contactInfo;
    if (Object.keys(otherInfo).length) result['Additional Information'] = otherInfo;

    return result;
  }

  get sectorDisplayName(): string {
    return this.sector.charAt(0).toUpperCase() + this.sector.slice(1);
  }

  goToEditInvestmentData(): void {
    const id = this.investmentData?.["property ID"];
    this.router.navigateByUrl(`/dashboard/investment-data/${this.sector}/${id}/edit`);
  }

  deleteInvestmentData(): void {
    const id = this.investmentData?.id;
    // Implement delete functionality here
    // You can show a confirmation dialog and then navigate back to the list
  }

  onPrev(previousRecordId: number): void {
    if (previousRecordId) {
      this.router.navigateByUrl(`/dashboard/investment-data/${this.sector}/${previousRecordId}`);
    }
  }

  onNext(nextRecordId: number): void {
    if (nextRecordId) {
      this.router.navigateByUrl(`/dashboard/investment-data/${this.sector}/${nextRecordId}`);
    }
  }

  public formatKey(key: string): string {
    // Convert keys like 'L.G.A' to more readable format
    switch (key) {
      case 'L.G.A':
        return 'Local Government Area';
      case 'L.C.D.A':
        return 'Local Council Development Area';
      case 'NLFA':
        return 'Net Lettable Floor Area';
      case "property ID":
        return "Property ID";
      case "Construction_Company":
        return "Construction Company";
      default:
        // Convert camelCase or PascalCase to readable format
        return key.replace(/([A-Z])/g, ' $1').trim();
    }
  }

  private fetchInvestmentData(id: number): void {
    this.loaderService.start();
    this.loadingProperty = true;

    this.investmentDataService.apiGetInvestmentDataById(id, true, this.sector)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          this.investmentData = response.data.property;
          this.previousRecordId = response.data.meta.previous_property_id;
          this.nextRecordId = response.data.meta.next_property_id;
          this.fetchedData = true;
          this.loadingProperty = false;
          if (!this.investmentData) {
            this.router.navigateByUrl('/not-found', { skipLocationChange: true });
          }
          this.loaderService.stop();
        },
        error: (err) => {
          if (err.status === 404) {
            this.angularRouter.navigateByUrl('/not-found', { skipLocationChange: true });
          }
          this.loaderService.stop();
        },
        complete: () => {

        }
      });
  }

  private fetchAmenities(propertyId: number): void {
    this.loadingAmenities = true;
    this.investmentDataService.apiGetInvestmentDataAmenitiesById(propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.amenities = response.data;
          this.loadingAmenities = false;
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}