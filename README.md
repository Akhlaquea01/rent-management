# Rent Management System

A comprehensive, modern web application for managing rent collection, tenant tracking, and reporting for commercial properties with 150+ shops.

## 🚀 Features

### Core Functionality
- **Tenant Management**: Add, edit, and manage tenant information with shop numbers, rent amounts, and status
- **Rent Entry**: Record monthly rent payments with advance deduction support
- **Advance Tracker**: Manage advance deposits and automatic/manual deductions
- **Tenant History**: View yearly rent history with printable summaries
- **Reports & Analytics**: Comprehensive reporting with collection rates and payment status

### Smart Features
- **Automatic Calculations**: Due calculations, advance deductions, and rent tracking
- **Conditional Formatting**: Visual indicators for payment status (Paid, Pending, Partial, Overdue)
- **Shop Number Validation**: Prevents duplicate shop assignments
- **Inactive Tenant Handling**: Graceful management of tenant transitions
- **Printable Reports**: Clean, professional reports for printing

### Advanced Capabilities
- **Multi-month Dues**: Automatic carry-forward of pending amounts
- **Partial Payments**: Support for partial rent payments with status tracking
- **Advance Management**: Flexible advance payment and deduction system
- **Year-wise Data**: Dynamic yearly views with historical data
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: Zustand with persistence
- **Routing**: React Router v6
- **Data Grid**: MUI X Data Grid
- **Notifications**: React Hot Toast
- **Print Support**: Built-in browser print functionality

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rent-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### 1. Dashboard Overview
- View key metrics: total tenants, collection rates, pending amounts
- Quick access to recent tenants and common actions
- Real-time statistics and overview

### 2. Tenant Management
- **Add New Tenant**: Click "Add Tenant" button
- **Required Fields**: Name, Shop Number, Rent Amount
- **Optional Fields**: Phone, Email, Address, Advance Amount
- **Status Management**: Mark tenants as Active/Inactive
- **Shop Validation**: System prevents duplicate shop numbers

### 3. Rent Entry
- **Select Tenant**: Choose from active tenants only
- **Enter Payment Details**: Amount, date, payment mode
- **Advance Options**: Automatically deduct from advance balance
- **Status Calculation**: System determines payment status automatically

### 4. Advance Tracker
- **View Balance**: See current advance balance for each tenant
- **Add Transactions**: Record deposits or manual deductions
- **Transaction History**: Complete audit trail of all advance activities

### 5. Tenant History
- **Select Tenant & Year**: Choose specific tenant and year
- **Monthly View**: See Jan-Dec rent history with status indicators
- **Summary Statistics**: Total rent, paid, pending, and advance balance
- **Print Reports**: Generate printable summaries

### 6. Reports & Analytics
- **Collection Rates**: Monthly and yearly collection percentages
- **Payment Status**: Detailed view of all tenant payment statuses
- **Filter Options**: Filter by year and month
- **Export Ready**: Print-friendly reports

## 📊 Data Structure

### Tenant Master
```typescript
{
  id: string;
  name: string;
  shopNumber: string;
  rentAmount: number;
  status: 'Active' | 'Inactive';
  advanceAmount: number;
  agreementDate: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}
```

### Rent Entry
```typescript
{
  id: string;
  tenantId: string;
  month: string; // "YYYY-MM"
  year: number;
  rentAmount: number;
  paidAmount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online';
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  advanceDeduction: number;
  remarks?: string;
}
```

### Advance Transaction
```typescript
{
  id: string;
  tenantId: string;
  type: 'Deposit' | 'Deduction';
  amount: number;
  date: string;
  description: string;
}
```

## 🎨 UI Features

### Conditional Formatting
- **Green**: Paid status, successful operations
- **Red**: Overdue status, inactive tenants, errors
- **Orange**: Pending status, warnings
- **Blue**: Partial payments, info messages

### Responsive Design
- **Desktop**: Full-featured interface with sidebar navigation
- **Mobile**: Collapsible navigation with touch-friendly controls
- **Tablet**: Optimized layout for medium screens

### Print Support
- **Clean Layout**: Print-optimized reports
- **Summary Views**: One-page tenant summaries
- **Professional Formatting**: Ready for official use

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_TITLE=Rent Management System
REACT_APP_CURRENCY=₹
```

### Customization
- **Theme**: Modify colors and styling in `src/App.tsx`
- **Data Persistence**: Configure storage options in `src/store/rentStore.ts`
- **Validation Rules**: Update validation logic in form components

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your GitHub repository
- **AWS S3**: Upload build files to S3 bucket
- **Traditional Hosting**: Upload build files to web server

## 🔒 Data Security

- **Local Storage**: All data is stored locally in browser
- **No External APIs**: No data transmission to external servers
- **Backup**: Export data regularly for backup purposes
- **Privacy**: Complete data privacy and control

## 📈 Performance

- **Fast Loading**: Optimized bundle size
- **Smooth Interactions**: Responsive UI with minimal lag
- **Efficient Storage**: Optimized data storage and retrieval
- **Scalable**: Handles 150+ tenants efficiently

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation above
- Review the code comments
- Create an issue in the repository

---

**Built with ❤️ for efficient rent management** 