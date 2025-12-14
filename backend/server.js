// server.js - Backend API مع MongoDB
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// اتصال MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://node1_db:node1_db@cluster0.aiysocq.mongodb.net/tasks_manager?retryWrites=true&w=majority&appName=Cluster0';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ متصل بـ MongoDB بنجاح'))
  .catch((err) => console.error('❌ خطأ في الاتصال:', err));

// Schema للمهام
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: String,
  deadline: { type: Date, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

// ==================== Routes ====================

// 1. جلب كل المهام
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'فشل في جلب المهام', details: error.message });
  }
});

// 2. إضافة مهمة جديدة
app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res
      .status(400)
      .json({ error: 'فشل في إضافة المهمة', details: error.message });
  }
});

// 3. تحديث مهمة
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ error: 'المهمة غير موجودة' });
    }
    res.json(task);
  } catch (error) {
    res
      .status(400)
      .json({ error: 'فشل في تحديث المهمة', details: error.message });
  }
});

// 4. حذف مهمة
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'المهمة غير موجودة' });
    }
    res.json({ message: 'تم حذف المهمة بنجاح' });
  } catch (error) {
    res
      .status(400)
      .json({ error: 'فشل في حذف المهمة', details: error.message });
  }
});

// 5. تبديل حالة الإنجاز
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'المهمة غير موجودة' });
    }
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) {
    res
      .status(400)
      .json({ error: 'فشل في تحديث الحالة', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'السيرفر يعمل بنجاح',
    mongodb: mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل',
  });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
  console.log(`📊 API متاح على http://localhost:${PORT}/api/tasks`);
});
