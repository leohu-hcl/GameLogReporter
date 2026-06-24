import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupLogger } from '../config/logger';
import { User, UserRole } from '../models/User';

dotenv.config();

const logger = setupLogger();

async function seedAdmin() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      logger.info(`Admin account already exists: ${existingAdmin.email}`);
      await mongoose.connection.close();
      return;
    }

    // 创建默认管理员账号
    const adminUser = new User({
      username: 'admin',
      email: 'admin@gamelog.com',
      password: 'Admin@123456', // 密码会被 bcrypt 加密
      role: UserRole.ADMIN,
      isActive: true
    });

    await adminUser.save();
    logger.info(`Admin account created successfully`);
    logger.info(`Email: ${adminUser.email}`);
    logger.info(`Password: Admin@123456`);
    logger.info(`Role: ${adminUser.role}`);

    // 创建测试用户
    const existingViewer = await User.findOne({ email: 'viewer@gamelog.com' });
    if (!existingViewer) {
      const viewerUser = new User({
        username: 'viewer',
        email: 'viewer@gamelog.com',
        password: 'Viewer@123456',
        role: UserRole.VIEWER,
        isActive: true
      });
      await viewerUser.save();
      logger.info(`Viewer account created successfully`);
      logger.info(`Email: ${viewerUser.email}`);
      logger.info(`Password: Viewer@123456`);
    }

    // 创建编辑用户
    const existingEditor = await User.findOne({ email: 'editor@gamelog.com' });
    if (!existingEditor) {
      const editorUser = new User({
        username: 'editor',
        email: 'editor@gamelog.com',
        password: 'Editor@123456',
        role: UserRole.EDITOR,
        isActive: true
      });
      await editorUser.save();
      logger.info(`Editor account created successfully`);
      logger.info(`Email: ${editorUser.email}`);
      logger.info(`Password: Editor@123456`);
    }

    logger.info('Database seeding completed');
    await mongoose.connection.close();
  } catch (error) {
    logger.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedAdmin();
