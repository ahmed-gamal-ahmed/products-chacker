# Product Inventory Checker

A modern web application for checking products in inventory using barcode scanning functionality, optimized for Zebra TC26 and other mobile devices.

## Features

- **Barcode Input**: Enter product barcodes manually or scan them with the device's barcode scanner
- **Quantity Tracking**: Add quantities for each product
- **Dynamic Table**: Real-time display of added products
- **Excel Export**: Export the inventory list to Excel format
- **Auto-Save**: All data is automatically saved to local storage
- **Touch-Optimized**: Large touch targets and responsive design for mobile devices
- **Zebra TC26 Optimized**: Specifically designed for Zebra TC26 screen size and capabilities
- **Data Persistence**: Progress is saved locally and survives page refreshes

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Add Products**:
   - Scan a barcode using the device's scanner or manually enter the barcode number
   - Enter the quantity in the quantity field
   - Click "Add Product" or press Enter to add the product to the list
   - Data is automatically saved to local storage

2. **View Products**:
   - All added products are displayed in a compact table below the input form
   - Each row shows the barcode, quantity, and time added
   - The table is optimized for the TC26's screen size

3. **Remove Products**:
   - Click the trash icon next to any product to remove it from the list
   - Changes are automatically saved

4. **Clear All Data**:
   - Click "Clear All" to remove all products from the list
   - This action will also clear the local storage

5. **Export to Excel**:
   - Click the "Export to Excel" button to download the current inventory list
   - The file will be named with the current date (e.g., `inventory-check-2024-01-15.xlsx`)

6. **Data Persistence**:
   - All data is automatically saved to the device's local storage
   - If the page is refreshed or the app is closed and reopened, all data will be restored

## Technologies Used

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **SheetJS (xlsx)** for Excel export functionality

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles with Tailwind CSS
```

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Development

The application uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Vite** for fast development server and building

## License

This project is open source and available under the MIT License. 