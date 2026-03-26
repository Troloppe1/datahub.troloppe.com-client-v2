import { Component, OnDestroy, OnInit } from '@angular/core';
import { TextButtonComponent } from "../../../../../core/components/dashboard/text-btn/text-btn.component";
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { Subject, takeUntil } from 'rxjs';
import { ColorSchemeService } from '@shared/services/color-scheme.service';
import { ListingsAgentsService } from '@core/services/dashboard/listings-agents.service';
import { RouterService } from '@core/services/router.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [TextButtonComponent, AgGridAngular],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent implements OnDestroy, OnInit {
  tableThemeColor: 'dark' | 'light' = 'light';
  loading = true
  private gridApi: GridApi | null = null;
  colDefs: ColDef<any>[] = [
    {
      headerName: 'S/N', width: 75, filter: false, field: 'id', valueGetter: params => {
        return params.node!.rowIndex! + 1
      }
    },
    {
      field: 'name',
    },
    {
      field: 'address'
    },
    {
      field: 'phone_numbers',
      headerName: 'Phone Numbers'
    },
    {
      field: 'email'
    },
    {
      field: 'website'
    },
    {
      field: 'note'
    },
    {
      headerName: 'Total Listings',
      field: 'total_listings',
      cellClass: 'text-center',
    }
  ]

  defaultColDef: ColDef<any> = {
    filter: true
  }

  rowData = [];
  totalRecords = '...'

  destroy$ = new Subject<void>()
  constructor(
    private readonly router: RouterService,
    private readonly colorScheme: ColorSchemeService,
    private readonly listingAgentsService: ListingsAgentsService
  ) { }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  clearAllFilters() {
    // Clears ag-grid column filter models only (does not reset sort).
    this.gridApi?.setFilterModel(null);
  }

  ngOnInit(): void {
    this.colorScheme
      .getActualColorScheme()
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.tableThemeColor = value;
      });

    this.listingAgentsService.apiGetAllListingAgents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        this.rowData = v.data
        this.loading = false
        this.totalRecords = v.data.length
      })
  }
  goToViewListings() {
    this.router.navigateByUrl('/dashboard/external-listings');
  }

  onRowClicked(event: RowClickedEvent) {
    const agent = event.data
    this.router.navigateByUrl(`/dashboard/external-listings/agents/${agent.id}`, agent);
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
