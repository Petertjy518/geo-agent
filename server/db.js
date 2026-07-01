// Simple JSON-file based database - no native dependencies
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'geo_reports.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory storage
let reports = [];
let tasks = {}; // taskId -> { status, progress, currentPlatform, results }

// Load from file on startup
try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    reports = JSON.parse(data);
  }
} catch (e) {
  console.log('No existing DB file, starting fresh');
}

// Save to file
function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(reports, null, 2));
  } catch (e) {
    console.error('Failed to save DB:', e.message);
  }
}

module.exports = {
  // Reports
  getReports: () => [...reports],
  getReport: (id) => reports.find(r => r.id === id),
  addReport: (report) => {
    reports.unshift(report);
    if (reports.length > 100) reports = reports.slice(0, 100);
    save();
    return report;
  },
  deleteReport: (id) => {
    reports = reports.filter(r => r.id !== id);
    save();
  },

  // Tasks (in-memory only, for SSE progress)
  createTask: (id, data) => {
    tasks[id] = { ...data, status: 'running', progress: 0, results: [] };
    return tasks[id];
  },
  getTask: (id) => tasks[id],
  updateTask: (id, updates) => {
    if (tasks[id]) {
      tasks[id] = { ...tasks[id], ...updates };
    }
  },
  deleteTask: (id) => {
    delete tasks[id];
  },

  // API Keys (stored in memory, not in DB file)
  apiKeys: {},
};
