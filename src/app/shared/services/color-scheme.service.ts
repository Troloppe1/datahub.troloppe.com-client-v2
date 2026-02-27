import { Inject, Injectable } from '@angular/core';
import { ClientStorageService } from './client-storage.service';
import { BehaviorSubject, map, of, Subscription, switchMap, tap } from 'rxjs';
import { MediaQueryService } from './media-query.service';
import { PREFERS_COLOR_DARK_SCHEME_QUERY } from './constants/media-query';
import { COLOR_SCHEME_STORE_KEY } from './constants/localstorage';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ColorSchemeService {
  public schemes = ['auto', 'light', 'dark'];

  private colorScheme$ = new BehaviorSubject<ColorSchemeType | null>('auto');
  private colorSchemeSubscription!: Subscription;

  constructor(
    private css: ClientStorageService,
    private mediaQuery: MediaQueryService,
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

        return this.mediaQuery.observe(PREFERS_COLOR_DARK_SCHEME_QUERY).pipe(
          map((value) => {
            return value ? 'dark' : 'light';
          })
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
