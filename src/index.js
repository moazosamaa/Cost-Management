import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Render the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Export components
export { default as CostEntrySDK } from './sdks/CostEntrySDK';
export { default as InvoiceGenerationSDK } from './sdks/InvoiceGenerationSDK';
export { default as InvoiceDueReminderSDK } from './sdks/InvoiceDueReminderSDK';
export { default as TaxCalculationLib } from './libs/TaxCalculationLib';

// Export hooks
export { useCostEntrySDK } from './sdks/CostEntrySDK';
export { useInvoiceGenerationSDK } from './sdks/InvoiceGenerationSDK';
export { useInvoiceDueReminder } from './sdks/InvoiceDueReminderSDK'; 