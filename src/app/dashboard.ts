import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Shop {
  no: number;
  name: string;
  mobile: string;
  agreement: boolean;
  totalAdvance: number;
  advanceRemaining: number;
  amount: number;
  monthly: (number|null)[]; // 12 months
  remark: string;
  dueHistory: { month: string, year: number }[]; // for tooltip
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor, NgIf, FormsModule, DecimalPipe,
    MatTableModule, MatInputModule, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  displayedColumns = [
    'no', 'name', 'mobile', 'agreement', 'totalAdvance', 'advanceRemaining', 'amount',
    ...this.months.map(m => m.toLowerCase()),
    'totalPaid', 'totalDue', 'dueMonths', 'remark', 'action'
  ];

  shops: Shop[] = [
    {
      no: 1, name: 'Amit Kumar', mobile: '9876543210', agreement: true,
      totalAdvance: 20000, advanceRemaining: 10000, amount: 3400,
      monthly: [3400, 3400, 3400, null, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Apr', year: 2024 }, { month: 'May', year: 2024 }]
    },
    {
      no: 2, name: 'Priya Singh', mobile: '9123456780', agreement: false,
      totalAdvance: 15000, advanceRemaining: 5000, amount: 4000,
      monthly: [4000, 4000, null, null, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Mar', year: 2024 }, { month: 'Apr', year: 2024 }]
    },
    {
      no: 3, name: 'Ravi Patel', mobile: '9988776655', agreement: true,
      totalAdvance: 18000, advanceRemaining: 8000, amount: 3200,
      monthly: [3200, 3200, 3200, 3200, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'May', year: 2024 }]
    },
    {
      no: 4, name: 'Sunita Sharma', mobile: '9001122334', agreement: true,
      totalAdvance: 25000, advanceRemaining: 15000, amount: 3500,
      monthly: [3500, 3500, 3500, 3500, 3500, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Jun', year: 2024 }]
    },
    {
      no: 5, name: 'Vikas Gupta', mobile: '9112233445', agreement: false,
      totalAdvance: 12000, advanceRemaining: 2000, amount: 3000,
      monthly: [null, null, null, null, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [
        { month: 'Jan', year: 2024 }, { month: 'Feb', year: 2024 }, { month: 'Mar', year: 2024 }
      ]
    },
    {
      no: 6, name: 'Meena Joshi', mobile: '9876501234', agreement: true,
      totalAdvance: 22000, advanceRemaining: 12000, amount: 3700,
      monthly: [3700, 3700, 3700, 3700, 3700, 3700, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Jul', year: 2024 }]
    },
    {
      no: 7, name: 'Suresh Yadav', mobile: '9009988776', agreement: false,
      totalAdvance: 16000, advanceRemaining: 6000, amount: 3100,
      monthly: [3100, 3100, 3100, 3100, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'May', year: 2024 }]
    },
    {
      no: 8, name: 'Anjali Verma', mobile: '9123456700', agreement: true,
      totalAdvance: 14000, advanceRemaining: 4000, amount: 2900,
      monthly: [2900, 2900, 2900, 2900, 2900, 2900, 2900, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Aug', year: 2024 }]
    },
    {
      no: 9, name: 'Deepak Saini', mobile: '9876543200', agreement: true,
      totalAdvance: 17000, advanceRemaining: 7000, amount: 3300,
      monthly: [3300, 3300, 3300, 3300, 3300, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Jun', year: 2024 }]
    },
    {
      no: 10, name: 'Kavita Rao', mobile: '9001122000', agreement: false,
      totalAdvance: 11000, advanceRemaining: 1000, amount: 2800,
      monthly: [2800, 2800, 2800, null, null, null, null, null, null, null, null, null],
      remark: '', dueHistory: [{ month: 'Apr', year: 2024 }]
    }
  ];

  getTotalPaid(shop: Shop): number {
    return shop.monthly.reduce((sum: number, val: number | null) => sum + (val ?? 0), 0);
  }

  getTotalDue(shop: Shop): number {
    const unpaid = shop.monthly.filter(val => val === null).length;
    return unpaid * shop.amount;
  }

  getDueMonths(shop: Shop): number {
    return shop.monthly.filter(val => val === null).length;
  }

  getDueMonthsTooltip(shop: Shop): string {
    return shop.dueHistory.map(d => `${d.month} ${d.year}`).join(', ');
  }
}
