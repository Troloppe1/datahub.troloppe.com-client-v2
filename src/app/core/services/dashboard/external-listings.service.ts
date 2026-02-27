import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { apiUrlFactory } from '@configs/global';
import { CacheService } from '@shared/services/cache.service';
import { FormSubmissionService } from '@shared/services/form-submission.service';
import { LoaderService } from '@shared/services/loader.service';
import { Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { ModalService } from './modal.service';
import { ConfirmModalComponent } from '@core/components/dashboard/modals/confirm-modal/confirm-modal.component';
import { AuthService } from '@shared/services/auth.service';
import { AlertService } from '@shared/services/alert.service';
import { RouterService } from '../router.service';

type OverviewWidgetType = {
  total_external_listings: number;
  total_states_covered: number;
  total_sectors_covered: number;
  total_listing_agents: number;
};

@Injectable({
  providedIn: 'root',
})
export class ExternalListingsService implements OnDestroy {
  dropdownSelectedData: Record<string, IdAndNameType> = {};

  private formGroup!: FormGroup;
  private destroy$ = new Subject<void>();

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
    this.formGroup = this.fb.group({
      state: ['', [Validators.required]],
      region: ['', [Validators.required]],
      location: ['', [Validators.required]],
      section: ['', [Validators.required]],
      lga: ['', [Validators.required]],
      lcda: ['', [Validators.required]],
      streetName: [''],
      streetNumber: [''],
      development: [''],
      sector: ['', [Validators.required]],
      subSector: ['', [Validators.required]],
      subType: [''],
      offer: ['', [Validators.required]],
      noOfBeds: [],
      size: [],
      landArea: [],

      salePrice: [],
      leasePrice: [],
      pricePerSqm: [],
      serviceCharge: [],

      developer: [null],
      listingAgent: [null, [Validators.required]],
      listingSource: [null, [Validators.required]],

      comment: [],
    });
  }

  getFormGroup(data: any = null) {
    if (data) {
      for (let key in data) {
        const mapper: Record<string, string> = {
          state_id: 'state',
          region_id: 'region',
          locality_id: 'location',
          section_id: 'section',
          lga_id: 'lga',
          lcda_id: 'lcda',
          sector_id: 'sector',
          sub_sector_id: 'subSector',
          street: 'streetName',
          street_number: 'streetNumber',
          sub_type: 'subType',
          no_of_beds: 'noOfBeds',
          land_area: 'landArea',
          offer_id: 'offer',
          sale_price: 'salePrice',
          lease_price: 'leasePrice',
          price_per_sqm: 'pricePerSqm',
          service_charge: 'serviceCharge',
          developer_id: 'developer',
          listing_agent_id: 'listingAgent',
          listing_source_id: 'listingSource',
        };
        this.formGroup.patchValue({ [mapper[key] ?? key]: data[key] });
      }
      return this.formGroup;
    }
    return this.formGroup;
  }

  apiGetPaginatedListings(
    params: Nullable<PaginatedListingsParams> = null,
    invalidateCache = false,
  ) {
    // Destructure and set default values for pagination parameters.
    const {
      limit = 250,
      currentPage = 1,
      updatedById = null,
      agFilterModel,
      sortBy,
    } = params || {};
    // Constructs the API URL with query parameters for pagination and filtering.
    let url = apiUrlFactory('/external-listings/listings', {
      limit: limit.toString(),
      page: currentPage.toString(),
      updated_by_id: updatedById?.toString(),
      ag_filter_model: JSON.stringify(agFilterModel),
      sort_by: sortBy,
    });

    if (!invalidateCache) {
      // Attempts to retrieve cached data for the given URL if revalidation is not requested.
      const cachedData =
        this.cacheService.get<ExternalListingsPaginatedResponseApiType>(url);

      // If cached data exists, return the cached data as an observable. Testing post-receive git hook
      if (cachedData) {
        return of(cachedData);
      }
    }

    return this.httpClient
      .get<ExternalListingsPaginatedResponseApiType>(url)
      .pipe(
        tap((value) => {
          this.cacheService.set(url, value);
        }),
      );
  }

  apiStoreExternalListing(data: any) {
    let url = apiUrlFactory('/external-listings/listings');
    return this.httpClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>(url, data);
  }

  apiUpdateExternalListing(data: any, id: number) {
    let url = apiUrlFactory(`/external-listings/listings/${id}`);
    return this.httpClient.put<{
      success: boolean;
      message: string;
      data: any;
    }>(url, data);
  }

  apiGetExternalListingById(id: number, view = true) {
    let url = apiUrlFactory(`/external-listings/listings/${id}`, { view });
    return this.httpClient.get<{
      success: boolean;
      message: string;
      data: any;
    }>(url);
  }

  apiDeleteExternalListingById(id: number) {
    let url = apiUrlFactory(`/external-listings/listings/${id}`);
    return this.httpClient.delete<{ success: boolean; message: string }>(url);
  }

  apiGetOverviewWidgetSet() {
    let url = apiUrlFactory(`/external-listings/overview/widget-set`);
    return this.httpClient.get<{ data: OverviewWidgetType }>(url);
  }

  apiGetOverviewVisualSet(type = 'sectors') {
    let url = apiUrlFactory(`/external-listings/overview/visual-set`, { type });
    return this.httpClient.get<NameAndValueType[]>(url);
  }

  apiGetOverviewAgentPerformance() {
    let url = apiUrlFactory(`/external-listings/overview/agent-performance`);
    return this.httpClient.get<NameAndValueType[]>(url);
  }

  createExternalListing(creationType: CreationType) {
    this.mutateExternalListings(creationType, (mappedData) =>
      this.apiStoreExternalListing(mappedData),
    );
  }

  updateExternalListing(id: number) {
    this.mutateExternalListings('edit', (mappedData) =>
      this.apiUpdateExternalListing(mappedData, id),
    );
  }

  deleteExternalListing(id: number) {
    this.modalService.open(ConfirmModalComponent, {
      matIconName: 'delete',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this external listing?',
      ok: () => {
        this.loaderService.start();
        this.apiDeleteExternalListingById(id).subscribe({
          next: (v) => {
            this.alertService.success(
              'Success',
              'External Listing deleted successfully.',
            );
            this.cacheService.clear();
            this.loaderService.stop();
            this.router.navigateByUrl(`/dashboard/external-listings`);
          },
          error: (error) => {
            if (error.status === 403) {
              this.alertService.error(
                'Error',
                error.error.message ||
                  'You do not have permission to delete this external listing.',
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
      state_id: parseInt(data['state']),
      region_id: parseInt(data['region']),
      locality_id: parseInt(data['location']),
      section_id: parseInt(data['section']),
      lga_id: parseInt(data['lga']),
      lcda_id: parseInt(data['lcda']),
      street: data['streetName'],
      street_number: data['streetNumber'],
      development: data['development'],
      sector_id: parseInt(data['sector']),
      sub_sector_id: parseInt(data['subSector']),
      offer_id: data['offer'],
      no_of_beds: data['noOfBeds'],
      size: data['size'],
      land_area: data['landArea'],
      sale_price: data['salePrice'],
      lease_price: data['leasePrice'],
      price_per_sqm: data['pricePerSqm'],
      service_charge: data['serviceCharge'],
      developer_id: parseInt(data['developer']),
      listing_agent_id: parseInt(data['listingAgent']),
      listing_source_id: parseInt(data['listingSource']),
      comment: data['comment'],
    };

    if (action !== 'edit') {
      this.authService.onCurrentUser().subscribe((v) => {
        mappedData['updated_by_id'] = v?.id;
      });
    } else {
      mappedData['id'] = data['id'];
    }

    return mappedData;
  }

  private mutateExternalListings(
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
                    `/dashboard/external-listings/${newRecord.id}`,
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
                    `An error occured while ${action === 'create' ? 'creating a new' : 'updating this'} external listing`,
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
