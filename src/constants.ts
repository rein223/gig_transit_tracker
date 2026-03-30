import { TransportationMethod } from './types';

export const TRANSPORTATION_METHODS: TransportationMethod[] = [
  '電車',
  'バス',
  'タクシー',
  '走行距離',
  '高速道路利用料金',
  '宿泊費',
  'その他'
];

export const STORAGE_KEY = 'transit_expenses_v1';
export const CAR_REIMBURSEMENT_RATE = 20; // 20円/km
