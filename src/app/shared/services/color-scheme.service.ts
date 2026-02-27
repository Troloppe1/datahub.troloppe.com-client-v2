import { Inject, Injectable } from '@angular/core';
import { ClientStorageService } from './client-storage.service';
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  of,
  Subscription,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { COLOR_SCHEME_STORE_KEY } from './constants/localstorage';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ColorSchemeService {
  public schemes = ['auto', 'light', 'dark'];
  private readonly autoLightStartHour = 6;
  private readonly autoDarkStartHour = 18;

  private colorScheme$ = new BehaviorSubject<ColorSchemeType | null>('auto');
  private colorSchemeSubscription!: Subscription;

  constructor(
    private css: ClientStorageService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.retrieveColorScheme();
  }

  getColorScheme() {
    return this.colorScheme$.asObservable();
  }

  getActualColorScheme() {
    return this.colorScheme$.asObservable().pipe(
      switchMap((value) => {
        if (value && value !== 'auto') {
          return of(value);
        }

        // Auto mode follows local time: day -> light, night -> dark.
        // Re-evaluate periodically so the theme can switch automatically.
        return timer(0, 60_000).pipe(
          map(() => this.getTimeBasedScheme()),
          distinctUntilChanged()
        );
      })
    );
  }

  init() {
    this.retrieveColorScheme();
    return this.getActualColorScheme().pipe(
      tap((value) => {
        this.setThemeToDocument(value);
      })
    );
  }

  // To be called on color scheme/mode elements
  selectSchemeCallback(event: Event, cb?: () => void) {
    const currentTarget = event.currentTarget as HTMLElement;
    const selectedScheme = currentTarget.dataset['scheme'] as ColorSchemeType;
    this.colorSchemeSubscription = this.setColorScheme(selectedScheme).subscribe();
    cb && cb();
  }

  ngOnDestroy(): void {
    this.colorSchemeSubscription.unsubscribe();
  }

  private retrieveColorScheme() {
    const colorScheme = this.getColorSchemeFromLocalStore();

    // Check is color scheme preference was persisted
    if (colorScheme) {
      this.colorScheme$.next(colorScheme);
    } else {
      this.colorScheme$.next('auto');
    }
  }

  private setColorScheme(colorScheme: ColorSchemeType | null) {
    this.css.local().set(COLOR_SCHEME_STORE_KEY, colorScheme);
    this.colorScheme$.next(colorScheme);
    return this.getActualColorScheme().pipe(
      tap((value) => {
        this.setThemeToDocument(value);
      })
    );
  }

  private getColorSchemeFromLocalStore() {
    return this.css.local().get<ColorSchemeType>(COLOR_SCHEME_STORE_KEY);
  }

  private getTimeBasedScheme(): Exclude<ColorSchemeType, 'auto'> {
    const hour = new Date().getHours();
    return hour >= this.autoLightStartHour && hour < this.autoDarkStartHour
      ? 'light'
      : 'dark';
  }

  private setThemeToDocument(colorScheme: Exclude<ColorSchemeType, 'auto'>) {
    const daisyTheme: { [key: string]: string } = {
      dark: 'sunset',
      light: 'light',
    };
    this.document.documentElement.setAttribute(
      'data-theme',
      daisyTheme[colorScheme]
    );
  }
}
