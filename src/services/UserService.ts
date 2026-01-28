import { User, IUser, UserRole } from '../models/User';
import jwt from 'jsonwebtoken';
import { setupLogger } from '../config/logger';
import { AppError } from '../middleware/errorHandler';

const logger = setupLogger();

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export async function createUser(data: CreateUserDto): Promise<IUser> {
  try {
    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      $or: [{ username: data.username }, { email: data.email }]
    });

    if (existingUser) {
      throw new AppError('Username or email already exists', 400);
    }

    const user = new User({
      ...data,
      role: data.role || UserRole.VIEWER
    });

    await user.save();
    
    // 不返回密码
    user.password = undefined as any;
    return user;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    // 支持邮箱或用户名登录
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    }).select('+password');

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    );

    // 生成刷新令牌（有效期更长）
    const refreshToken = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role
      },
      jwtSecret,
      {
        expiresIn: '30d'
      }
    );

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Error logging in:', error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<IUser | null> {
  try {
    const user = await User.findById(id).select('-password');
    return user;
  } catch (error) {
    logger.error('Error getting user by id:', error);
    throw error;
  }
}

export async function getUsers(query: { 
  page: number; 
  limit: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}): Promise<{
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const { page, limit, search, role, isActive } = query;

    // 构建查询过滤条件
    const filter: any = {};

    // 搜索过滤：用户名或邮箱
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 角色过滤
    if (role) {
      filter.role = role;
    }

    // 状态过滤
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      users: users as IUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Error getting users:', error);
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<CreateUserDto>): Promise<IUser | null> {
  try {
    // 如果更新密码，需要重新加密
    if (data.password) {
      const user = await User.findById(id);
      if (user) {
        user.password = data.password;
        await user.save();
        user.password = undefined as any;
        return user;
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...data, password: undefined },
      { new: true, runValidators: true }
    ).select('-password');

    return user;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await User.findByIdAndDelete(id);
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
}

export async function refreshAuthToken(token: string): Promise<{ accessToken: string }> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    // 验证刷新令牌
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // 生成新的访问令牌
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    );

    return {
      accessToken: newToken
    };
  } catch (error) {
    logger.error('Error refreshing token:', error);
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
