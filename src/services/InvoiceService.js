import { v4 as uuidv4 } from 'uuid';
import InvoiceDueReminderSDK from '../sdks/InvoiceDueReminderSDK';
import { TaxCalculationLib } from '../libs/TaxCalculationLib';

class InvoiceService {
    constructor() {
        this.reminderSDK = InvoiceDueReminderSDK;
        this.invoiceCache = new Map(); // Cache to store invoice objects
        this.taxLib = new TaxCalculationLib();
        this.lastInvoiceNumber = 0;
        
        // Try to load existing invoices from localStorage
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) {
            const invoices = new Map(JSON.parse(savedInvoices));
            invoices.forEach((invoice) => {
                this.invoiceCache.set(invoice.id, invoice);
            });
        }

        // Load last invoice number
        const savedLastNumber = localStorage.getItem('lastInvoiceNumber');
        if (savedLastNumber) {
            this.lastInvoiceNumber = parseInt(savedLastNumber);
        }
    }

    generateInvoiceNumber() {
        this.lastInvoiceNumber += 1;
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const day = new Date().getDate().toString().padStart(2, '0');
        const sequence = this.lastInvoiceNumber.toString().padStart(4, '0');
        localStorage.setItem('lastInvoiceNumber', this.lastInvoiceNumber.toString());
        return `INV-${year}${month}${day}-${sequence}`;
    }

    // Create a new invoice and set up reminders
    async createInvoice(clientId, items, tax, discounts, dueDate) {
        try {
            // Process items
            const processedItems = items.map(item => ({
                ...item,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                subtotal: item.quantity * item.unitPrice
            }));

            // Calculate totals
            const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
            const taxAmount = this.taxLib.calculateTax(subtotal - discounts, tax).taxAmount;

            // Generate the invoice
            const invoice = {
                id: uuidv4(),
                invoiceNumber: this.generateInvoiceNumber(),
                clientId,
                items: processedItems,
                subtotal,
                tax,
                taxAmount,
                discountAmount: parseFloat(discounts) || 0,
                total: subtotal + taxAmount - (parseFloat(discounts) || 0),
                dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Store in cache and localStorage
            this.invoiceCache.set(invoice.id, invoice);
            this.saveToLocalStorage();

            // Set up reminder if due date is provided
            if (dueDate) {
                await this.setupReminders(invoice.id, dueDate);
            }

            return invoice;
        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        }
    }

    // Edit an existing invoice and update reminders if needed
    async editInvoice(invoiceId, updates, newDueDate = null) {
        try {
            // Get existing invoice
            const existingInvoice = this.invoiceCache.get(invoiceId);
            if (!existingInvoice) {
                throw new Error('Invoice not found');
            }

            // Process updated items if they exist
            let processedItems = existingInvoice.items;
            if (updates.items) {
                processedItems = updates.items.map(item => ({
                    ...item,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    subtotal: item.quantity * item.unitPrice
                }));
            }

            // Recalculate totals if necessary
            const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
            const discountAmount = updates.discountAmount !== undefined ? 
                parseFloat(updates.discountAmount) : 
                existingInvoice.discountAmount;
            const tax = updates.tax !== undefined ? updates.tax : existingInvoice.tax;
            const taxAmount = this.taxLib.calculateTax(subtotal - discountAmount, tax).taxAmount;

            // Apply updates
            const updatedInvoice = {
                ...existingInvoice,
                ...updates,
                items: processedItems,
                subtotal,
                taxAmount,
                total: subtotal + taxAmount - discountAmount,
                updatedAt: new Date(),
                status: 'updated'
            };
            
            // Update cache and localStorage
            this.invoiceCache.set(invoiceId, updatedInvoice);
            this.saveToLocalStorage();

            // Update reminders if due date changed
            if (newDueDate) {
                await this.updateReminders(invoiceId, newDueDate);
            }

            return updatedInvoice;
        } catch (error) {
            console.error('Error editing invoice:', error);
            throw error;
        }
    }

    // Helper method to save to localStorage
    saveToLocalStorage() {
        const entriesArray = Array.from(this.invoiceCache.entries());
        localStorage.setItem('invoices', JSON.stringify(entriesArray));
    }

    // Get all invoices
    getAllInvoices() {
        return Array.from(this.invoiceCache.values());
    }

    // Get a specific invoice
    getInvoice(invoiceId) {
        return this.invoiceCache.get(invoiceId);
    }

    // Set up reminder schedule for an invoice
    async setupReminders(invoiceId, dueDate) {
        try {
            const invoice = this.invoiceCache.get(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Schedule reminders using the SDK's scheduleReminders method
            await this.reminderSDK.scheduleReminders({
                invoiceId,
                dueDate,
                reminderSchedule: [
                    { days: -7, type: 'email' },  // 7 days before
                    { days: -3, type: 'email' },  // 3 days before
                    { days: -1, type: 'sms' },    // 1 day before
                    { days: 0, type: 'both' },    // On due date
                    { days: 1, type: 'both' },    // 1 day after
                    { days: 7, type: 'both' }     // 1 week after
                ]
            });
        } catch (error) {
            console.error('Error setting up reminders:', error);
            throw error;
        }
    }

    // Update reminder schedule for an invoice
    async updateReminders(invoiceId, newDueDate) {
        try {
            // Cancel existing reminders using the SDK's cancelReminders method
            await this.reminderSDK.cancelReminders(invoiceId);
            
            // Set up new reminders
            await this.setupReminders(invoiceId, newDueDate);
        } catch (error) {
            console.error('Error updating reminders:', error);
            throw error;
        }
    }

    // Get invoice status including reminder history
    async getInvoiceStatus(invoiceId) {
        try {
            const invoice = this.invoiceCache.get(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const reminderHistory = await this.reminderSDK.getReminderHistory(invoiceId);
            
            return {
                invoice,
                reminderHistory,
                lastModified: invoice.updatedAt,
                status: invoice.status
            };
        } catch (error) {
            console.error('Error getting invoice status:', error);
            throw error;
        }
    }

    // Delete an invoice and its associated reminders
    async deleteInvoice(invoiceId) {
        try {
            const invoice = this.invoiceCache.get(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Cancel any existing reminders
            await this.reminderSDK.cancelReminders(invoiceId);

            // Remove from cache
            this.invoiceCache.delete(invoiceId);
            
            // Update localStorage
            this.saveToLocalStorage();

            return true;
        } catch (error) {
            console.error('Error deleting invoice:', error);
            throw error;
        }
    }
}

export default InvoiceService; 