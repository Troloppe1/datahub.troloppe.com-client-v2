import { AsyncPipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvestmentDataFormComponent } from '@core/components/dashboard/investment-data-form/investment-data-form.component';
import { InvestmentDataService } from '@core/services/dashboard/investment-data.service';
import { routeFadeInOut, visibleTrigger } from '@shared/animations';
import { map, Observable, catchError, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-investment-data-edit',
  standalone: true,
  imports: [InvestmentDataFormComponent, AsyncPipe],
  template: `
    <app-investment-data-form 
      action="edit" 
      [data]="investmentData$ | async">
    </app-investment-data-form>
  `,
  animations: [routeFadeInOut, visibleTrigger],
  host: {
    '[@routeFadeInOut]': 'true',
    '[style.display]': 'contents',
  },
})
export class EditComponent implements OnInit, OnDestroy {
  investmentData$!: Observable<any>
  sector: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private readonly investmentDataService: InvestmentDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      this.sector = params['sector'] || 'residential';

      if (id) {
        this.loadInvestmentData(+id);
      }
    });
  }

  private loadInvestmentData(id: number): void {
    this.investmentData$ = this.investmentDataService
      .apiGetInvestmentDataById(id, true, this.sector)
      .pipe(
        map((response) => {
          console.log('Loaded investment data:', response);
          return response.data
        }),
        catchError((error) => {
          console.error('Error loading investment data:', error);
          // Navigate to not found or back to list on error
          this.router.navigateByUrl(`/dashboard/investment-data/${this.sector}`);
          return of(null);
        })
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}