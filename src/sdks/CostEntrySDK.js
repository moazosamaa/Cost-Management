import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';

const CostEntrySDK = ({ onCostEntryCreated }) => {
  // Initialize state with entries from localStorage if they exist
  const [costEntries, setCostEntries] = useState(() => {
    const savedEntries = localStorage.getItem('costEntries');
    return savedEntries ? new Map(JSON.parse(savedEntries)) : new Map();
  });

  const [entry, setEntry] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Save entries to localStorage whenever they change
  useEffect(() => {
    const entriesArray = Array.from(costEntries.entries());
    localStorage.setItem('costEntries', JSON.stringify(entriesArray));
  }, [costEntries]);

  const createCostEntry = (category, amount, date, description) => {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const entry = {
      id: uuidv4(),
      category,
      amount,
      date,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCostEntries(prevEntries => {
      const newEntries = new Map(prevEntries);
      newEntries.set(entry.id, entry);
      return newEntries;
    });

    console.log('Created Cost Entry:', entry);

    if (onCostEntryCreated) {
      onCostEntryCreated(entry);
    }

    return entry;
  };

  const getCostEntry = (id) => {
    const entry = costEntries.get(id);
    console.log('Retrieved Cost Entry:', entry);
    return entry;
  };

  const updateCostEntry = (id, updates) => {
    const entry = costEntries.get(id);
    if (!entry) {
      throw new Error('Cost entry not found');
    }

    const updatedEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
    };

    setCostEntries(prevEntries => {
      const newEntries = new Map(prevEntries);
      newEntries.set(id, updatedEntry);
      return newEntries;
    });

    console.log('Updated Cost Entry:', updatedEntry);
    return updatedEntry;
  };

  const deleteCostEntry = (id) => {
    const entryToDelete = costEntries.get(id);
    console.log('Deleting Cost Entry:', entryToDelete);
    
    setCostEntries(prevEntries => {
      const newEntries = new Map(prevEntries);
      const deleted = newEntries.delete(id);
      return newEntries;
    });
  };

  const listCostEntries = () => {
    const entries = Array.from(costEntries.values());
    console.log('All Cost Entries:', entries);
    return entries;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const costRecord = {
      ...entry,
      amount: parseFloat(entry.amount),
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Submitting Cost Record:', costRecord);
    
    setCostEntries(prevEntries => {
      const newEntries = new Map(prevEntries);
      newEntries.set(costRecord.id, costRecord);
      return newEntries;
    });
    
    if (onCostEntryCreated) {
      onCostEntryCreated(costRecord);
    }
    
    // Reset form
    setEntry({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = (id) => {
    setCostEntries(prevEntries => {
      const newEntries = new Map(prevEntries);
      newEntries.delete(id);
      return newEntries;
    });
  };

  const entries = Array.from(costEntries.values());

  return (
    <div className="cost-entry-sdk">
      <h2>Cost Entry Management</h2>
      
      <form onSubmit={handleSubmit} className="cost-entry-form">
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <input
            type="text"
            id="category"
            name="category"
            value={entry.category}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="Enter category"
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={entry.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            className="form-control"
            placeholder="Enter amount"
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={entry.date}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={entry.description}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="Enter description"
          />
        </div>
        <button type="submit" className="btn btn-primary">Create Cost Entry</button>
      </form>

      <div className="cost-entries-list">
        <h3>Cost Entries</h3>
        {entries.length === 0 ? (
          <p className="no-entries">No cost entries yet. Add one above!</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="cost-entry-item">
              <div className="entry-header">
                <h4>{entry.category}</h4>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
              <div className="entry-details">
                <p><strong>Amount:</strong> ${entry.amount.toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
                <p><strong>Description:</strong> {entry.description}</p>
                <p className="entry-timestamp">Created: {new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

CostEntrySDK.propTypes = {
  onCostEntryCreated: PropTypes.func
};

export default CostEntrySDK;

// Export the methods for use in other components
export const useCostEntrySDK = (onCostEntryCreated) => {
  const [costEntries, setCostEntries] = useState(new Map());

  return {
    createCostEntry: (category, amount, date, description) => {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const entry = {
        id: uuidv4(),
        category,
        amount,
        date,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCostEntries(prevEntries => {
        const newEntries = new Map(prevEntries);
        newEntries.set(entry.id, entry);
        return newEntries;
      });

      if (onCostEntryCreated) {
        onCostEntryCreated(entry);
      }

      return entry;
    },
    getCostEntry: (id) => costEntries.get(id),
    updateCostEntry: (id, updates) => {
      const entry = costEntries.get(id);
      if (!entry) {
        throw new Error('Cost entry not found');
      }

      const updatedEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date(),
      };

      setCostEntries(prevEntries => {
        const newEntries = new Map(prevEntries);
        newEntries.set(id, updatedEntry);
        return newEntries;
      });

      return updatedEntry;
    },
    deleteCostEntry: (id) => {
      setCostEntries(prevEntries => {
        const newEntries = new Map(prevEntries);
        newEntries.delete(id);
        return newEntries;
      });
    },
    listCostEntries: () => Array.from(costEntries.values())
  };
}; 