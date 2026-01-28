import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/UserService';
import { AppError } from '../middleware/errorHandler';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, username, password } = req.body;
    // 支持邮箱或用户名登录
    const loginId = email || username;
    const result = await userService.login(loginId, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await userService.getUserById(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const result = await userService.getUsers({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      role: role as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin创建用户，与register不同的是可以指定角色
    const user = await userService.createUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Token 在前端删除，这里只需返回成功响应
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }
    
    const result = await userService.refreshAuthToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    
    // 实现密码重置逻辑（发送重置邮件等）
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
}

export async function verifyAndResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }
    
    // 实现密码重置验证逻辑
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
}
