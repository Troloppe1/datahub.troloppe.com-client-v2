import { Component, Input, SimpleChanges } from '@angular/core';
import { ResourceCreationFormModalComponent } from '../modals/external-listings/resource-creation-form-modal/resource-creation-form-modal.component';
import { InvestmentDataService } from '@core/services/dashboard/investment-data.service';
import { FormDataService } from '@core/services/dashboard/property-data/form-data.service';
import { InitialDataService } from '@core/services/dashboard/property-data/initial-data.service';
import { ResourceCreationFormModalService } from '@core/services/dashboard/property-data/resource-creation-form-modal.service';
import { ModalService } from '@shared/services/modal.service';
import { SelectDropdownService } from '@shared/services/select-dropdown.service';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable, Subject, takeUntil } from 'rxjs';
import { SelectDropdownComponent } from '@shared/components/select-dropdown/select-dropdown.component';
import { InputFieldComponent } from '@shared/components/input-field/input-field.component';
import { PptySearchableSelectDropdownComponent } from '@shared/components/ppty-searchable-select-dropdown/ppty-searchable-select-dropdown.component';
import { FormSubmitBtnComponent } from '@shared/components/form-submit-btn/form-submit-btn.component';
import { routeFadeInOut, visibleTrigger } from '@shared/animations';
import { CommonModule } from '@angular/common';
import { BackBtnComponent } from "../../../../shared/components/back-btn/back-btn.component";
import { SpinnerComponent } from "../../../../shared/components/spinner/spinner.component";
import { ActivatedRoute, Router, Params } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DummyInvestmentDataService, DummyInvestmentData } from '@core/services/dashboard/dummy-investment-data.service';

export interface InvestmentSector {
  key: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-investment-data-form',
  standalone: true,
  imports: [
    SelectDropdownComponent,
    InputFieldComponent,
    PptySearchableSelectDropdownComponent,
    ReactiveFormsModule,
    FormSubmitBtnComponent,
    CommonModule,
    BackBtnComponent,
    SpinnerComponent,
    FormsModule,
  ],
  templateUrl: './investment-data-form.component.html',
  animations: [routeFadeInOut, visibleTrigger],
  host: {
    '[@routeFadeInOut]': 'true',
    '[style.display]': 'contents',
  },
})
export class InvestmentDataFormComponent {
  @Input() action: 'create' | 'edit' = 'create'
  @Input() data: any

  // Investment sectors configuration
  investmentSectors: InvestmentSector[] = [
    { key: 'residential', label: 'Residential', route: 'investment-data/residential' },
    { key: 'land', label: 'Land', route: 'investment-data/land' },
    { key: 'healthcare', label: 'Healthcare', route: 'investment-data/healthcare' },
    { key: 'retail', label: 'Retail', route: 'investment-data/retail' },
    { key: 'hotel', label: 'Hotel', route: 'investment-data/hotel' },
    { key: 'street', label: 'Street', route: 'investment-data/street' },
    { key: 'industrial', label: 'Industrial', route: 'investment-data/industrial' },
    { key: 'office', label: 'Office', route: 'investment-data/office' },
    { key: 'events', label: 'Events', route: 'investment-data/events' }
  ];

  selectedSector: string = '';
  currentSectorData: InvestmentSector | undefined;

  optionsRecord: Record<string, IdAndNameType[] | null> = {}
  isFetchingRecord: Record<string, boolean> = {}
  isLoading = false
  creationType: CreationType = 'create'

  investmentDataFormGroup!: FormGroup;

  private destroy$ = new Subject<void>()

  constructor(
    private initialDataService: InitialDataService,
    private formDataService: FormDataService,
    private sds: SelectDropdownService,
    private modalService: ModalService,
    private DummyInvestmentData: DummyInvestmentDataService,
    private resourceCreationFormModalService: ResourceCreationFormModalService,
    public investmentDataService: InvestmentDataService,
    private route: ActivatedRoute,
    private router: Router,
    private angularRouter: Router,
  ) {
    // Initialize sector from route immediately in constructor
    this.initializeSectorFromRoute();

    if (this.action == 'create')
      this.investmentDataFormGroup = this.investmentDataService.getFormGroup()
  }

  ngOnInit(): void {
    // Subscribe to route params to listen for future changes
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      this.updateSectorFromRoute(params);
    });

    this.getInitialData()
    this.resourceCreationFormModalService.onResourceChanged((eventData) => {
      this.getInitialData(eventData)
    })
    this.sds.onAddBtnClick((outerFormGroup, formControlName) => {
      this.modalService.open(ResourceCreationFormModalComponent, { outerFormGroup, formControlName })
    })
  }

  private initializeSectorFromRoute(): void {
    // Get sector from current route snapshot immediately
    const sectorFromUrl = this.route.snapshot.params['sector'];

    if (sectorFromUrl && this.investmentSectors.some(s => s.key === sectorFromUrl)) {
      this.selectedSector = sectorFromUrl;
      this.currentSectorData = this.investmentSectors.find(s => s.key === sectorFromUrl);
    } else {

    }
  }

  shouldShowField(fieldName: string): boolean {
    if (!this.selectedSector) {
      return false;
    }

    const sectorFields = this.getSectorFields(this.selectedSector);
    return sectorFields.some(field => field.field === fieldName);
  }

  getSectorFields(sector: string) {
    switch (sector) {
      case 'residential':
        return [
          { field: "Building Type" },
          { field: "No of Units" },
          { field: "No of Beds" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price" },
          { field: "Sale Price" },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Annual Service Charge" },
          { field: "Contact Name" },
          { field: "Contact Number" },
          { field: "Amenities" }
        ];

      case 'land':
        return [
          { field: "Land Area" },
          { field: "Status" },
          { field: "Period" },
          { field: "Rental Price" },
          { field: "Sale Price" },
          { field: "Contact Name" },
          { field: "Contact Number" }
        ];

      case 'healthcare':
        return [
          { field: "Classification" },
          { field: "No of Beds" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Amenities" },
          { field: "Operator" },
          { field: "Contractor" },
          { field: "Developer" },
          { field: "Facilities Manager" }
        ];

      case 'retail':
        return [
          { field: "Classification" },
          { field: "NLFA" },
          { field: "No of Floors" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price" },
          { field: "Sale Price" },
          { field: "Annual Service Charge" },
          { field: "Amenities" },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" }
        ];

      case 'hotel':
        return [
          { field: "Classification" },
          { field: "Number of Keys" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Sale Price" },
          { field: "Daily Rate" },
          { field: "Room Type" },
          { field: "Amenities" },
          { field: "Operator" },
          { field: "Contractor" },
          { field: "Developer" }
        ];

      case 'office':
        return [
          { field: "Classification" },
          { field: "NLFA" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price" },
          { field: "Sale Price" },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Annual Service Charge" },
          { field: "No of Floors" },
          { field: "Contact Name" },
          { field: "Contact Number" },
          { field: "Amenities" }
        ];

      case 'industrial':
        return [
          { field: "Classification" },
          { field: "Building Type" },
          { field: "No of Bay" },
          { field: "NLFA" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price" },
          { field: "Sale Price" },
          { field: "Annual Service Charge" },
          { field: "Amenities" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" },
          { field: "Developer" },
          { field: "Contractor" }
        ];

      case 'street':
        return [
          { field: "Sector" },
          { field: "No of Plots" },
          { field: "No of Streets" }
        ];

      case 'events':
        return [
          { field: "Classification" },
          { field: "No of Seats" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Daily Rates" },
          { field: "Amenities" },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" }
        ];

      default:
        return [];
    }
  }

  

  private normalizeInvestmentData(raw: DummyInvestmentData): any {
  return {
    state: raw.State,
    region: raw.Region,
    location: raw.Locality,
    section: raw.Section,
    lga: raw['L.G.A'],
    lcda: raw['L.C.D.A'],
    streetName: raw['Street Name'],
    buildingType: raw['Building Type'],
    noOfUnits: raw['No of Units'],
    noOfBeds: raw['No of Beds'],
    status: raw['Status'],
    completionYear: raw['Completion Year'],
    period: raw['Period'],
    rentalPrice: this.unformatCurrency(raw['Rental Price']),
    salePrice: this.unformatCurrency(raw['Sale Price']),
    developer: raw['Developer'],
    contractor: raw['Contractor'],
    facilitiesManager: raw['Facilities Manager'],
    annualServiceCharge: this.unformatCurrency(raw['Annual Service Charge']),
    contactName: raw['Contact Name'],
    contactNumber: raw['Contact Number'],
    amenities: raw['Amenities'],
    landArea: raw['Land Area'],
    classification: raw['Classification'],
    operator: raw['Operator'],
    nlfa: raw['NLFA'],
    noOfFloors: raw['No of Floors'],
    numberOfKeys: raw['Number of Keys'],
    dailyRate: this.unformatCurrency(raw['Daily Rate']),
    roomType: raw['Room Type'],
    noOfBay: raw['No of Bay'],
    noOfPlots: raw['No of Plots'],
    noOfStreets: raw['No of Streets'],
    noOfSeats: raw['No of Seats'],
    dailyRates: this.unformatCurrency(raw['Daily Rates'])
  };
}

private unformatCurrency(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return null;

  const cleaned = value.replace(/[₦,]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}




  private updateSectorFromRoute(params: Params): void {
    const sectorFromUrl = params['sector'];

    if (sectorFromUrl && this.investmentSectors.some(s => s.key === sectorFromUrl)) {
      // Only update if sector actually changed
      if (this.selectedSector !== sectorFromUrl) {
        this.selectedSector = sectorFromUrl;
        this.currentSectorData = this.investmentSectors.find(s => s.key === sectorFromUrl);

        // Update the form if needed based on sector
        this.updateFormBasedOnSector();
      }
    }
  }

  private updateFormBasedOnSector(): void {
    // If you need to update form fields based on the selected sector
    // Add logic here to show/hide fields or set default values
    if (this.investmentDataFormGroup && this.currentSectorData) {
      // Example: Set sector-specific defaults or configurations
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
  if (this.action === 'edit' && changes['data']?.currentValue) {
    const normalized = this.normalizeInvestmentData(changes['data'].currentValue);
    this.investmentDataFormGroup.patchValue(normalized);
    this.setupOptionsInEditMode(); // if needed
  }
}

  // Handle sector change
  onInvestmentSectorChange(sectorKey: string) {
    const selectedSectorData = this.investmentSectors.find(s => s.key === sectorKey);
    if (selectedSectorData) {
      // Update the selectedSector immediately for UI feedback
      this.selectedSector = sectorKey;
      this.currentSectorData = selectedSectorData;

      // Navigate to the new sector route
      this.angularRouter.navigate([`/dashboard/investment-data/${sectorKey}/new`]);
    }
  }

  private getInitialData(resource?: { name: string, data: IdAndNameType }) {
    const initialDataMap: Record<string, () => Observable<any>> = {
      // state: () => this.initialDataService.getAllStates(),
      sector: () => this.initialDataService.getAllSectors(),
      offer: () => this.initialDataService.getAllOffers(),
    };

    if (resource) {
      const options = this.optionsRecord[resource.name]
      this.optionsRecord[resource.name] = options ? [resource.data, ...options] : [resource.data]
    }
    else {
      Object.entries(initialDataMap).forEach(([key, fetchData]) => {
        fetchData()
          .pipe(takeUntil(this.destroy$))
          .subscribe(v => {
            this.optionsRecord[key] = v
          })
      });
    }
  }

  private setupOptionsInEditMode() {
    console.log('Setting up options in edit mode with data:', this.data);
    const mapper: Record<string, Observable<IdAndNameType[]>> = {
      region: this.formDataService.getRegions(),
      location: this.formDataService.getLocationsByRegionId(this.data.property.region_id),
      section: this.formDataService.getSectionsByLocalityId(this.data.property.locality_id),
      lga: this.formDataService.getLgasByRegionId(this.data.property.region_id),
      lcda: this.formDataService.getLcdasByLgaId(this.data.property.lga_id),
      subSector: this.formDataService.getSubSectorsBySectorId(this.data.property.sector_id),
    }

    forkJoin(mapper).pipe(takeUntil(this.destroy$)).subscribe((result) => {
      for (let key in result) {
        this.optionsRecord[key] = result[key]
      }
    })
  }

  private onFieldChange(
    fieldName: string,
    selectedItem: IdAndNameType,
    fieldToChange: string,
    fetchMethod: (id: number) => Observable<IdAndNameType[]>,
    resetFields?: string[]
  ) {
    // A curry function !!!!
    const onChange = this.sds.onInitChangeBuilder(this.investmentDataFormGroup, this.optionsRecord, this.isFetchingRecord);
    onChange(fieldToChange, selectedItem.id, (id) => fetchMethod(id), resetFields)
    this.investmentDataService.dropdownSelectedData[fieldName] = selectedItem
  }

  // onStateChange(selectedState: IdAndNameType) {
  //   if (selectedState) {
  //     this.onFieldChange('state', selectedState, 'region', (id) => this.formDataService.getRegionsByStateId(id), ['region', 'location', 'section', 'lga', 'lcda'])
  //   }
  // }

  onRegionChange(selectedRegion: IdAndNameType) {
    if (selectedRegion) {
      this.onFieldChange("region", selectedRegion, "location", (id) => this.formDataService.getLocationsByRegionId(id), ['location', 'section', 'lga'])
      this.onFieldChange("region", selectedRegion, "lga", (regionId) => this.formDataService.getLgasByRegionId(regionId))
    }
  }

  onLocationChange(selectedLocation: IdAndNameType) {
    if (selectedLocation) {
      this.onFieldChange("location", selectedLocation, "section", (id) => this.formDataService.getSectionsByLocalityId(id), ['section'])
    }
  }

  onSectionChange(sectionItem: IdAndNameType) {
    //
  }

  onLgaChange(selectedLga: IdAndNameType) {
    if (selectedLga) {
      this.onFieldChange("lga", selectedLga, "lcda", (id) => this.formDataService.getLcdasByLgaId(id), ['lcda'])
    }
  }

  onSectorChange(selectedSector: IdAndNameType) {
    if (selectedSector) {
      this.onFieldChange("sector", selectedSector, 'subSector', (id) => this.formDataService.getSubSectorsBySectorId(id))
    }
  }

  handleSubmit() {
    /* if (this.action === 'create') {
      this.investmentDataService.createExternalListing(this.creationType)
    }
    else {
      this.investmentDataService.updateExternalListing(this.data.id)
    } */
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.investmentDataFormGroup.reset()
  }
}