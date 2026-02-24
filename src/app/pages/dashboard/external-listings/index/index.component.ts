import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { TextButtonComponent } from '@core/components/dashboard/text-btn/text-btn.component';
import { ExternalListingsService } from '@core/services/dashboard/external-listings.service';
import { RouterService } from '@core/services/router.service';
import { AuthService } from '@shared/services/auth.service';
import { ColorSchemeService } from '@shared/services/color-scheme.service';
import { PermissionService } from '@shared/services/permission.service';
import { User } from '@shared/services/types';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CreateAndDownloadExternalListingsBtnsComponent } from "../../../../core/components/dashboard/create-and-download-external-listings-btns.component";

@Component({
  selector: 'external-listing-index',
  standalone: true,
  imports: [TextButtonComponent, AgGridAngular, CreateAndDownloadExternalListingsBtnsComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent implements OnDestroy {
  gridOptions: GridOptions = {
    suppressFieldDotNotation: true, // Treats dot as part of the field name
    rowBuffer: 5,
    getRowId: params => `${params.data.id}`,
    overlayNoRowsTemplate: `<span class="ag-overlay-loading-center">No External listing Available</span>`,

  };
  rowData!: Observable<any | null>;
  colDefs: ColDef<any>[] = [
    {
      headerName: 'S/N', width: 75, filter: false, field: 'id',
      cellRenderer(params: any) {
        if (params.value) {
          return params.node.rowIndex + 1
        }
      }
    },
    {
      field: 'Date',
      sortable: false
    },
    {
      field: 'Region',
    },
    {
      field: 'Location',
    },
    {
      field: 'Section',
    },
    {
      field: "L.G.A",
      headerName: "L. G. A",
      filter: false
    },
    {
      field: "L.C.D.A",
      headerName: "L. C. D. A",
      filter: false
    },
    {
      field: "Street",
      filter: false
    },
    {
      field: "Street Number",
      filter: false
    },
    {
      field: "Development",
    },
    {
      field: "Sector",
    },
    {
      field: "Type",
    },
    {
      field: "Sub Type",
    },
    {
      field: "No of Beds",
    },
    {
      field: "Size",
      cellClass: "text-center",
      headerClass: "text-center"
    },
    {
      field: "Land Area",
      cellClass: "text-center",
      headerClass: "text-center",
    },
    {
      field: "Offer",
    },
    {
      field: "Sale Price",
      cellClass: 'text-right'
    },
    {
      field: "Lease Price",
      cellClass: 'text-right'
    },
    {
      field: "Price/Sqm",
      cellClass: 'text-right'
    },
    {
      field: "Service Charge",
      cellClass: 'text-right'
    },
    {
      field: "Developer",
    },
    {
      field: "Listing Agent",
      width: 250,
    },
    {
      field: "Contact Number",
    },
    {
      field: "E-mail",
      width: 250
    },
    {
      field: "Comment",
      width: 250,
      filter: false
    },
    {
      field: "Source",
      width: 200
    },
    {
      field: "Updated By",
      hide: this.permission.isAdhocStaff,
    },
  ];
  defaultColDefs: ColDef<any> = {
    sortable: true,
    filter: true,
    filterParams: {
      debounceMs: 500,     // Debounce time for user input
      filterOptions: ['contains']
    },
    autoHeight: false,
    cellClass: '!flex !items-center',
    cellStyle: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    tooltipValueGetter: (params: any) => params.value ?? '',
    width: 150,
  };
  tableThemeColor: 'dark' | 'light' = 'light';
  isLoading = true;
  pageSize = 500
  initialRowCount = 0
  datasource: any;
  totalRecords = '...'
  destroy$ = new Subject<void>()
  currentUser!: User

  dataCache: Map<string, { data: any, totalRecords: number }> = new Map()
  gridApi!: any;

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.setFilterModel(this.getFilterModelFromLocalStorage() || {});
  }

  constructor(
    private els: ExternalListingsService,
    private router: RouterService,
    public colorScheme: ColorSchemeService,
    public permission: PermissionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {

    this.authService.onCurrentUser().pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.currentUser = v!
    })

    const paginatedListingParams: PaginatedListingsParams = {
      limit: 1
    }

    if (!this.permission.isAdmin) {
      paginatedListingParams.updatedById = this.currentUser.id
    }

    this.els.apiGetPaginatedListings(paginatedListingParams).pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.totalRecords = v.totalPages.toString()
      })

    this.datasource = {
      getRows: (params: any) => {
        this.isLoading = true
        this.cdr.detectChanges()
        const startRow = params.startRow;
        const currentPage = (Math.floor(startRow / this.pageSize) + 1); // Ensure page calculation works for both up and down scrolls
        const paginatedListingParams: PaginatedListingsParams = {
          limit: this.pageSize,
          currentPage,
        }
        if (Object.keys(params.filterModel).length > 0) {
          paginatedListingParams.agFilterModel = params.filterModel
          this.setFilterModelToLocalStorage(params.filterModel);
        }
        if (params.sortModel.length > 0) {
          const sort = params.sortModel[0].sort
          const colId = params.sortModel[0].colId
          const sortBy = `${colId}:${sort}`
          paginatedListingParams.sortBy = sortBy
        }

        if (!this.permission.isAdmin) {
          paginatedListingParams.updatedById = this.currentUser.id
        }

        const cachedData = this.getCachedData(paginatedListingParams)
        if (cachedData) {
          params.successCallback(cachedData.data, cachedData.totalRecords);

          this.isLoading = false
          this.cdr.detectChanges()
        }

        else {

          this.els.apiGetPaginatedListings(paginatedListingParams).pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (value) => {
                params.successCallback(value.data, value.totalRecords);
                if (value.data.length === 0) {
                  Promise.resolve().then(() => {
                    this.gridApi.showNoRowsOverlay();
                  })
                }

                this.cacheData(paginatedListingParams, value.data, value.totalRecords)
                this.isLoading = false;
                this.cdr.detectChanges()
              },
              error: () => {
                params.failCallback();
                this.isLoading = false;
                this.cdr.detectChanges()
              }
            })
        }
      }
    }

    this.colorScheme
      .getActualColorScheme()
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.tableThemeColor = value;
      });
  }

  goToViewAgents() {
    this.router.navigateByUrl('/dashboard/external-listings/agents');
  }

  onRowClicked(ev: any) {
    const data = ev.data
    this.router.navigateByUrl(`/dashboard/external-listings/${data.id}`, data)
  }

  cacheData(paginatedListingParams: PaginatedListingsParams, data: any, totalRecords: number) {
    this.dataCache.set(JSON.stringify(paginatedListingParams), { data, totalRecords })
  }

  getCachedData(paginatedListingParams: PaginatedListingsParams) {
    return this.dataCache.get(JSON.stringify(paginatedListingParams))
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private getFilterModelFromLocalStorage(): any {
    const filterModel = sessionStorage.getItem('externalListingsFilterModel');
    return filterModel ? JSON.parse(filterModel) : null;
  }

  private setFilterModelToLocalStorage(filterModel: any) {
    sessionStorage.setItem('externalListingsFilterModel', JSON.stringify(filterModel));
  }

}
