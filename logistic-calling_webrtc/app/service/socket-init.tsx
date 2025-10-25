/**
 * Socket Initialization Service
 * @format
 */

import { socketService } from './socket-service';
import { store } from '@app/redux';
import { selectAuthToken, selectProfile } from '@app/module/common';
import { AuthToken } from '@app/helpers';

/**
 * Initialize socket connection when app starts
 */
export const initializeSocket = async() => {
    const token = await AuthToken.get();

  try {
    
  
    console.log('Initializing socket connection...');
    console.log('Auth token available:', token);
    
    if (token) {
        console.log("connect token", token);
      socketService.connect(token);
    } else {
      console.log('No auth token available, socket connection skipped');
    }
  } catch (error) {
    console.error('Error initializing socket:', error);
  }
};

/**
 * Reconnect socket when user logs in
 */
export const reconnectSocket = (token: string) => {
  try {
    console.log('Reconnecting socket with new token...');
    socketService.disconnect();
    socketService.connect(token);
  } catch (error) {
    console.error('Error reconnecting socket:', error);
  }
};

/**
 * Disconnect socket when user logs out
 */
export const disconnectSocket = () => {
  try {
    console.log('Disconnecting socket...');
    socketService.disconnect();
  } catch (error) {
    console.error('Error disconnecting socket:', error);
  }
};

/**
 * Get socket connection status
 */
export const getSocketStatus = () => {
  return socketService.isSocketConnected();
};
