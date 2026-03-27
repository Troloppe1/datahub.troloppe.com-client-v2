import { Component } from '@angular/core';
import { routeFadeInOut } from '@shared/animations';
import { ActiveLocationIndicatorComponent } from '@core/components/dashboard/home/active-location-indicator/active-location-indicator.component';
import { TextButtonComponent } from '@core/components/dashboard/text-btn/text-btn.component';
import { Router } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';
import { PermissionService } from '@shared/services/permission.service';
import { ColorSchemeService } from '@shared/services/color-scheme.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, CellClickedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { Observable, Subscription, tap } from 'rxjs';
import { ActionsComponent } from '@shared/components/ag-grid/street-data/actions/actions.component';
import { ImagePreviewComponent } from '@shared/components/ag-grid/street-data/image-preview/image-preview.component';
import { AsyncPipe } from '@angular/common';
import { StreetDataService } from '@core/services/dashboard/street-data.service';
import { CreateAndDownloadStreetDataBtnsComponent } from '@core/components/dashboard/create-and-download-street-data-btns.component';
import { LoaderService } from '@shared/services/loader.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    ActiveLocationIndicatorComponent,
    TextButtonComponent,
    AgGridAngular,
    AsyncPipe,
    CreateAndDownloadStreetDataBtnsComponent
  ],
  templateUrl: './index.component.html',
  animations: [routeFadeInOut],
  host: {
    '[@routeFadeInOut]': 'true',
    '[style.display]': 'contents',
  },
})
export class IndexComponent {
  gridOptions: GridOptions = {
    overlayNoRowsTemplate: `<span class="ag-overlay-loading-center">No Street Data Available</span>`,
  };
  rowData!: Observable<StreetDataColType[] | null>;
  colDefs: ColDef<StreetDataColType>[] = [
    { headerName: 'S/N', width: 75, valueGetter: 'node.rowIndex + 1' },
    {
      headerName: 'Actions',
      cellRenderer:  ActionsComponent,
      cellRendererParams: { onClick: this.onEditClick.bind(this) },
      width: 150,
    },
    {
      field: 'unique_code',
      headerName: 'Unique Code',
      width: 150,
      valueGetter: (params) => params.data?.unique_code || 'New Entry',
    },
    { field: 'street_address', headerName: ' Street Address' },
    {
      field: 'sector',
      valueFormatter: (params) => params.value,
    },
    { field: 'section' },
    { field: 'location' },
    {
      field: 'image_path',
      headerName: 'Image Preview',
      cellRenderer: ImagePreviewComponent,
      filter: false,
      sortable: false,
      headerClass: '!flex !justify-center',
    },
    {
      field: 'is_verified',
      headerName: 'Is Verified',
      width: 150,
    },
    {
      field: 'created_at',
      headerName: 'Creation Date',
      valueFormatter: (params) => this.utils.utcToFormattedDate(params.value),
      filter: false,
    },
    {
      field: 'creator',
      width: 150,
      hide: this.permission.isAdhocStaff,
    },
  ];
  defaultColDefs: ColDef<StreetDataColType> = {
    sortable: true,
    filter: true,
    autoHeight: true,
    cellClass: '!flex !items-center',
  };
  tableThemeColor: 'dark' | 'light' = 'light';
  isLoading = true;
  private actualColorSchemeSubscription!: Subscription;
  private gridApi: GridApi | null = null;
  hasActiveFilters = false;


  constructor(
    private sd: StreetDataService,
    private router: Router,
    private utils: UtilsService,
    private permission: PermissionService,
    public colorScheme: ColorSchemeService,
  ) { }

  ngOnInit() {
    this.rowData = this.sd.getStreetData().pipe(
      tap((value) => {
        if (value) {
          Promise.resolve().then(() =>{
            this.isLoading = false;
          })
        }
      })
    );
    this.actualColorSchemeSubscription = this.colorScheme
      .getActualColorScheme()
      .subscribe((value) => {
        this.tableThemeColor = value;
      });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.updateHasActiveFilters();
  }

  clearAllFilters() {
    // Clears ag-grid column filter models only (does not reset sort).
    this.gridApi?.setFilterModel(null);
    this.updateHasActiveFilters();
  }

  onFilterChanged() {
    this.updateHasActiveFilters();
  }

  private updateHasActiveFilters() {
    const model = this.gridApi?.getFilterModel() ?? {};
    this.hasActiveFilters = Object.keys(model).length > 0;
  }

  onCellClick(event: CellClickedEvent) {
    if (!(event.colDef.headerName === 'Actions')) {
      const streetDataId = event.data.id;
      this.router.navigateByUrl(`/dashboard/street-data/${streetDataId}`);
    }
  }

  onEditClick({ rowData: { id } }: any) {
    this.router.navigateByUrl(`/dashboard/street-data/${id}/edit`);
  }

  routeToNewStreetView() {
    this.router.navigateByUrl('/dashboard/street-data/new');
  }

  ngOnDestroy() {
    this.actualColorSchemeSubscription.unsubscribe();
  }
}
