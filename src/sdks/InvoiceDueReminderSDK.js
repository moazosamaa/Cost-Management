import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InvoiceDueReminderSDK = ({ onNotificationSent }) => {
  const [notifications, setNotifications] = useState(new Map());

  const generateReminderMessage = (invoice) => {
    return `Payment reminder for invoice ${invoice.invoiceNumber}. Amount due: $${invoice.total}. Due date: ${invoice.dueDate.toLocaleDateString()}`;
  };

  const mockSendNotification = (type, invoice, recipient) => {
    const subject = `Invoice ${invoice.invoiceNumber} - Payment Reminder`;
    const message = generateReminderMessage(invoice);

    // Simulate sending notification
    const notification = {
      id: Date.now().toString(),
      type,
      recipientId: invoice.clientId,
      recipient,
      subject,
      message,
      status: 'sent',
      sentAt: new Date(),
      invoice: invoice.invoiceNumber
    };

    setNotifications(prev => {
      const newNotifications = new Map(prev);
      newNotifications.set(notification.id, notification);
      return newNotifications;
    });

    if (onNotificationSent) {
      onNotificationSent(notification);
    }

    return notification;
  };

  const sendEmailReminder = (invoice, recipientEmail) => {
    return mockSendNotification('email', invoice, recipientEmail);
  };

  const sendSMSReminder = (invoice, phoneNumber) => {
    return mockSendNotification('sms', invoice, phoneNumber);
  };

  const sendInAppNotification = (invoice) => {
    return mockSendNotification('in-app', invoice, invoice.clientId);
  };

  const getNotificationHistory = (invoiceId) => {
    return Array.from(notifications.values()).filter(
      notification => notification.invoice === invoiceId
    );
  };

  return (
    <div className="invoice-reminder-sdk">
      <h2>Invoice Reminders</h2>
      <div className="notifications-list">
        {Array.from(notifications.values()).map((notification) => (
          <div key={notification.id} className="notification-item">
            <h3>Notification for Invoice: {notification.invoice}</h3>
            <p>Type: {notification.type}</p>
            <p>Status: {notification.status}</p>
            <p>Subject: {notification.subject}</p>
            <p>Sent to: {notification.recipient}</p>
            <p>Sent at: {notification.sentAt.toLocaleString()}</p>
            <p>Message: {notification.message}</p>
          </div>
        ))}
      </div>
      <div className="reminder-actions">
        <h3>Send New Reminder</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const invoice = {
            invoiceNumber: formData.get('invoiceNumber'),
            total: parseFloat(formData.get('amount')),
            dueDate: new Date(formData.get('dueDate')),
            clientId: formData.get('clientId')
          };
          
          switch(formData.get('notificationType')) {
            case 'email':
              sendEmailReminder(invoice, formData.get('recipient'));
              break;
            case 'sms':
              sendSMSReminder(invoice, formData.get('recipient'));
              break;
            case 'in-app':
              sendInAppNotification(invoice);
              break;
          }
          e.target.reset();
        }}>
          <div>
            <label>Invoice Number:</label>
            <input type="text" name="invoiceNumber" required />
          </div>
          <div>
            <label>Amount:</label>
            <input type="number" name="amount" step="0.01" required />
          </div>
          <div>
            <label>Due Date:</label>
            <input type="date" name="dueDate" required />
          </div>
          <div>
            <label>Client ID:</label>
            <input type="text" name="clientId" required />
          </div>
          <div>
            <label>Notification Type:</label>
            <select name="notificationType" required>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="in-app">In-App</option>
            </select>
          </div>
          <div>
            <label>Recipient (Email/Phone):</label>
            <input type="text" name="recipient" />
          </div>
          <button type="submit">Send Reminder</button>
        </form>
      </div>
    </div>
  );
};

InvoiceDueReminderSDK.propTypes = {
  onNotificationSent: PropTypes.func
};

export default InvoiceDueReminderSDK;

// Export the hook for use in other components
export const useInvoiceDueReminder = (onNotificationSent) => {
  const [notifications, setNotifications] = useState(new Map());

  const mockSendNotification = (type, invoice, recipient) => {
    const subject = `Invoice ${invoice.invoiceNumber} - Payment Reminder`;
    const message = `Payment reminder for invoice ${invoice.invoiceNumber}. Amount due: $${invoice.total}. Due date: ${invoice.dueDate.toLocaleDateString()}`;

    const notification = {
      id: Date.now().toString(),
      type,
      recipientId: invoice.clientId,
      recipient,
      subject,
      message,
      status: 'sent',
      sentAt: new Date(),
      invoice: invoice.invoiceNumber
    };

    setNotifications(prev => {
      const newNotifications = new Map(prev);
      newNotifications.set(notification.id, notification);
      return newNotifications;
    });

    if (onNotificationSent) {
      onNotificationSent(notification);
    }

    return notification;
  };

  return {
    sendEmailReminder: (invoice, recipientEmail) => 
      mockSendNotification('email', invoice, recipientEmail),
    sendSMSReminder: (invoice, phoneNumber) => 
      mockSendNotification('sms', invoice, phoneNumber),
    sendInAppNotification: (invoice) => 
      mockSendNotification('in-app', invoice, invoice.clientId),
    getNotificationHistory: (invoiceId) => 
      Array.from(notifications.values()).filter(
        notification => notification.invoice === invoiceId
      ),
    getAllNotifications: () => Array.from(notifications.values())
  };
}; 