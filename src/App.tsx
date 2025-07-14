import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, Trash2, Save, Settings2, Menu, FileUp, Camera } from 'lucide-react';
import * as XLSX from 'xlsx';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

interface Product {
  id: string;
  barcode: string;
  quantity: number;
}

interface ComparisonRow {
  barcode: string;
  importedQty: number | null;
  checkedQty: number | null;
  status: 'match' | 'mismatch' | 'missing' | 'extra';
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [autoAdd, setAutoAdd] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comparison, setComparison] = useState<ComparisonRow[] | null>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quantityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoAddValue = useRef<string>('');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('inventory-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
          id: product.id,
          barcode: product.barcode,
          quantity: product.quantity,
        }));
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error loading saved products:', error);
      }
    }
  }, []);

  // Save to localStorage whenever products change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('inventory-products', JSON.stringify(products));
      if (!isSaved) {
        setIsSaved(true);
        setSaveMessage('Data saved automatically');
        setTimeout(() => {
          setIsSaved(false);
          setSaveMessage('');
        }, 2000);
      }
    }
  }, [products, isSaved]);

  // Debounced auto-add logic
  useEffect(() => {
    if (autoAdd && barcode.trim() && quantity.trim() && /^\d+$/.test(quantity) && parseInt(quantity) > 0) {
      if (lastAutoAddValue.current === quantity + '|' + barcode) return;
      if (quantityDebounceRef.current) clearTimeout(quantityDebounceRef.current);
      quantityDebounceRef.current = setTimeout(() => {
        addProduct();
        lastAutoAddValue.current = quantity + '|' + barcode;
      }, 500);
    } else {
      if (quantityDebounceRef.current) clearTimeout(quantityDebounceRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, barcode, autoAdd]);

  // Close sidebar when clicking outside
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen]);

  const addProduct = () => {
    if (barcode.trim() && quantity.trim()) {
      const existingProductIndex = products.findIndex(
        product => product.barcode === barcode.trim()
      );
      if (existingProductIndex !== -1) {
        // Update existing product quantity
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + parseInt(quantity),
        };
        setProducts(updatedProducts);
        setIsSaved(true);
        setSaveMessage(`Quantity updated for barcode ${barcode.trim()}`);
        setTimeout(() => {
          setIsSaved(false);
          setSaveMessage('');
        }, 2000);
      } else {
        // Add new product
        const newProduct: Product = {
          id: Date.now().toString(),
          barcode: barcode.trim(),
          quantity: parseInt(quantity),
        };
        setProducts([...products, newProduct]);
      }
      setBarcode('');
      setQuantity('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      lastAutoAddValue.current = '';
    }
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const exportToExcel = () => {
    if (products.length === 0) {
      alert('No products to export!');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      products.map(product => ({
        'Barcode': product.barcode,
        'Quantity': product.quantity,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Check');
    const fileName = `inventory-check-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setProducts([]);
      localStorage.removeItem('inventory-products');
    }
  };

  // Focus quantity input after barcode is entered and Enter is pressed
  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent) => {
    if (!autoAdd && e.key === 'Enter') {
      addProduct();
    }
  };

  // Import Excel logic
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // Find columns for barcode and quantity
      let barcodeCol = -1, qtyCol = -1;
      const header = rows[0].map((h: any) => String(h).toLowerCase());
      barcodeCol = header.findIndex((h: string) => h.includes('barcode'));
      if (barcodeCol === -1) barcodeCol = header.findIndex((h: string) => h.includes('bar code'));
      qtyCol = header.findIndex((h: string) => h.includes('quantity') || h.includes('qty'));
      if (qtyCol === -1) qtyCol = header.findIndex((h: string) => h.includes('sum of work quantity'));
      if (barcodeCol === -1 || qtyCol === -1) {
        alert('Excel must have columns for Barcode/Bar Code and Quantity/SUM of Work quantity.');
        return;
      }
      // Build imported map
      const importedMap: Record<string, number> = {};
      for (let i = 1; i < rows.length; ++i) {
        const row = rows[i];
        const bc = String(row[barcodeCol]).trim();
        const qty = Number(row[qtyCol]);
        if (bc && !isNaN(qty)) importedMap[bc] = qty;
      }
      // Build checked map
      const checkedMap: Record<string, number> = {};
      products.forEach(p => { checkedMap[p.barcode] = p.quantity; });
      // Build comparison rows
      const allBarcodes = new Set([...Object.keys(importedMap), ...Object.keys(checkedMap)]);
      const compRows: ComparisonRow[] = Array.from(allBarcodes).map(bc => {
        const importedQty = importedMap[bc] ?? null;
        const checkedQty = checkedMap[bc] ?? null;
        let status: ComparisonRow['status'];
        if (importedQty !== null && checkedQty !== null) {
          status = importedQty === checkedQty ? 'match' : 'mismatch';
        } else if (importedQty !== null) {
          status = 'missing';
        } else {
          status = 'extra';
        }
        return { barcode: bc, importedQty, checkedQty, status };
      });
      setComparison(compRows);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row relative">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-30 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Open sidebar"
      >
        <Menu size={28} />
      </button>
      {/* Sidebar Drawer */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out flex flex-col items-center py-8 gap-8 w-48 sm:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setAutoAdd(a => !a)}
          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md font-semibold border w-32 sm:w-44 text-xs sm:text-sm ${autoAdd ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-200 text-gray-700 border-gray-400'} transition`}
        >
          <Settings2 size={22} />
          Auto Add
          <span className="font-bold">{autoAdd ? 'On' : 'Off'}</span>
        </button>
        <button
          onClick={clearAllData}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-md bg-red-600 text-white w-32 sm:w-44 text-xs sm:text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Trash2 size={22} />
          Clear All
        </button>
        <button
          onClick={exportToExcel}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-md bg-green-600 text-white w-32 sm:w-44 text-xs sm:text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <Download size={22} />
          Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-md bg-yellow-500 text-white w-32 sm:w-44 text-xs sm:text-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        >
          <FileUp size={22} />
          Import Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportExcel}
        />
        {comparison && (
          <button
            onClick={() => {
              // Only export missing or deficit (checked < imported) items
              const toExport = comparison.filter(row =>
                row.status === 'missing' || (row.status === 'mismatch' && row.checkedQty !== null && row.importedQty !== null && row.checkedQty < row.importedQty)
              ).map(row => ({
                Barcode: row.barcode,
                'Imported Quantity': row.importedQty ?? '',
                'Checked Quantity': row.checkedQty ?? '',
                Status: row.status === 'missing' ? 'Not Scanned' : 'Deficit',
              }));
              if (toExport.length === 0) {
                alert('No missing or deficit items to export.');
                return;
              }
              const ws = XLSX.utils.json_to_sheet(toExport);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Comparison Results');
              XLSX.writeFile(wb, `comparison-results-${new Date().toISOString().split('T')[0]}.xlsx`);
            }}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-md bg-indigo-600 text-white w-32 sm:w-44 text-xs sm:text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            <Download size={22} />
            Export Comparison
          </button>
        )}
      </div>
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Barcode Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Scan Barcode</h2>
            <BarcodeScannerComponent
              width={300}
              height={300}
              onUpdate={(err, result) => {
                if (result) {
                  setBarcode(result.getText());
                  setShowScanner(false);
                  if (quantityInputRef.current) quantityInputRef.current.focus();
                }
              }}
            />
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => setShowScanner(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="flex-1 max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 mt-4 sm:mt-8 mx-2 sm:mx-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Product Inventory Checker
          </h1>
          {/* Save indicator */}
          {isSaved && (
            <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
              <Save size={16} />
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                Barcode Number
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  id="barcode"
                  ref={barcodeInputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleBarcodeKeyPress}
                  placeholder="Scan or enter barcode..."
                  className="w-full px-3 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setShowScanner(true)}
                  aria-label="Open camera to scan barcode"
                >
                  <Camera size={22} />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                ref={quantityInputRef}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyPress={handleQuantityKeyPress}
                placeholder="Enter quantity..."
                min="1"
                className="w-full px-3 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addProduct}
                disabled={!barcode.trim() || !quantity.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
          </div>
          {products.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Product List ({products.length} items)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 break-all">
                          {product.barcode}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.quantity}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Comparison Table */}
          {comparison && (
            <div className="mb-4 mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Comparison Results</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imported Qty</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checked Qty</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparison.map((row, idx) => (
                      <tr key={row.barcode} className={
                        row.status === 'match' ? 'bg-green-50' :
                        row.status === 'mismatch' ? 'bg-yellow-50' :
                        row.status === 'missing' ? 'bg-red-50' :
                        'bg-blue-50'
                      }>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{row.barcode}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{row.importedQty ?? '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{row.checkedQty ?? '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {products.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">No products added yet</h3>
              <p className="text-sm text-gray-500">Start by adding a product using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 