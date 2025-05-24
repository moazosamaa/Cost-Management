import React, { useState, useEffect } from 'react';
import CostEntrySDK from './sdks/CostEntrySDK';
import InvoiceGenerationSDK from './sdks/InvoiceGenerationSDK';
import InvoiceDueReminderSDK from './sdks/InvoiceDueReminderSDK';
import InvoiceService from './services/InvoiceService';
import TaxCalculator from './components/TaxCalculator';
import './styles/styles';

function App() {
  const [invoiceId, setInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const invoiceService = new InvoiceService();

  // Load invoices on component mount
  useEffect(() => {
    const loadedInvoices = invoiceService.getAllInvoices();
    setInvoices(loadedInvoices);
  }, []);

  const handleCostEntryCreated = (entry) => {
    console.log('New cost entry created:', entry);
  };

  const handleInvoiceCreated = async (invoice) => {
    try {
      const newInvoice = await invoiceService.createInvoice(
        invoice.clientId,
        invoice.items,
        invoice.taxRate,
        invoice.discountAmount,
        invoice.dueDate
      );
      console.log('New invoice created:', newInvoice);
      setInvoiceId(newInvoice.id);
      setInvoices(invoiceService.getAllInvoices());
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleInvoiceUpdated = async (invoice) => {
    try {
      const updatedInvoice = await invoiceService.editInvoice(
        invoice.id,
        {
          clientId: invoice.clientId,
          items: invoice.items,
          taxRate: invoice.taxRate,
          discountAmount: invoice.discountAmount,
          dueDate: invoice.dueDate
        }
      );
      console.log('Invoice updated:', updatedInvoice);
      setSelectedInvoice(null);
      setInvoices(invoiceService.getAllInvoices());
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleInvoiceDeleted = async (invoiceId) => {
    try {
      await invoiceService.deleteInvoice(invoiceId);
      console.log('Invoice deleted:', invoiceId);
      setSelectedInvoice(null);
      setInvoiceId(null);
      setInvoices(invoiceService.getAllInvoices());
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleNotificationSent = (notification) => {
    console.log('Notification sent:', notification);
  };

  const handleCheckStatus = async () => {
    if (!invoiceId) return;

    try {
      const status = await invoiceService.getInvoiceStatus(invoiceId);
      console.log('Invoice status:', status);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  return (
    <div className="container">
      <h1 className="app-title">Cost Management System</h1>
      
      <section className="card">
        <h2>Cost Entry Management</h2>
        <CostEntrySDK onCostEntryCreated={handleCostEntryCreated} />
      </section>

      <section className="card">
        <h2>Invoice Management</h2>
        <InvoiceGenerationSDK 
          onInvoiceCreated={handleInvoiceCreated}
          onInvoiceUpdated={handleInvoiceUpdated}
          onInvoiceDeleted={handleInvoiceDeleted}
          selectedInvoice={selectedInvoice}
          setSelectedInvoice={setSelectedInvoice}
        />
      </section>

      <section className="card">
        <h2>Tax Calculator</h2>
        <TaxCalculator />
      </section>

      <section className="card">
        <h2>Invoice Reminders</h2>
        <InvoiceDueReminderSDK
          onNotificationSent={handleNotificationSent}
        />
      </section>

      {selectedInvoice && (
        <div className="invoice-info">
          <h2>Editing Invoice: {selectedInvoice}</h2>
        </div>
      )}

      {!selectedInvoice && invoiceId && (
        <div className="invoice-info">
          <h2>Current Invoice ID: {invoiceId}</h2>
          <button onClick={handleCheckStatus} className="btn-secondary">
            Check Status
          </button>
        </div>
      )}
    </div>
  );
}

export default App; 