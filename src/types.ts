export interface Expense {
  id: string;
  date: string;
  departure: string;
  destination: string;
  method: string;
  distance: number;
  cost: number;
  note?: string;
  tagId?: string;
}

export type TransportationMethod = '電車' | 'バス' | 'タクシー' | '走行距離' | '高速道路利用料金' | '宿泊費' | 'その他';
