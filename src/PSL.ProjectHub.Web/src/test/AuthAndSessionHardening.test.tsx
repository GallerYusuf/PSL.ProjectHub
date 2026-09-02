import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { api } from '../api/client';

// Testler için geçerli formatta sahte gelecekteki JWT üreteci
const createValidFutureToken = (sub: string, role: string) => {
  const futureExp = Math.floor(Date.now() / 1000) + 7200; // 2 saat geçerli
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, role, exp: futureExp }));
  return `${header}.${payload}.mockSignature`;
};

describe('Kimlik Doğrulama ve Oturum Sertleştirme Testleri', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('1. Oturum açmamış kullanıcı doğrudan login ekranını görür', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Oturum Aç/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Kullanıcı Adı veya E-posta/i)).toBeInTheDocument();
    });
  });

  it('2. Oturum açmamış kullanıcı dashboard veya projelere erişemez, login ekranında kalır', async () => {
    window.location.hash = 'dashboard';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Oturum Aç/i })).toBeInTheDocument();
      expect(screen.queryByText('Proje ve Servis Envanteri')).not.toBeInTheDocument();
    });
  });

  it('3. Viewer rolüne sahip kullanıcı admin sayfasına girmeye çalıştığında 403 Forbidden ekranı görür', async () => {
    const viewerToken = createValidFutureToken('viewer', 'Viewer');
    const viewerUser = {
      username: 'viewer',
      fullName: 'İzleyici Test',
      email: 'viewer@gallerycrystal.com.tr',
      roles: ['Viewer'],
      token: viewerToken
    };
    localStorage.setItem('psl_user', JSON.stringify(viewerUser));
    localStorage.setItem('psl_token', viewerToken);

    vi.spyOn(api, 'getMe').mockResolvedValue(viewerUser);
    vi.spyOn(api, 'getDashboardMetrics').mockResolvedValue({
      totalProjects: 5,
      liveProjects: 3,
      pilotProjects: 1,
      developmentProjects: 1,
      maintenanceProjects: 0,
      pendingVerificationProjects: 2,
      quickAccessProjects: [],
      recentlyUpdatedProjects: [],
      recentReleases: [],
      criticalIntegrations: []
    });

    window.location.hash = 'admin';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/403 — Yetkisiz Erişim/i)).toBeInTheDocument();
      expect(screen.getByText(/Yalnızca Sistem Yöneticisi \(Admin\) rolüne sahip kullanıcılar/i)).toBeInTheDocument();
    });
  });

  it('4. Admin rolüne sahip kullanıcı admin sayfasına sorunsuz erişebilir', async () => {
    const adminToken = createValidFutureToken('admin', 'Admin');
    const adminUser = {
      username: 'admin',
      fullName: 'Sistem Yöneticisi',
      email: 'admin@gallerycrystal.com.tr',
      roles: ['Admin'],
      token: adminToken
    };
    localStorage.setItem('psl_user', JSON.stringify(adminUser));
    localStorage.setItem('psl_token', adminToken);

    vi.spyOn(api, 'getMe').mockResolvedValue(adminUser);
    vi.spyOn(api, 'getProjects').mockResolvedValue([]);

    window.location.hash = 'admin';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Proje ve URL Yönetim Konsolu/i)).toBeInTheDocument();
      expect(screen.queryByText(/403 — Yetkisiz Erişim/i)).not.toBeInTheDocument();
    });
  });

  it('5. Süresi dolmuş token (expired JWT) başlangıçta tespit edilir ve oturum düşürülür', async () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1 saat önce dolmuş
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'admin', exp: expiredExp }));
    const expiredToken = `${header}.${payload}.signature`;

    localStorage.setItem('psl_token', expiredToken);
    localStorage.setItem('psl_user', JSON.stringify({
      username: 'admin',
      fullName: 'Sistem Yöneticisi',
      token: expiredToken
    }));

    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem('psl_token')).toBeNull();
      expect(localStorage.getItem('psl_user')).toBeNull();
      expect(screen.getByRole('button', { name: /Oturum Aç/i })).toBeInTheDocument();
    });
  });

  it('6. Çıkış yapıldığında oturum ve token tamamen temizlenir ve login ekranına dönülür', async () => {
    const validToken = createValidFutureToken('admin', 'Admin');
    const validUser = {
      username: 'admin',
      fullName: 'Sistem Yöneticisi',
      roles: ['Admin'],
      token: validToken
    };
    localStorage.setItem('psl_user', JSON.stringify(validUser));
    localStorage.setItem('psl_token', validToken);

    vi.spyOn(api, 'getMe').mockResolvedValue(validUser);
    vi.spyOn(api, 'getDashboardMetrics').mockResolvedValue({
      totalProjects: 0,
      liveProjects: 0,
      pilotProjects: 0,
      developmentProjects: 0,
      maintenanceProjects: 0,
      pendingVerificationProjects: 0,
      quickAccessProjects: [],
      recentlyUpdatedProjects: [],
      recentReleases: [],
      criticalIntegrations: []
    });

    render(<App />);

    const logoutBtn = await screen.findByTitle(/Güvenli Çıkış Yap/i);
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('psl_token')).toBeNull();
      expect(localStorage.getItem('psl_user')).toBeNull();
      expect(screen.getByRole('button', { name: /Oturum Aç/i })).toBeInTheDocument();
    });
  });
});
