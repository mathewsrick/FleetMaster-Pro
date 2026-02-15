export const requireActiveSubscription = (req, res, next) => {
    if (req.user.accessLevel === 'FULL') {
        return next();
    }
    if (req.user.accessLevel === 'LIMITED') {
        return next(); // trial válido
    }
    return res.status(403).json({
        error: 'Active subscription required',
    });
};
