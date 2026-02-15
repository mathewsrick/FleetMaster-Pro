import { prisma } from '../../shared/db';
export const findUserByUsername = async (username) => prisma.user.findUnique({ where: { username } });
export const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });
export const findUserByIdentifier = async (identifier) => prisma.user.findFirst({
    where: {
        OR: [
            { username: identifier },
            { email: identifier }
        ]
    }
});
export const findUserById = async (id) => prisma.user.findUnique({ where: { id } });
export const findUserByConfirmationToken = async (confirmationToken) => prisma.user.findFirst({ where: { confirmationToken } });
export const findUserByResetToken = async (resetToken) => prisma.user.findFirst({ where: { resetToken } });
export const createUser = async (data) => prisma.user.create({ data });
export const confirmUser = async (id) => prisma.user.update({
    where: { id },
    data: { isConfirmed: true }
});
export const setResetToken = async (id, resetToken) => prisma.user.update({
    where: { id },
    data: { resetToken }
});
export const updatePassword = async (id, password) => prisma.user.update({
    where: { id },
    data: { password }
});
export const updateLastActivity = async (id) => prisma.user.update({
    where: { id },
    data: { lastActivity: new Date() }
});
export const getActiveSubscription = async (userId) => prisma.subscriptionKey.findFirst({
    where: { userId, status: 'active' },
    orderBy: { dueDate: 'desc' }
});
export const getActiveLicenseOverride = async (userId) => {
    return prisma.licenseOverride.findFirst({
        where: {
            userId,
            OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
};
