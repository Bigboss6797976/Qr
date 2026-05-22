const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../../database');

class JSONDB {
  constructor(collection) {
    this.filePath = path.join(DB_DIR, `${collection}.json`);
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (e) {
      console.error(`Error loading ${this.collection}:`, e);
    }
    return [];
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  create(item) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newItem = { id, ...item, createdAt: new Date().toISOString() };
    this.data.push(newItem);
    this.save();
    return newItem;
  }

  findAll() {
    return this.data;
  }

  findById(id) {
    return this.data.find(item => item.id === id);
  }

  findOne(query) {
    return this.data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  find(query) {
    return this.data.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  update(id, updates) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data[index];
  }

  delete(id) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    this.save();
    return true;
  }
}

// 导出集合
module.exports = {
  merchants: new JSONDB('merchants'),
  orders: new JSONDB('orders'),
  sessions: new JSONDB('sessions'),
  refunds: new JSONDB('refunds')
};
