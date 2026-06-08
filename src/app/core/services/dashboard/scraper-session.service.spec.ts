import { TestBed } from '@angular/core/testing';

import { ScraperSessionService } from './scraper-session.service';

describe('ScraperSessionService', () => {
  let service: ScraperSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScraperSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
