import { Injectable } from '@angular/core';

export interface ShopData {
  no: number;
  name: string;
  mobile: string;
  agreement: boolean;
  totalAdvance: number;
  advanceRemaining: number;
  amount: number;
  monthly: (number|null)[]; // 12 months
  remark: string;
  prevDue: number;
  year: number;
}

@Injectable({ providedIn: 'root' })
export class ShopDataService {
  private baseShops = [
    {
      no: 1, name: 'Amit Kumar', mobile: '9876543210', agreement: true,
      totalAdvance: 20000, advanceRemaining: 10000, amount: 3400,
      monthly: [3400, 3400, 3400, null, null, null, null, null, null, null, null, null],
      remark: '', prevDue: 0
    },
    {
      no: 2, name: 'Priya Singh', mobile: '9123456780', agreement: false,
      totalAdvance: 15000, advanceRemaining: 5000, amount: 4000,
      monthly: [4000, 4000, null, null, null, null, null, null, null, null, null, null],
      remark: '', prevDue: 0
    },
    {
      no: 3, name: 'Ravi Patel', mobile: '9988776655', agreement: true,
      totalAdvance: 18000, advanceRemaining: 8000, amount: 3200,
      monthly: [3200, 3200, 3200, 3200, null, null, null, null, null, null, null, null],
      remark: '', prevDue: 0
    },
    {
      no: 4, name: 'Sunita Sharma', mobile: '9001122334', agreement: true,
      totalAdvance: 25000, advanceRemaining: 15000, amount: 3500,
      monthly: [3500, 3500, 3500, 3500, 3500, null, null, null, null, null, null, null],
      remark: '', prevDue: 0
    },
    {
      no: 5, name: 'Vikas Gupta', mobile: '9112233445', agreement: false,
      totalAdvance: 12000, advanceRemaining: 2000, amount: 3000,
      monthly: [null, null, null, null, null, null, null, null, null, null, null, null],
      remark: '', prevDue: 0
    }
  ];

  private years = [2022, 2023, 2024];

  // Simulate a backend: keep all years' data in memory
  private allShops: ShopData[] = [];

  constructor() {
    this.generateAllYearsData();
  }

  private generateAllYearsData() {
    this.allShops = [];
    for (let y = 0; y < this.years.length; y++) {
      for (let i = 0; i < 5; i++) {
        // Deep copy monthly array
        const monthly = [...this.baseShops[i].monthly];
        this.allShops.push({
          ...this.baseShops[i],
          monthly,
          year: this.years[y],
          prevDue: 0
        });
      }
    }
    // Fill prevDue for each year except the first
    for (let y = 1; y < this.years.length; y++) {
      for (let i = 0; i < 5; i++) {
        const prevIndex = (y - 1) * 5 + i;
        const currIndex = y * 5 + i;
        const prevShop = this.allShops[prevIndex];
        const currShop = this.allShops[currIndex];
        currShop.prevDue = prevShop.monthly.filter(val => val === null).length * prevShop.amount;
      }
    }
  }

  getShopsForYear(year: number): ShopData[] {
    // Return a deep copy to avoid mutation
    return this.allShops
      .filter(shop => shop.year === year)
      .map(shop => ({ ...shop, monthly: [...shop.monthly] }));
  }
} 