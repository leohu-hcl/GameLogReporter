import { Request, Response, NextFunction } from 'express';
import { DeviceService } from '../services/DeviceService';
import { AppError } from '../middleware/errorHandler';

/**
 * 获取所有设备列表
 */
export async function getAllDevices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10, platform, isActive } = req.query;

    const filters = {
      platform: platform ? (platform as string) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
    };

    const result = await DeviceService.getAllDevices(
      parseInt(page as string),
      parseInt(limit as string),
      filters
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取单个设备详情及其会话
 */
export async function getDeviceWithSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const result = await DeviceService.getDeviceWithSessions(
      deviceId as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取设备统计信息
 */
export async function getDeviceStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const result = await DeviceService.getDeviceStats(deviceId as string);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取所有设备统计摘要
 */
export async function getDevicesSummary(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await DeviceService.getDevicesSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新设备信息
 */
export async function updateDevice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;
    const updateData = req.body;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const device = await DeviceService.updateDevice(deviceId, updateData);

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除设备及其所有数据
 */
export async function deleteDevice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const result = await DeviceService.deleteDevice(deviceId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取设备列表（用于下拉框）
 */
export async function getDeviceList(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const devices = await DeviceService.getDeviceList();

    res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    next(error);
  }
}
