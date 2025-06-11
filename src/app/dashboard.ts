import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopDataService, ShopData } from './shop-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor, NgIf, FormsModule, ReactiveFormsModule, DecimalPipe,
    MatTableModule, MatInputModule, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  years = [2022, 2023, 2024];
  selectedYear = 2024;
  months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  displayedColumns = [
    'no', 'name', 'mobile', 'agreement', 'totalAdvance', 'advanceRemaining', 'amount',
    ...this.months.map(m => m.toLowerCase()),
    'prevDue', 'totalPaid', 'totalDue', 'dueMonths', 'remark', 'action'
  ];
  form?: FormGroup;
  shops: ShopData[] = [];
  prevYearDues: { [shopNo: number]: number } = {};

  constructor(private fb: FormBuilder, private shopDataService: ShopDataService) {
    this.loadShopsForYear(this.selectedYear);
  }

  get shopsFormArray(): FormArray {
    return this.form?.get('shops') as FormArray;
  }

  createShopGroup(shop: ShopData): FormGroup {
    return this.fb.group({
      no: [shop.no],
      name: [shop.name],
      mobile: [shop.mobile],
      agreement: [shop.agreement],
      totalAdvance: [shop.totalAdvance],
      advanceRemaining: [shop.advanceRemaining],
      amount: [shop.amount],
      monthly: this.fb.array(shop.monthly.map(val => this.fb.control(val, Validators.required))),
      remark: [shop.remark, Validators.required],
      prevDue: [shop.prevDue || 0]
    });
  }

  loadShopsForYear(year: number) {
    this.shops = this.shopDataService.getShopsForYear(year);
    this.form = this.fb.group({
      shops: this.fb.array(this.shops.map(shop => this.createShopGroup(shop)))
    });
    this.setupValueChangeHandlers();
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.loadShopsForYear(year);
  }

  setupValueChangeHandlers() {
    this.shopsFormArray.controls.forEach((ctrl) => {
      const shopGroup = ctrl as FormGroup;
      shopGroup.get('monthly')?.valueChanges.subscribe(() => {
        shopGroup.updateValueAndValidity({ onlySelf: true });
      });
      shopGroup.get('remark')?.valueChanges.subscribe(() => {
        shopGroup.updateValueAndValidity({ onlySelf: true });
      });
    });
  }

  getTotalPaid(shopGroup: FormGroup): number {
    const monthly = shopGroup.get('monthly') as FormArray;
    return monthly.controls.reduce((sum, ctrl) => sum + (ctrl.value ? Number(ctrl.value) : 0), 0);
  }

  getTotalDue(shopGroup: FormGroup): number {
    const monthly = shopGroup.get('monthly') as FormArray;
    const amount = shopGroup.get('amount')?.value;
    const unpaid = monthly.controls.filter(ctrl => !ctrl.value).length;
    const prevDue = shopGroup.get('prevDue')?.value || 0;
    return unpaid * amount + prevDue;
  }

  getDueMonths(shopGroup: FormGroup): number {
    const monthly = shopGroup.get('monthly') as FormArray;
    return monthly.controls.filter(ctrl => !ctrl.value).length;
  }

  getDueMonthsTooltip(shopGroup: FormGroup): string {
    const monthly = shopGroup.get('monthly') as FormArray;
    return monthly.controls
      .map((ctrl, i) => !ctrl.value ? this.months[i] : null)
      .filter(Boolean)
      .join(', ');
  }

  onSave() {
    if (this.form?.invalid) {
      alert('Please fill all required fields.');
      return;
    }
    // Here you would send this.form.value to your backend
    console.log('Saved data:', this.form?.value);
    alert('Data saved! (see console)');
  }

  get dataSource() {
    return this.shopsFormArray ? [...this.shopsFormArray.controls] : [];
  }
}
