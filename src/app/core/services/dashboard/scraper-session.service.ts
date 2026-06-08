import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrlFactory } from '@configs/global';
import { interval, map, switchMap, catchError, throwError } from 'rxjs';

interface ScrapeSessionResponse {
  data: ScrapeSession[];
  meta: ScrapeSessionMetaData;
}
interface ScrapeSessionProgressResponse {
  progress: SessionProgress;
}
interface AgentScraperInitResponse {
  message: string;
  session: ScrapeSession;
}

export interface ScrapeSession {
  session_id: string;
  website: 'npc' | 'pp';
  state: string;
  start_page: number;
  end_page: number;
  total_records: number | null;
  initiator_name: string;
  initiator_email: string;
  created_at: string;
  duration: string;
  status: SessionStatus;
  upload_url?: string;
}

export interface ScrapeSessionMetaData {
  latest_10_count: number;
  scrape_total: number;
  daily_limit: number;
  daily_count: number;
}

export type SessionType = 'agents' | 'properties';
export type SessionStatus =
  | 'initialized'
  | 'completed'
  | 'processing'
  | 'stopped'
  | 'stopping'
  | 'failed';

export type SessionProgress = { percentage: number; status: SessionStatus };
export type CurrentScrapeSession = {
  sessionId: string;
  progress: SessionProgress;
};

@Injectable({
  providedIn: 'root',
})
export class ScraperSessionService {
  private static CURRENT_SCRAPE_SESSION_KEY = 'currentScrapeSession';

  constructor(private readonly httpClient: HttpClient) {}

  getSessions(type: SessionType) {
    let url = apiUrlFactory(`/scraper/${type}/sessions`);
    return this.httpClient.get<ScrapeSessionResponse>(url);
  }

  getScrapeProgress(sessionId: string) {
    let url = apiUrlFactory(`/scraper/sessions/${sessionId}/progress`);
    return this.httpClient.get<ScrapeSessionProgressResponse>(url);
  }

  initScrapeSession(data: any, type = 'agents') {
    let url = apiUrlFactory(`/scraper/sessions/init/${type}`);
    return this.httpClient.post<AgentScraperInitResponse>(url, data);
  }

  resumeScrapeSession(sessionId: string) {
    let url = apiUrlFactory(`/scraper/sessions/${sessionId}/resume`);
    return this.httpClient.post<{ message: string }>(url, {});
  }

  stopScrapeSession(sessionId: string) {
    let url = apiUrlFactory(`/scraper/sessions/${sessionId}/stop`);
    return this.httpClient.post<{ message: string }>(url, {});
  }

  poolScrapeProgress(sessionId: string, intervalMs: number = 10000) {
    return interval(intervalMs).pipe(
      switchMap(() =>
        this.getScrapeProgress(sessionId).pipe(map((res) => res.progress)),
      ),

      catchError((err) => {
        console.error('Scrape polling failed:', err);
        return throwError(() => err);
      }),
    );
  }

  setCurrentScrapeSession(sessionId: string, progress: SessionProgress) {
    const session: CurrentScrapeSession = {
      sessionId,
      progress,
    };

    localStorage.setItem(
      ScraperSessionService.CURRENT_SCRAPE_SESSION_KEY,
      JSON.stringify(session),
    );
  }

  clearCurrentScrapeSession() {
    localStorage.removeItem(ScraperSessionService.CURRENT_SCRAPE_SESSION_KEY);
  }

  getCurrentScrapeSession(): Nullable<CurrentScrapeSession> {
    const stored = localStorage.getItem(
      ScraperSessionService.CURRENT_SCRAPE_SESSION_KEY,
    );

    if (!stored) return null;

    return JSON.parse(stored) as CurrentScrapeSession;
  }
}
