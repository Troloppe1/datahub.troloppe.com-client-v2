import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import nigerianStates from '@shared/services/constants/nigerian-states';
import {
  ScrapeSession,
  ScrapeSessionMetaData,
  ScraperSessionService,
  SessionProgress,
  SessionType,
} from '@core/services/dashboard/scraper-session.service';
import {
  catchError,
  filter,
  finalize,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { AlertService } from '@shared/services/alert.service';

@Component({
  selector: 'app-scraper-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scraper-sessions.component.html',
  styleUrls: ['./scraper-sessions.component.scss'],
})
export class ScraperSessionsComponent implements OnInit, OnDestroy {
  @ViewChild('infoNotif')
  infoNotif!: ElementRef<HTMLInputElement>;

  // ── General State ──────────────────────────────────────────────────────
  private reloadRequest$ = new Subject<void>();
  tableRowLoadingActions: {
    [key: string]: boolean;
  } = {};

  // ── Session Type ──────────────────────────────────────────────────────
  selectedSessionType: SessionType = 'agents';

  get sessionTypeHelperText(): string {
    return this.selectedSessionType === 'agents'
      ? 'Harvest agent profiles from NPC & Private Properties portals'
      : 'Harvest properties from designated websites';
  }

  // ── Quota ──────────────────────────────────────────────────────
  loadingQuota = true;
  usedToday!: number;
  maxScrapes!: number;

  get remainingScrapes() {
    return this.maxScrapes - this.usedToday;
  }
  get quotaDots() {
    return [1, 2, 3];
  }

  // ── Form state ─────────────────────────────────────────────────
  selectedSource: 'npc' | 'pp' | '' = 'npc';
  selectedState = 'Lagos';
  scrapeAllPages = false;
  pageFrom = 1;
  pageTo = 20;

  get pageRangeDisplay(): string {
    if (this.scrapeAllPages) return 'All pages';
    return `${this.pageFrom ?? 1} – ${this.pageTo ?? '?'}`;
  }

  get estimatedPages(): number | null {
    if (this.scrapeAllPages || this.pageFrom == null || this.pageTo == null)
      return null;
    return this.pageTo - this.pageFrom + 1;
  }

  get selectedSourceLabel(): string {
    return this.selectedSource === 'npc'
      ? 'Nigerian Property Center'
      : this.selectedSource === 'pp'
        ? 'Private Properties'
        : '';
  }

  // ── Scraping state ─────────────────────────────────────────────
  isScraping = false;
  isStartingNewScrape = false;
  isInitializingScrape = false;
  scrapeProgressPercentage = 0;
  isSessionProcessing = false;
  isStoppingSession = false;
  scrapeStartTime = '';
  stopScraper$ = new Subject<void>();
  currentStatusMessage = 'Connecting to source...';
  lastScrape: Nullable<ScrapeSession> = null;
  currentScrapeSession: Nullable<{
    sessionId: string;
    progress: SessionProgress;
  }> = null;

  private scrapeTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── MetaData ───────────────────────────────────────────────────

  // ── History ───────────────────────────────────────────────────
  isFetchingSessions = false;
  visibleHistory!: number;
  totalHistory!: number;

  scrapeSessionHistory$: Observable<Nullable<ScrapeSession[]>> =
    this.reloadRequest$.pipe(
      startWith(void 0),
      tap(() => (this.isFetchingSessions = true)),
      switchMap(() =>
        this.scraperSessionService.getSessions(this.selectedSessionType).pipe(
          tap((res) => {
            // Set meta data
            this.setMetaData(res.meta);
            this.lastScrape = res.data[0];
          }),
          map((res) => res.data),
          catchError((err) => {
            console.error('Failed to load sessions:', err);
            this.alertService.error('Error', 'Failed to load sessions');

            return of(null);
          }),
          finalize(() => (this.isFetchingSessions = this.loadingQuota = false)),
        ),
      ),
    );

  // ── Nigerian states ────────────────────────────────────────────
  readonly nigerianStates = nigerianStates;

  constructor(
    private readonly scraperSessionService: ScraperSessionService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isStartingNewScrape = false;
    const currentScraperSession =
      this.scraperSessionService.getCurrentScrapeSession();
    console.log(currentScraperSession);
    if (currentScraperSession) {
      this.showScrapeProgress(
        currentScraperSession.sessionId,
        currentScraperSession.progress,
      );
    }
  }

  ngOnDestroy(): void {}

  // Initial Status Messages
  getInitStatusMessages() {
    return [
      this.isStartingNewScrape
        ? 'Initializing scrape session...'
        : 'Resuming scrape session...',
      'Loading configuration...',
      'Validating request parameters...',
      'Connecting to data source...',
      'Preparing to start scraping...',
    ];
  }

  reload() {
    this.reloadRequest$.next();
  }

  onSessionTypeChange(type: Event): void {
    this.selectedSessionType = type as unknown as SessionType;
  }

  onSourceChange(): void {}

  initializeScrapeSession(): void {
    this.isInitializingScrape = true;
    this.isStartingNewScrape = true;
    const normalizedState = this.selectedState
      ? this.selectedState === 'FCT – Abuja'
        ? 'abuja'
        : this.selectedState.toLowerCase()
      : undefined;

    const payload = {
      website: this.selectedSource,
      state: normalizedState,
      ...(this.scrapeAllPages
        ? {}
        : {
            start_page: this.pageFrom,
            end_page: this.pageTo,
          }),
    };

    this.scraperSessionService
      .initScrapeSession(payload, this.selectedSessionType)
      .subscribe({
        next: ({ session }) => {
          this.usedToday++;
          this.isInitializingScrape = false;
          this.initializeScrapeProgress(session.session_id, {
            percentage: 0,
            status: 'initialized',
          });
          this.reload();
        },
        error: (error) => {
          console.error('Failed to initialize scrape session:', error);
          this.alertService.error(
            'Error',
            'Failed to initialize scrape session:',
          );
        },
      });
  }

  stopScrape(): void {
    const session = this.scraperSessionService.getCurrentScrapeSession();
    if (!session) {
      return;
    }
    this.isStoppingSession = true;

    this.scraperSessionService.stopScrapeSession(session.sessionId).subscribe({
      next: () => {
        this.isScraping = this.isStoppingSession = false;
        this.stopScraper$.next();
        this.stopScraper$.complete();
        this.reload();
        this.scraperSessionService.clearCurrentScrapeSession();
        this.alertService.success('Success', 'Stop request sent successfully.');
      },
      error: (error) => {
        console.error('Failed to stop scrape session:', error);

        this.alertService.error('Error', 'Failed to stop scrape session.');
      },
    });
  }

  resumeScrape(row: ScrapeSession): void {
    const key = 'resume-' + row.session_id;
    this.tableRowLoadingActions[key] = true;
    this.infoNotif.nativeElement.scrollIntoView();
    this.scraperSessionService.resumeScrapeSession(row.session_id).subscribe({
      next: () => {
        this.tableRowLoadingActions[key] = false;
        this.usedToday++;
        row.status = 'processing';
        this.initializeScrapeProgress(row.session_id, {
          percentage: 0,
          status: row.status,
        });
      },
      error: (error) => {
        console.error('Failed to resume scrape session:', error);
        this.alertService.error('Error', 'Failed to resume scrape session:');
      },
    });
  }

  downloadData(row: ScrapeSession): void {
    const key = 'download-' + row.session_id;
    this.tableRowLoadingActions[key] = true;
    const a = document.createElement('a');
    a.href = row.upload_url!;
    a.download = row.session_id + '.csv';
    a.click();
    this.tableRowLoadingActions[key] = false;
  }

  private setMetaData(sessionMeta: ScrapeSessionMetaData) {
    this.usedToday = sessionMeta.daily_count;
    this.maxScrapes = sessionMeta.daily_limit;
    this.visibleHistory = sessionMeta.latest_10_count;
    this.totalHistory = sessionMeta.scrape_total;
  }

  private showScrapeProgress(
    sessionId: string,
    progress: SessionProgress,
    resume = false,
  ): void {
    const initStatusMessages = this.getInitStatusMessages();
    this.isScraping = true;

    this.currentStatusMessage = initStatusMessages[0];

    // Initialization animation runs independently
    let msgIdx = 0;
    let intervalId: any = null;

    if (progress.status === 'initialized' || resume) {
      intervalId = setInterval(() => {
        msgIdx++;
        this.currentStatusMessage =
          initStatusMessages[Math.min(msgIdx, initStatusMessages.length - 1)];
      }, 3500);
    }

    this.scraperSessionService
      .poolScrapeProgress(sessionId)
      .pipe(takeUntil(this.stopScraper$))
      .subscribe({
        next: ({ status, percentage }) => {
          this.scraperSessionService.setCurrentScrapeSession(sessionId, {
            status,
            percentage,
          });
          this.scrapeProgressPercentage = percentage;
          if (status === 'processing') {
            this.isSessionProcessing = true;
            // ✅ Update message immediately on every emission
            clearInterval(intervalId); // Stop init animation once processing starts
            this.currentStatusMessage =
              percentage <= 90
                ? `Scraping in progress — ${percentage}% complete`
                : 'Finalising — almost done...';
          }

          if (status === 'completed' || status === 'failed') {
            clearInterval(intervalId);
            this.currentStatusMessage =
              status === 'completed'
                ? 'Scraping completed...'
                : 'Scraping failed...';
            this.scraperSessionService.clearCurrentScrapeSession();
            // notify user appropriately
            if (status === 'completed') {
              this.alertService.success(
                'Success',
                'Scraping completed successfully',
              );
            } else {
              this.alertService.error('Error', 'Scraping failed');
            }
            this.stopScraper$.next();
            this.stopScraper$.complete();
            this.isScraping = false;
            this.reload();
          }
        },

        error: (err) => {
          clearInterval(intervalId);
          this.stopScraper$.next();
          this.stopScraper$.complete();
          console.error(err);
        },

        complete: () => {
          clearInterval(intervalId);
          this.stopScraper$.next();
          this.stopScraper$.complete();
        },
      });
  }

  private initializeScrapeProgress(
    sessionId: string,
    progress: SessionProgress,
    resume = false,
  ) {
    this.scraperSessionService.setCurrentScrapeSession(sessionId, progress);
    this.showScrapeProgress(sessionId, progress, resume);
  }
}
