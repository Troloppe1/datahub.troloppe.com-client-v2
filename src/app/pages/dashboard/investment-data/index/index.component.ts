import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvestmentDataService } from '@core/services/dashboard/investment-data.service';
import { RouterService } from '@core/services/router.service';
import { AuthService } from '@shared/services/auth.service';
import { ColorSchemeService } from '@shared/services/color-scheme.service';
import { PermissionService } from '@shared/services/permission.service';
import { User } from '@shared/services/types';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateAndDownloadInvestmentDataBtnsComponent } from "@core/components/dashboard/create-and-download-investment-data-btns.component";
import { DummyInvestmentDataService } from '@core/services/dashboard/dummy-investment-data.service';

export interface InvestmentSector {
  key: string;
  label: string;
  route: string;
}

@Component({
  selector: 'investment-data-index',
  standalone: true,
  imports: [AgGridAngular, CommonModule, FormsModule, CreateAndDownloadInvestmentDataBtnsComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent implements OnInit, OnDestroy {

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

  selectedSector: string = 'residential';
  currentSectorData: InvestmentSector | undefined;

  gridOptions: GridOptions = {
    suppressFieldDotNotation: true,
    rowBuffer: 5,
    getRowId: params => `${params.data.id}`,
    overlayNoRowsTemplate: `<span class="ag-overlay-loading-center">No Investment Data Available</span>`,
  };

  rowData!: Observable<any | null>;
  colDefs: ColDef<any>[] = [];

  defaultColDefs: ColDef<any> = {
    sortable: true,
    filter: true,
    filterParams: {
      debounceMs: 500,
      filterOptions: ['contains']
    },
    autoHeight: false,
    cellClass: '!flex !items-center',
    cellStyle: { 'white-space': 'normal', 'word-wrap': 'break-word', 'height': 'max-content' },
    width: 150,
  };

  tableThemeColor: 'dark' | 'light' = 'light';
  isLoading = true;
  pageSize = 500;
  initialRowCount = 0;
  datasource: any;
  totalRecords = '...';
  destroy$ = new Subject<void>();
  currentUser!: User;

  dataCache: Map<string, { data: any, totalRecords: number }> = new Map();
  gridApi!: any;

  constructor(
    private investmentDataService: InvestmentDataService,
    private router: RouterService,
    private route: ActivatedRoute,
    private angularRouter: Router,
    private dummyDataService: DummyInvestmentDataService,
    public colorScheme: ColorSchemeService,
    public permission: PermissionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  private useDummyData = false; // Set to true for testing, false for production

  ngOnInit() {
    // Get current user
    this.authService.onCurrentUser().pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.currentUser = v!;
    });

    // Listen to route params to get selected sector
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const sector = params['sector'];
      if (sector && this.investmentSectors.some(s => s.key === sector)) {
        this.selectedSector = sector;
      } else {
        // If no sector or invalid sector, redirect to residential
        this.angularRouter.navigate(['/dashboard/investment-data/residential'], { replaceUrl: true });
        return;
      }

      this.currentSectorData = this.investmentSectors.find(s => s.key === this.selectedSector);
      this.setupColumnDefinitions();
      this.initializeDataSource();
    });

    // Setup color scheme
    this.colorScheme
      .getActualColorScheme()
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.tableThemeColor = value;
      });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  logSector(sector: string) {
    console.log('Sector received from button component:', sector);
  }

  setupColumnDefinitions() {
    // Base columns that are common to all sectors
    const baseColumns: ColDef<any>[] = [
      { headerName: 'S/N', width: 75, valueGetter: 'node.rowIndex + 1' },
      {
        field: 'Period',
        sortable: false,
      },
      {
        field: 'Data Rating',
      },
      {
        field: 'Property Code',
      },
      {
        field: 'Region',
      },
      {
        field: "Locality"
      },
      {
        field: "Section",
      },
      {
        field: "LGA",
      }, {
        field: "LCDA",
      },
      {
        field: "Street"
      },
      {
        field: "Street Number",
      },
      {
        field: "Development"
      },
      {
        field: "Sector"
      },
      {
        field: "Building Type"
      },
      {
        field: "Sub Type"
      },
      {
        field: "Classification"
      },
      {
        field: "Unit Type"
      },
      {
        field: "Size"
      },
      {
        field: "Construction Status"
      },
      {
        field: "Year of Completion"
      },
      {
        field: "Property Type",
        headerName: "Property Type",
        filter: false
      },
      {
        field: "Status",
        headerName: "Status",
        filter: false
      },
      {
        field: "Completion Year",
        headerName: "Completion Year",
        filter: false
      },
      {
        field: "Period",
        headerName: "Period",
        filter: false
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
        field: "Street Name",
        filter: false
      },
    ];


    // Sector-specific columns
    const sectorSpecificColumns = this.getSectorSpecificColumns();

    // Common trailing columns
    const trailingColumns: ColDef<any>[] = [
      {
        field: "Updated By",
        hide: this.permission.isAdhocStaff,
      },
    ];

    this.colDefs = [...baseColumns, ...sectorSpecificColumns, ...trailingColumns];
  }


  getSectorSpecificColumns(): ColDef<any>[] {
    switch (this.selectedSector) {
      case 'residential':
        return [
          { field: "Building Type", },
          { field: "No of Units" },
          { field: "No of Beds" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price", cellClass: 'text-right' },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Annual Service Charge" },
          { field: "Contact Name" },
          { field: "Contact Number" },
        ];

      case 'land':
        return [
          { field: "Land Area", cellClass: "text-center", headerClass: "text-center" },
          { field: "Status" },
          { field: "Period" },
          { field: "Rental Price", cellClass: 'text-right' },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Contact Name" },
          { field: "Contact Number" },
        ];

      case 'healthcare':
        return [
          { field: "Classification", },
          { field: "No of Beds" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Operator", cellClass: 'text-right' },
          { field: "Contractor" },
          { field: "Developer" },
          { field: "Facilities Manager" },
        ];

      case 'retail':
        return [
          { field: "Classification", },
          { field: "NLFA" },
          { field: "No of Floors" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price", cellClass: 'text-right' },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Annual Service Charge" },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" },


        ];

      case 'hotel':
        return [
          { field: "Classification", },
          { field: "Number of Keys", },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Daily Rate", cellClass: 'text-right' },
          { field: "Room Type", cellClass: 'text-right' },
          { field: "Operator" },
          { field: "Contractor" },
          { field: "Developer" },
        ];

      case 'office':
        return [
          { field: "Classification", },
          { field: "NLFA" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price", cellClass: 'text-right' },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Annual Service Charge" },
          { field: "No of Floors" },
          { field: "Contact Name" },
          { field: "Contact Number" },
        ];

      case 'industrial':
        return [
          { field: "Classification", },
          { field: "Building Type", },
          { field: "No of Bay", },
          { field: "NLFA" },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Rental Price", cellClass: 'text-right' },
          { field: "Sale Price", cellClass: 'text-right' },
          { field: "Annual Service Charge" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" },
          { field: "Developer" },
          { field: "Contractor" },
        ];

      case 'street':
        return [
          { field: "Sector", },
          { field: "No of Plots" },
          { field: "No of Streets" },
        ];

      case 'events':
        return [
          { field: "Classification", },
          { field: "No of Seats", },
          { field: "Status" },
          { field: "Completion Year" },
          { field: "Period" },
          { field: "Daily Rates", cellClass: 'text-right' },
          { field: "Developer" },
          { field: "Contractor" },
          { field: "Facilities Manager" },
          { field: "Contact Name" },
          { field: "Contact Number" },
        ];

      default:
        return [

        ];
    }
  }


  initializeDataSource() {
    // Clear cache when sector changes
    this.dataCache.clear();


    if (this.useDummyData) {
      // Use dummy data
      this.initializeDummyDataSource();
    } else {
      // Use real API (your existing code)
      this.initializeRealDataSource();
    }
    // Get initial total count
    const paginatedParams: PaginatedInvestmentParams = {
      limit: 1,
      sector: this.selectedSector
    };

    if (!this.permission.isAdmin) {
      paginatedParams.updatedById = this.currentUser.id?.toString() ?? null;
    }

    this.investmentDataService.apiGetPaginatedInvestmentData(paginatedParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.totalRecords = v.totalPages.toString();
      });


  }

  private initializeRealDataSource() {
    // Your existing API-based initialization code
    const paginatedParams: PaginatedInvestmentParams = {
      limit: 1,
      sector: this.selectedSector
    };

    if (!this.permission.isAdmin) {
      paginatedParams.updatedById = this.currentUser.id?.toString() ?? null;
    }

    this.investmentDataService.apiGetPaginatedInvestmentData(paginatedParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.totalRecords = v.totalPages.toString();
      });

    // Setup datasource
    this.datasource = {
      getRows: (params: any) => {
        this.isLoading = true;
        this.cdr.detectChanges();

        const startRow = params.startRow;
        const currentPage = (Math.floor(startRow / this.pageSize) + 1);

        const paginatedParams: PaginatedInvestmentParams = {
          limit: this.pageSize,
          currentPage,
          sector: this.selectedSector
        };

        if (Object.keys(params.filterModel).length > 0) {
          paginatedParams.agFilterModel = params.filterModel;
        }

        if (params.sortModel.length > 0) {
          const sort = params.sortModel[0].sort;
          const colId = params.sortModel[0].colId;
          const sortBy = `${colId}:${sort}`;
          paginatedParams.sortBy = sortBy;
        }

        if (!this.permission.isAdmin) {
          paginatedParams.updatedById = this.currentUser.id?.toString() ?? null;
        }

        const cachedData = this.getCachedData(paginatedParams);
        if (cachedData) {
          // For real data, we assume the API already handles filtering
          // so we pass the actual data length as total records
          const totalRecords = Object.keys(params.filterModel).length > 0 ?
            cachedData.data.length : cachedData.totalRecords;

          params.successCallback(cachedData.data, totalRecords);
          this.isLoading = false;
          this.cdr.detectChanges();
        } else {
          this.investmentDataService.apiGetPaginatedInvestmentData(paginatedParams)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (value) => {
                // For real data, we assume the API already handles filtering
                // so we pass the actual data length as total records when filtered
                const totalRecords = Object.keys(params.filterModel).length > 0 ?
                  value.data.length : value.totalRecords;

                params.successCallback(value.data, totalRecords);

                if (value.data.length === 0) {
                  Promise.resolve().then(() => {
                    this.gridApi.showNoRowsOverlay();
                  });
                }
                this.cacheData(paginatedParams, value.data, value.totalRecords);
                this.isLoading = false;
                this.cdr.detectChanges();
              },
              error: () => {
                params.failCallback();
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            });
        }
      }
    };
  }


  private initializeDummyDataSource() {
    // Get initial total count from dummy data
    this.dummyDataService.getPaginatedDummyData(this.selectedSector, { limit: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.totalRecords = v.totalRecords.toString();
      });

    // Setup datasource for dummy data
    this.datasource = {
      getRows: (params: any) => {
        this.isLoading = true;
        this.cdr.detectChanges();

        const startRow = params.startRow;
        const currentPage = (Math.floor(startRow / this.pageSize) + 1);

        const paginatedParams = {
          limit: this.pageSize,
          currentPage,
          sector: this.selectedSector,
          filterModel: params.filterModel,
          sortModel: params.sortModel
        };

        this.dummyDataService.getPaginatedDummyData(this.selectedSector, paginatedParams)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (value) => {
              let filteredData = value.data;
              let totalFilteredRecords = value.totalRecords;

              // Apply client-side filtering first
              if (Object.keys(params.filterModel).length > 0) {
                filteredData = this.applyFiltering(filteredData, params.filterModel);
                // Update total count to match filtered results
                totalFilteredRecords = filteredData.length;
              }

              // Apply client-side sorting after filtering
              if (params.sortModel.length > 0) {
                const sortModel = params.sortModel[0];
                filteredData = this.applySorting(filteredData, sortModel);
              }

              // Pass the filtered count as the total records
              params.successCallback(filteredData, totalFilteredRecords);

              if (filteredData.length === 0) {
                Promise.resolve().then(() => {
                  this.gridApi.showNoRowsOverlay();
                });
              }

              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              params.failCallback();
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
      }
    };
  }




  // Helper methods for client-side filtering and sorting
  private applySorting(data: any[], sortModel: any): any[] {
    const { colId, sort } = sortModel;

    return data.sort((a, b) => {
      const aValue = a[colId];
      const bValue = b[colId];

      if (aValue < bValue) return sort === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private applyFiltering(data: any[], filterModel: any): any[] {
    return data.filter(item => {
      return Object.keys(filterModel).every(field => {
        const filter = filterModel[field];
        const value = item[field];

        if (!value) return false;

        // Simple contains filter
        if (filter.type === 'contains') {
          return value.toString().toLowerCase().includes(filter.filter.toLowerCase());
        }

        // Add more filter types as needed
        return true;
      });
    });
  }

  // Add method to toggle between dummy and real data (useful for testing)
  toggleDataSource() {
    this.useDummyData = !this.useDummyData;
    this.initializeDataSource();
  }


  onSectorChange(sector: string) {
    const selectedSectorData = this.investmentSectors.find(s => s.key === sector);
    if (selectedSectorData) {
      // Navigate to the new sector route
      this.angularRouter.navigate(['/dashboard/investment-data', sector]);
    }
  }

  onRowClicked(ev: any) {
    const data = ev.data;
    this.router.navigateByUrl(`/dashboard/investment-data/${this.selectedSector}/${data["property ID"]}`, data);
  }

  cacheData(paginatedParams: PaginatedInvestmentParams, data: any, totalRecords: number) {
    this.dataCache.set(JSON.stringify(paginatedParams), { data, totalRecords });
  }

  getCachedData(paginatedParams: PaginatedInvestmentParams) {
    return this.dataCache.get(JSON.stringify(paginatedParams));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Types
interface PaginatedInvestmentParams {
  limit: number;
  currentPage?: number;
  sector: string;
  updatedById?: string;
  agFilterModel?: any;
  sortBy?: string;
}