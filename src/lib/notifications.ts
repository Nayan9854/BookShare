// src/lib/notifications.ts
import { prisma } from './prisma';
import { NotificationType } from '../types';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: number;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
  return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Notify when a borrow request is created
 */
export async function notifyBorrowRequest(ownerId: number, borrowerName: string, bookTitle: string, requestId: number) {
  return createNotification({
    userId: ownerId,
    type: 'BORROW_REQUEST',
    title: 'New Borrow Request',
    message: `${borrowerName} wants to borrow "${bookTitle}"`,
    relatedId: requestId
  });
}

/**
 * Notify when a borrow request is accepted
 */
export async function notifyRequestAccepted(borrowerId: number, bookTitle: string, requestId: number) {
  return createNotification({
    userId: borrowerId,
    type: 'REQUEST_ACCEPTED',
    title: 'Request Accepted!',
    message: `Your request to borrow "${bookTitle}" has been accepted`,
    relatedId: requestId
  });
}

/**
 * Notify when a borrow request is rejected
 */
export async function notifyRequestRejected(borrowerId: number, bookTitle: string, requestId: number) {
  return createNotification({
    userId: borrowerId,
    type: 'REQUEST_REJECTED',
    title: 'Request Rejected',
    message: `Your request to borrow "${bookTitle}" has been rejected`,
    relatedId: requestId
  });
}

/**
 * Notify when a book is returned
 */
export async function notifyBookReturned(borrowerId: number, bookTitle: string, requestId: number) {
  return createNotification({
    userId: borrowerId,
    type: 'BOOK_RETURNED',
    title: 'Book Return Confirmed',
    message: `Your return of "${bookTitle}" has been confirmed`,
    relatedId: requestId
  });
}

/**
 * Notify when a delivery is assigned
 */
export async function notifyDeliveryAssigned(userId: number, agentName: string, deliveryId: number) {
  return createNotification({
    userId,
    type: 'DELIVERY_ASSIGNED',
    title: 'Delivery Agent Assigned',
    message: `${agentName} has been assigned to deliver your book`,
    relatedId: deliveryId
  });
}

/**
 * Notify when a book is picked up
 */
export async function notifyDeliveryPickedUp(userId: number, bookTitle: string, deliveryId: number) {
  return createNotification({
    userId,
    type: 'DELIVERY_PICKED_UP',
    title: 'Book Picked Up',
    message: `"${bookTitle}" has been picked up and is on its way`,
    relatedId: deliveryId
  });
}

/**
 * Notify when a book is delivered
 */
export async function notifyDeliveryCompleted(userId: number, bookTitle: string, deliveryId: number) {
  return createNotification({
    userId,
    type: 'DELIVERY_DELIVERED',
    title: 'Book Delivered',
    message: `"${bookTitle}" has been delivered successfully`,
    relatedId: deliveryId
  });
}

/**
 * Notify when a new review is added
 */
export async function notifyNewReview(bookOwnerId: number, reviewerName: string, bookTitle: string, rating: number, reviewId: number) {
  return createNotification({
    userId: bookOwnerId,
    type: 'NEW_REVIEW',
    title: 'New Review',
    message: `${reviewerName} left a ${rating}-star review on "${bookTitle}"`,
    relatedId: reviewId
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: number): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}