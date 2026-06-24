import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as alertService from '../services/AlertService';
import { AppError } from '../middleware/errorHandler';

export async function getAlertRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rules = await alertService.getAlertRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
}

export async function createAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await alertService.createAlertRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function getAlertRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await alertService.getAlertRuleById(id);
    
    if (!rule) {
      throw new AppError('Alert rule not found', 404);
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function updateAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await alertService.updateAlertRule(id, req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function deleteAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await alertService.deleteAlertRule(id);
    res.json({ success: true, message: 'Alert rule deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAlertHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 50, startTime, endTime } = req.query;
    const result = await alertService.getAlertHistory({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      startTime: startTime as string,
      endTime: endTime as string
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
