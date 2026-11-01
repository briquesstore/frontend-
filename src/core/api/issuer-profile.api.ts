import api from './client';

export interface IssuerProfile {
  id: string;
  version: number;
  raisonSociale: string;
  formeJuridique: string;
  capitalSocial: number;
  siegeSocial: string;
  rccm: string;
  ncc: string;
  idu: string;
  regimeFiscal: string;
  centreImpots?: string | null;
  telephone: string;
  email: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateIssuerProfileDto {
  raisonSociale: string;
  formeJuridique: string;
  capitalSocial: number;
  siegeSocial: string;
  rccm: string;
  ncc: string;
  idu: string;
  regimeFiscal: string;
  centreImpots?: string;
  telephone: string;
  email: string;
  logoUrl?: string;
}

export const issuerProfileApi = {
  getActive: () => api.get<IssuerProfile>('/admin/invoices/issuer-profile/current'),
  
  update: (data: CreateIssuerProfileDto) => 
    api.post<IssuerProfile>('/admin/invoices/issuer-profile', data),
  
  getHistory: () => api.get<IssuerProfile[]>('/admin/invoices/issuer-profile/history'),
};
