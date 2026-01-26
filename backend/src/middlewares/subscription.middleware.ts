export const requireActiveSubscription: any = (req: any, res: any, next: any) => {
  if (req.user.accessLevel === 'FULL') return next();

  return res.status(403).json({
    error: 'Active subscription required'
  });
};