import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, Trash2, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Product {
  id: string;
  barcode: string;
  quantity: number;
  timestamp: Date;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quantityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('inventory-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
          ...product,
          timestamp: new Date(product.timestamp)
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
        // Reset saved indicator after 2 seconds
        setTimeout(() => {
          setIsSaved(false);
          setSaveMessage('');
        }, 2000);
      }
    }
  }, [products, isSaved]);

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
          timestamp: new Date(), // Update timestamp
        };
        setProducts(updatedProducts);
        // Show update notification
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
          timestamp: new Date(),
        };
        setProducts([...products, newProduct]);
      }
      setBarcode('');
      setQuantity('');
      // Focus barcode input for next scan/entry
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
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
        'Date Added': product.timestamp.toLocaleString(),
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
    if (e.key === 'Enter') {
      addProduct();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-2">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
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
                onChange={(e) => {
                  setQuantity(e.target.value);
                  const val = e.target.value;
                  if (quantityDebounceRef.current) {
                    clearTimeout(quantityDebounceRef.current);
                  }
                  if (
                    barcode.trim() &&
                    val.trim() &&
                    /^\d+$/.test(val) &&
                    parseInt(val) > 0
                  ) {
                    quantityDebounceRef.current = setTimeout(() => {
                      addProduct();
                    }, 500);
                  }
                }}
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
              <button
                onClick={clearAllData}
                className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-lg"
              >
                Clear All
              </button>
            </div>
          </div>
          {products.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Product List ({products.length} items)
                </h2>
                <button
                  onClick={exportToExcel}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-lg"
                >
                  <Download size={20} />
                  Export to Excel
                </button>
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
                        Time
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
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                          {product.timestamp.toLocaleTimeString()}
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