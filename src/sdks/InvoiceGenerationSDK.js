import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import PropTypes from 'prop-types';
import { TaxCalculationLib } from '../libs/TaxCalculationLib';

const generateInvoiceNumber = (lastNumber) => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const day = new Date().getDate().toString().padStart(2, '0');
  const sequence = (lastNumber + 1).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${sequence}`;
};

const InvoiceGenerationSDK = ({ 
  onInvoiceCreated, 
  onInvoiceUpdated,
  onInvoiceDeleted,
  selectedInvoice,
  setSelectedInvoice 
}) => {
  const [invoices, setInvoices] = useState(() => {
    const savedInvoices = localStorage.getItem('invoices');
    return savedInvoices ? new Map(JSON.parse(savedInvoices)) : new Map();
  });

  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(() => {
    const saved = localStorage.getItem('lastInvoiceNumber');
    return saved ? parseInt(saved) : 0;
  });

  const [currentInvoice, setCurrentInvoice] = useState({
    clientId: '',
    items: [{ name: '', quantity: '', unitPrice: '' }],
    taxRate: '',
    discountAmount: '',
    dueDate: ''
  });

  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  useEffect(() => {
    const entriesArray = Array.from(invoices.entries());
    localStorage.setItem('invoices', JSON.stringify(entriesArray));
    localStorage.setItem('lastInvoiceNumber', lastInvoiceNumber.toString());
  }, [invoices, lastInvoiceNumber]);

  useEffect(() => {
    if (selectedInvoice) {
      const invoice = invoices.get(selectedInvoice);
      if (invoice) {
        setCurrentInvoice({
          clientId: invoice.clientId,
          items: invoice.items,
          taxRate: invoice.taxRate,
          discountAmount: invoice.discountAmount,
          dueDate: new Date(invoice.dueDate).toISOString().split('T')[0]
        });
        setEditingInvoiceId(selectedInvoice);
      }
    }
  }, [selectedInvoice, invoices]);

  const taxLib = new TaxCalculationLib();

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const processedItems = currentInvoice.items.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
      subtotal: parseFloat(item.quantity) * parseFloat(item.unitPrice)
    }));

    const subtotal = calculateSubtotal(processedItems);
    const taxRate = parseFloat(currentInvoice.taxRate) || 0;
    const discountAmount = parseFloat(currentInvoice.discountAmount) || 0;
    const taxCalculation = taxLib.calculateTax(subtotal - discountAmount, taxRate);

    const invoiceNumber = generateInvoiceNumber(lastInvoiceNumber);
    setLastInvoiceNumber(prev => prev + 1);

    const newInvoice = {
      id: uuidv4(),
      invoiceNumber,
      clientId: currentInvoice.clientId,
      items: processedItems,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxCalculation.taxAmount,
      discountAmount: discountAmount,
      total: taxCalculation.total,
      dueDate: new Date(currentInvoice.dueDate),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setInvoices(prev => {
      const updated = new Map(prev);
      updated.set(newInvoice.id, newInvoice);
      return updated;
    });

    if (onInvoiceCreated) {
      onInvoiceCreated(newInvoice);
    }

    setCurrentInvoice({
      clientId: '',
      items: [{ name: '', quantity: '', unitPrice: '' }],
      taxRate: '',
      discountAmount: '',
      dueDate: ''
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...currentInvoice.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setCurrentInvoice(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', unitPrice: '' }]
    }));
  };

  const removeItem = (index) => {
    if (currentInvoice.items.length > 1) {
      setCurrentInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleUpdateInvoice = (e) => {
    e.preventDefault();
    
    const processedItems = currentInvoice.items.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
      subtotal: parseFloat(item.quantity) * parseFloat(item.unitPrice)
    }));

    const subtotal = calculateSubtotal(processedItems);
    const taxRate = parseFloat(currentInvoice.taxRate) || 0;
    const discountAmount = parseFloat(currentInvoice.discountAmount) || 0;
    const taxCalculation = taxLib.calculateTax(subtotal - discountAmount, taxRate);

    const existingInvoice = invoices.get(editingInvoiceId);
    const updatedInvoice = {
      ...existingInvoice,
      clientId: currentInvoice.clientId,
      items: processedItems,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxCalculation.taxAmount,
      discountAmount: discountAmount,
      total: taxCalculation.total,
      dueDate: new Date(currentInvoice.dueDate),
      updatedAt: new Date()
    };

    setInvoices(prev => {
      const updated = new Map(prev);
      updated.set(editingInvoiceId, updatedInvoice);
      return updated;
    });

    if (onInvoiceUpdated) {
      onInvoiceUpdated(updatedInvoice);
    }

    setEditingInvoiceId(null);
    setSelectedInvoice(null);
    setCurrentInvoice({
      clientId: '',
      items: [{ name: '', quantity: '', unitPrice: '' }],
      taxRate: '',
      discountAmount: '',
      dueDate: ''
    });
  };

  const cancelEdit = () => {
    setEditingInvoiceId(null);
    setSelectedInvoice(null);
    setCurrentInvoice({
      clientId: '',
      items: [{ name: '', quantity: '', unitPrice: '' }],
      taxRate: '',
      discountAmount: '',
      dueDate: ''
    });
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      if (onInvoiceDeleted) {
        onInvoiceDeleted(invoiceId);
      }
      setInvoices(prev => {
        const updated = new Map(prev);
        updated.delete(invoiceId);
        return updated;
      });
    }
  };

  const entries = Array.from(invoices.values());

  return (
    <div className="invoice-generation-sdk">
      <h2>{editingInvoiceId ? 'Edit Invoice' : 'Generate Invoice'}</h2>
      
      <form onSubmit={editingInvoiceId ? handleUpdateInvoice : handleSubmit} className="invoice-form">
        <div className="form-group">
          <label htmlFor="clientId">Client ID:</label>
          <input
            type="text"
            id="clientId"
            value={currentInvoice.clientId}
            onChange={(e) => setCurrentInvoice(prev => ({ ...prev, clientId: e.target.value }))}
            required
            className="form-control"
            placeholder="Enter client ID"
          />
        </div>

        <div className="items-section">
          <h3>Items</h3>
          {currentInvoice.items.map((item, index) => (
            <div key={index} className="item-row">
              <div className="form-group">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  placeholder="Item name"
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  min="1"
                  step="1"
                  required
                  className="form-control"
                  placeholder="Quantity"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="form-control"
                  placeholder="Unit price"
                />
              </div>
              {currentInvoice.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn btn-secondary">
            Add Item
          </button>
        </div>

        <div className="invoice-summary">
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate:</label>
            <input
              type="number"
              id="taxRate"
              value={currentInvoice.taxRate}
              onChange={(e) => setCurrentInvoice(prev => ({ ...prev, taxRate: e.target.value }))}
              min="0"
              max="1"
              step="0.01"
              className="form-control"
              placeholder="Enter tax rate (e.g., 0.1 for 10%)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="discountAmount">Discount Amount:</label>
            <input
              type="number"
              id="discountAmount"
              value={currentInvoice.discountAmount}
              onChange={(e) => setCurrentInvoice(prev => ({ ...prev, discountAmount: e.target.value }))}
              min="0"
              step="0.01"
              className="form-control"
              placeholder="Enter discount amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date:</label>
            <input
              type="date"
              id="dueDate"
              value={currentInvoice.dueDate}
              onChange={(e) => setCurrentInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-actions">
          {editingInvoiceId ? (
            <>
              <button type="submit" className="btn-primary">Update Invoice</button>
              <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <button type="submit" className="btn-primary">Generate Invoice</button>
          )}
        </div>
      </form>

      <div className="invoices-list">
        <h3>Existing Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Client ID</th>
              <th>Total</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.clientId}</td>
                <td>${invoice.total.toFixed(2)}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className="invoice-actions">
                  <button 
                    onClick={() => setSelectedInvoice(invoice.id)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

InvoiceGenerationSDK.propTypes = {
  onInvoiceCreated: PropTypes.func,
  onInvoiceUpdated: PropTypes.func,
  onInvoiceDeleted: PropTypes.func,
  selectedInvoice: PropTypes.string,
  setSelectedInvoice: PropTypes.func.isRequired
};

export default InvoiceGenerationSDK;

// Export the hook for use in other components
export const useInvoiceGenerationSDK = (onInvoiceCreated) => {
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? new Map(JSON.parse(saved)) : new Map();
  });

  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(() => {
    const saved = localStorage.getItem('lastInvoiceNumber');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    const entriesArray = Array.from(invoices.entries());
    localStorage.setItem('invoices', JSON.stringify(entriesArray));
    localStorage.setItem('lastInvoiceNumber', lastInvoiceNumber.toString());
  }, [invoices, lastInvoiceNumber]);

  const taxLib = new TaxCalculationLib();

  return {
    createInvoice: (clientId, items, region, discountAmount = 0, dueDate = null) => {
      const processedItems = items.map(item => ({
        ...item,
        subtotal: new Decimal(item.unitPrice).times(item.quantity).toNumber()
      }));

      const subtotal = processedItems.reduce((sum, item) => {
        return sum.plus(item.subtotal);
      }, new Decimal(0)).toNumber();

      const taxCalculation = taxLib.calculateTax(subtotal - discountAmount, region);
      
      const invoiceNumber = generateInvoiceNumber(lastInvoiceNumber);
      setLastInvoiceNumber(prev => prev + 1);

      const invoice = {
        id: uuidv4(),
        invoiceNumber,
        clientId,
        items: processedItems,
        subtotal,
        taxRate: taxCalculation.taxRate,
        taxAmount: taxCalculation.taxAmount,
        discountAmount,
        total: taxCalculation.total,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setInvoices(prevInvoices => {
        const newInvoices = new Map(prevInvoices);
        newInvoices.set(invoice.id, invoice);
        return newInvoices;
      });

      if (onInvoiceCreated) {
        onInvoiceCreated(invoice);
      }

      return invoice;
    },
    getInvoice: (id) => invoices.get(id),
    getInvoiceByNumber: (invoiceNumber) => 
      Array.from(invoices.values()).find(
        invoice => invoice.invoiceNumber === invoiceNumber
      ),
    updateInvoiceStatus: (id, status) => {
      const invoice = invoices.get(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const updatedInvoice = {
        ...invoice,
        status,
        updatedAt: new Date()
      };

      setInvoices(prevInvoices => {
        const newInvoices = new Map(prevInvoices);
        newInvoices.set(id, updatedInvoice);
        return newInvoices;
      });

      return updatedInvoice;
    },
    listInvoices: () => Array.from(invoices.values())
  };
}; 