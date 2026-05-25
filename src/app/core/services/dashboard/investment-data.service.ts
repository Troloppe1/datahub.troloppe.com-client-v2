import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { apiUrlFactory } from '@configs/global';
import { CacheService } from '@shared/services/cache.service';
import { FormSubmissionService } from '@shared/services/form-submission.service';
import { LoaderService } from '@shared/services/loader.service';
import {
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { ModalService } from './modal.service';
import { ConfirmModalComponent } from '@core/components/dashboard/modals/confirm-modal/confirm-modal.component';
import { AuthService } from '@shared/services/auth.service';
import { AlertService } from '@shared/services/alert.service';
import { RouterService } from '../router.service';

export interface PaginatedInvestmentParams {
  table?: string;
  limit?: number;
  currentPage?: number;
  sectorId?: number;
  updatedById?: string | null;
  agFilterModel?: any;
  sortBy?: string;
}

export interface InvestmentDataResponse {
  data: any[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InvestmentSector {
  key: number;
  label: string;
  route: string;
}

type OverviewWidgetType = {
  total_investment_data: number;
  total_sectors_covered: number;
  total_regions_covered: number;
  total_active_investments: number;
};

type CreationType = 'create' | 'createAnother';

@Injectable({
  providedIn: 'root',
})
export class InvestmentDataService implements OnDestroy {
  dropdownSelectedData: Record<string, IdAndNameType> = {};

  private formGroup!: FormGroup;
  private destroy$ = new Subject<void>();
  private sectors$?: Observable<InvestmentSector[]>;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly cacheService: CacheService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly modalService: ModalService,
    private readonly loaderService: LoaderService,
    private readonly authService: AuthService,
    private readonly router: RouterService,
    private readonly alertService: AlertService,
    private fb: FormBuilder,
  ) {
    this.initializeFormGroup();
  }

  private initializeFormGroup() {
    this.formGroup = this.fb.group({
      // Common fields
      state: ['', [Validators.required]],
      sector: ['', [Validators.required]],
      region: ['', [Validators.required]],
      location: ['', [Validators.required]],
      date: ['', [Validators.required]],

      // Residential
      section: [''],
      lga: [''],
      lcda: [''],
      streetName: [''],
      buildingType: [''],
      noOfUnits: [''],
      noOfBeds: [''],
      status: [''],
      completionYear: [''],
      period: [''],
      rentalPrice: [''],
      salePrice: [''],
      developer: [''],
      contractor: [''],
      facilitiesManager: [''],
      annualServiceCharge: [''],
      contactName: [''],
      contactNumber: [''],
      amenities: [''],

      // Land
      landArea: [''],

      // Healthcare
      classification: [''],
      operator: [''],

      // Retail
      nlfa: [''],
      noOfFloors: [''],

      // Hotel
      numberOfKeys: [''],
      dailyRate: [''],
      roomType: [''],

      // Industrial
      noOfBay: [''],

      // Street
      noOfPlots: [''],
      noOfStreets: [''],

      // Events
      noOfSeats: [''],
      dailyRates: [''],
    });
  }

  getFormGroup(data: any = null) {
    if (data) {
      // Map API response field names to form field names
      const fieldMapper: Record<string, string> = {
        region_id: 'region',
        locality_id: 'location',
        section_id: 'section',
        lga_id: 'lga',
        lcda_id: 'lcda',
        street: 'streetName',
        street_number: 'streetNumber',
        sub_type: 'subType',
        no_of_beds: 'noOfBeds',
        land_area: 'landArea',
        sale_price: 'salePrice',
        lease_price: 'leasePrice',
        price_per_sqm: 'pricePerSqm',
        service_charge: 'serviceCharge',
        contact_number: 'contactNumber',
        land_type: 'landType',
        total_price: 'totalPrice',
        title_document: 'titleDocument',
        facility_type: 'facilityType',
        bed_capacity: 'bedCapacity',
        equipment_level: 'equipmentLevel',
        staff_count: 'staffCount',
        annual_revenue: 'annualRevenue',
        license_status: 'licenseStatus',
        investment_required: 'investmentRequired',
        roi_projection: 'roiProjection',
        store_type: 'storeType',
        floor_area: 'floorArea',
        rent_per_sqm: 'rentPerSqm',
        annual_turnover: 'annualTurnover',
        foot_traffic: 'footTraffic',
        parking_spaces: 'parkingSpaces',
        lease_terms: 'leaseTerms',
        hotel_category: 'hotelCategory',
        number_of_rooms: 'numberOfRooms',
        star_rating: 'starRating',
        occupancy_rate: 'occupancyRate',
        average_daily_rate: 'averageDailyRate',
        investment_value: 'investmentValue',
        building_grade: 'buildingGrade',
        floor_level: 'floorLevel',
        parking_ratio: 'parkingRatio',
        building_amenities: 'buildingAmenities',
        industrial_type: 'industrialType',
        built_area: 'builtArea',
        power_supply: 'powerSupply',
        lease_rate: 'leaseRate',
        zoning_compliance: 'zoningCompliance',
      };

      for (let key in data) {
        const formFieldName = fieldMapper[key] ?? key;
        this.formGroup.patchValue({ [formFieldName]: data[key] });
      }
    }
    return this.formGroup;
  }

  apiGetPaginatedInvestmentData(
    params: Nullable<PaginatedInvestmentParams> = null,
    invalidateCache = false,
  ): Observable<InvestmentDataResponse> {
    const {
      limit = 200,
      currentPage = 1,
      sectorId = 1,
      updatedById = null,
      agFilterModel,
      sortBy,
    } = params || {};

    let url = apiUrlFactory('/investment-data/listings', {
      limit: limit.toString(),
      page: currentPage.toString(),
      sector_id: sectorId,
      updated_by_id: updatedById?.toString(),
      ag_filter_model: JSON.stringify(agFilterModel),
      sort_by: sortBy,
    });

    if (!invalidateCache) {
      const cachedData = this.cacheService.get<InvestmentDataResponse>(url);
      if (cachedData) {
        return of(cachedData);
      }
    }

    return this.httpClient.get<InvestmentDataResponse>(url).pipe(
      tap((value) => {
        this.cacheService.set(url, value);
      }),
    );
  }

  apiStoreInvestmentData(data: any) {
    let url = apiUrlFactory('/investment-data/listings');
    return this.httpClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>(url, data);
  }

  apiUpdateInvestmentData(data: any, id: number) {
    let url = apiUrlFactory(`/investment-data/listings/${id}`);
    return this.httpClient.put<{
      success: boolean;
      message: string;
      data: any;
    }>(url, data);
  }

  apiGetInvestmentDataById(id: number, view = true, sectorId: number = 1) {
    let url = apiUrlFactory(`/investment-data/listings/${id}`, {
      view,
      sector_id: sectorId,
    });
    return this.httpClient.get<{
      success: boolean;
      message: string;
      data: {
        property: any;
        meta: {
          previous_property_id: number | null;
          next_property_id: number | null;
        };
      };
    }>(url);
  }

  apiGetInvestmentDataAmenitiesById(propertyId: number) {
    let url = apiUrlFactory(
      `/investment-data/listings/${propertyId}/amenities`,
    );
    return this.httpClient.get<{
      success: boolean;
      message: string;
      data: any;
    }>(url);
  }

  apiDeleteInvestmentDataById(id: number) {
    let url = apiUrlFactory(`/investment-data/listings/${id}`);
    return this.httpClient.delete<{ success: boolean; message: string }>(url);
  }

  apiGetOverviewWidgetSet() {
    let url = apiUrlFactory(`/investment-data/overview/widget-set`);
    return this.httpClient.get<OverviewWidgetType>(url);
  }

  apiGetOverviewVisualSet(type = 'sectors') {
    let url = apiUrlFactory(`/investment-data/overview/visual-set`, { type });
    return this.httpClient.get<NameAndValueType[]>(url);
  }

  apiGetSectorPerformance() {
    let url = apiUrlFactory(`/investment-data/overview/sector-performance`);
    return this.httpClient.get<NameAndValueType[]>(url);
  }

  apiExportInvestmentData(sector: string, filters?: any) {
    let url = apiUrlFactory(`/investment-data/export`, {
      sector,
      filters: JSON.stringify(filters),
    });
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  getSectors(): Observable<InvestmentSector[]> {
    if (!this.sectors$) {
      const url = apiUrlFactory('/investment-data/sectors');

      this.sectors$ = this.httpClient
        .get<{ data: InvestmentSector[] }>(url)
        .pipe(
          map((response) => response.data),
          shareReplay({
            bufferSize: 1,
            refCount: true,
          }),
        );
    }

    return this.sectors$;
  }

  createInvestmentData(creationType: CreationType) {
    this.mutateInvestmentData(creationType, (mappedData) =>
      this.apiStoreInvestmentData(mappedData),
    );
  }

  updateInvestmentData(id: number) {
    this.mutateInvestmentData('edit', (mappedData) =>
      this.apiUpdateInvestmentData(mappedData, id),
    );
  }

  deleteInvestmentData(id: number) {
    this.modalService.open(ConfirmModalComponent, {
      matIconName: 'delete',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this investment data?',
      ok: () => {
        this.loaderService.start();
        this.apiDeleteInvestmentDataById(id).subscribe({
          next: (v) => {
            this.alertService.success(
              'Success',
              'Investment data deleted successfully.',
            );
            this.cacheService.clear();
            this.loaderService.stop();
            this.router.navigateByUrl(`/dashboard/investment-data`);
          },
          error: (error) => {
            if (error.status === 403) {
              this.alertService.error(
                'Error',
                error.error.message ||
                  'You do not have permission to delete this investment data.',
              );
            } else {
              this.alertService.error('Error', error.message);
            }
            this.loaderService.stop();
          },
        });
      },
    });
  }

  private prepareSubmissionData(
    data: any,
    action: CreationType | 'edit' = 'create',
  ) {
    const mappedData: Record<string, any> = {
      sector: data['sector'],
      region_id: parseInt(data['region']),
      locality_id: parseInt(data['location']),
      date: data['date'],
      comment: data['comment'],
      source: data['source'],
    };

    // Add sector-specific fields based on the selected sector
    switch (data['sector']) {
      case 'residential':
        Object.assign(mappedData, {
          section_id: parseInt(data['section']),
          lga_id: parseInt(data['lga']),
          lcda_id: parseInt(data['lcda']),
          street: data['streetName'],
          street_number: data['streetNumber'],
          development: data['development'],
          type: data['type'],
          sub_type: data['subType'],
          no_of_beds: data['noOfBeds'],
          size: data['size'],
          sale_price: data['salePrice'],
          lease_price: data['leasePrice'],
          service_charge: data['serviceCharge'],
          developer: data['developer'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'land':
        Object.assign(mappedData, {
          lga_id: parseInt(data['lga']),
          lcda_id: parseInt(data['lcda']),
          land_type: data['landType'],
          land_area: data['landArea'],
          price_per_sqm: data['pricePerSqm'],
          total_price: data['totalPrice'],
          title_document: data['titleDocument'],
          zoning: data['zoning'],
          accessibility: data['accessibility'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'healthcare':
        Object.assign(mappedData, {
          facility_type: data['facilityType'],
          specialization: data['specialization'],
          bed_capacity: data['bedCapacity'],
          equipment_level: data['equipmentLevel'],
          staff_count: data['staffCount'],
          annual_revenue: data['annualRevenue'],
          license_status: data['licenseStatus'],
          investment_required: data['investmentRequired'],
          roi_projection: data['roiProjection'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'retail':
        Object.assign(mappedData, {
          store_type: data['storeType'],
          floor_area: data['floorArea'],
          frontage: data['frontage'],
          rent_per_sqm: data['rentPerSqm'],
          annual_turnover: data['annualTurnover'],
          foot_traffic: data['footTraffic'],
          parking_spaces: data['parkingSpaces'],
          lease_terms: data['leaseTerms'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'hotel':
        Object.assign(mappedData, {
          hotel_category: data['hotelCategory'],
          number_of_rooms: data['numberOfRooms'],
          star_rating: data['starRating'],
          occupancy_rate: data['occupancyRate'],
          average_daily_rate: data['averageDailyRate'],
          annual_revenue: data['annualRevenue'],
          facilities: data['facilities'],
          investment_value: data['investmentValue'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'office':
        Object.assign(mappedData, {
          building_grade: data['buildingGrade'],
          floor_area: data['floorArea'],
          floor_level: data['floorLevel'],
          rent_per_sqm: data['rentPerSqm'],
          service_charge: data['serviceCharge'],
          parking_ratio: data['parkingRatio'],
          building_amenities: data['buildingAmenities'],
          lease_terms: data['leaseTerms'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;

      case 'industrial':
        Object.assign(mappedData, {
          industrial_type: data['industrialType'],
          land_area: data['landArea'],
          built_area: data['builtArea'],
          power_supply: data['powerSupply'],
          lease_rate: data['leaseRate'],
          infrastructure: data['infrastructure'],
          zoning_compliance: data['zoningCompliance'],
          contact_number: data['contactNumber'],
          email: data['email'],
        });
        break;
    }

    if (action !== 'edit') {
      this.authService.onCurrentUser().subscribe((v) => {
        mappedData['updated_by_id'] = v?.id;
      });
    } else {
      mappedData['id'] = data['id'];
    }

    return mappedData;
  }

  private mutateInvestmentData(
    action: CreationType | 'edit' = 'create',
    mutateBaseFunct: (mappedData: any) => Observable<{
      success: boolean;
      message: string;
      data: any;
    }>,
  ) {
    this.formSubmissionService.onFormSubmission(this.formGroup);
    if (this.formGroup.valid) {
      this.modalService.open(ConfirmModalComponent, {
        matIconName: 'description',
        title: 'Confirm Data Submission',
        message: 'Proceed if you are sure this form was correctly filled.',
        severity: 'warning',
        ok: async () => {
          this.loaderService.start();
          const mappedData = this.prepareSubmissionData(
            this.formGroup.value,
            action,
          );
          mutateBaseFunct(mappedData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (v) => {
                const newRecord = v.data;
                this.alertService.success('Success', v.message);
                if (action === 'createAnother') {
                  setTimeout(
                    () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                    2000,
                  );
                } else {
                  this.router.navigateByUrl(
                    `/dashboard/investment-data/${newRecord.sector}/${newRecord.id}`,
                    newRecord,
                  );
                }
                this.loaderService.stop();
              },
              error: (err) => {
                console.error(err);
                if (err.status === 403) {
                  this.alertService.error('Error', err.error.message);
                } else {
                  this.alertService.error(
                    'Error',
                    `An error occurred while ${action === 'create' ? 'creating new' : 'updating this'} investment data`,
                  );
                }
                this.loaderService.stop();
              },
              complete: () => {},
            });
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
