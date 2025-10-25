/**
 * Drivers sagas
 * @format
 */

import { put, takeLatest, call } from 'redux-saga/effects';
import { endPoints, httpRequest, socketService } from '@app/service';
import { showMessage } from 'react-native-flash-message';
import { presentLoader, dismissLoader, setDrivers, setCarriers } from '@app/module/common';
import { fetchDrivers, inviteDriver, assignDriver, assignCarrier, changeDriver, removeDriver, fetchCarriers } from './slice';
import { NavigationService } from '@app/helpers/navigation-service';

/**
 * Fetch drivers saga
 */
function* fetchDriversSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { page = 1, limit = 10 } = action.payload || {};
    
    console.log('fetchDriversSaga - fetching drivers with params:', { page, limit });
    
    const response = yield call(
      httpRequest.get, 
      `${endPoints.getDrivers}&page=${page}&limit=${limit}`
    );
    
    console.log('fetchDriversSaga - API response:', response);
    console.log('fetchDriversSaga - response.success:', response?.success);
    console.log('fetchDriversSaga - response.users:', response?.users);
    console.log('fetchDriversSaga - response.data:', response?.data);
    
    if (response?.success && response?.users) {
      // Transform API response to match our Driver interface
      const drivers = response.users.map((driver: any) => ({
        id: driver.id?.toString() || driver._id?.toString(),
        name: driver.userName || driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
        rating: driver.rating || 0.0, // Default rating if not provided
        jobsCompleted: driver.jobsCompleted || driver.completedJobs || 0,
        vehicleType: driver.vehicleType || driver.truckType || 'Truck Info.',
        isAvailable: driver.isAvailable !== false, // Default to true if not specified
        location: driver.location || driver.address || 'Location not specified',
        profileImage: driver.profileImage || driver.avatar,
        phone: driver.phone,
        email: driver.email,
      }));
      
      yield put(setDrivers(drivers));
      
    } else {
      const errorMessage = response?.message || "Failed to fetch drivers";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('fetchDriversSaga - Error:', error);
    showMessage({
      message: "Error",
      description: "Failed to fetch drivers. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}
function* fetchCarriersSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { page = 1, limit = 10 } = action.payload || {};
    
    console.log('fetchDriversSaga - fetching drivers with params:', { page, limit });
    
    const response = yield call(
      httpRequest.get, 
      `${endPoints.getCarriers}&page=${page}&limit=${limit}`
    );
    
    console.log('fetchDriversSaga - API response:', response);
    console.log('fetchDriversSaga - response.success:', response?.success);
    console.log('fetchDriversSaga - response.users:', response?.users);
    console.log('fetchDriversSaga - response.data:', response?.data);
    
    if (response?.success && response?.users) {
      // Transform API response to match our Driver interface
      const carriers = response.users.map((carrier: any) => ({
        id: carrier.id?.toString() || carrier._id?.toString(),
        name: carrier.userName || carrier.name || `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim(),
        rating: carrier.rating || 0.0, // Default rating if not provided
        jobsCompleted: carrier.jobsCompleted || carrier.completedJobs || 0,
        vehicleType: carrier.vehicleType || carrier.truckType || 'Truck Info.',
        isAvailable: carrier.isAvailable !== false, // Default to true if not specified
        location: carrier.location || carrier.address || 'Location not specified',
        profileImage: carrier.profileImage || carrier.avatar,
        phone: carrier.phone,
        email: carrier.email,
      }));
      
      yield put(setCarriers(carriers));
      
    } else {
      const errorMessage = response?.message || "Failed to fetch drivers";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('fetchDriversSaga - Error:', error);
    showMessage({
      message: "Error",
      description: "Failed to fetch drivers. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Invite driver saga
 */
function* inviteDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { driverId, jobId } = action.payload;
    
    console.log('inviteDriverSaga - inviting driver:', { driverId, jobId });
    
    // Note: This endpoint needs to be implemented in the backend
    const response = yield call(
      httpRequest.post, 
      '/driver/invite',
      { driverId, jobId }
    );
    
    if (response?.success) {
      showMessage({
        message: "Invitation Sent",
        description: "Driver invitation has been sent successfully!",
        type: "success",
      });
    } else {
      const errorMessage = response?.message || "Failed to send invitation";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('inviteDriverSaga - Error:', error);
    showMessage({
      message: "Error",
      description: "Failed to send invitation. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Assign driver saga
 */
function* assignDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { driverId, jobId, contractId, driverName } = action.payload;
    
    console.log('assignDriverSaga - assigning driver:', { driverId, jobId, contractId, driverName });
    
    // Use contractId if provided, otherwise use jobId as contractId
    const actualContractId = contractId ;
    console.log('assignDriverSaga - actualContractId:', actualContractId);
    // Call the correct API endpoint
    const response = yield call(
      httpRequest.post, 
      `/contract/${actualContractId}/participants/driver`,
      {
        driverUserId: parseInt(driverId)
      }
    );
    
    console.log('assignDriverSaga - API response:', response);
    
    if (response?.success) {
      // Also emit socket event for real-time updates
      const socketSuccess = socketService.assignJob(jobId, driverId);
      console.log('assignDriverSaga - Socket event emitted:', socketSuccess);
      
      showMessage({
        message: "Driver Assigned",
        description: `${driverName || 'Driver'} has been assigned successfully!`,
        type: "success",
      });
      
      // Call success callback if provided
      if (action.payload.onSuccess) {
        action.payload.onSuccess(response);
      }
      
      // Navigate back after successful assignment
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to assign driver";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (action.payload.onError) {
        action.payload.onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('assignDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to assign driver. Please try again.";
    
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Assign carrier saga
 */
function* assignCarrierSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { carrierUserId, contractId, onSuccess, onError } = action.payload;
    
    console.log('assignCarrierSaga - assigning carrier:', { carrierUserId, contractId });
    
    const response = yield call(
      httpRequest.post, 
      `/contract/${contractId}/participants/carrier`,
      {
        carrierUserId: parseInt(carrierUserId)
      }
    );
    
    console.log('assignCarrierSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Carrier Assigned",
        description: "Carrier has been assigned successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful assignment
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to assign carrier";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('assignCarrierSaga - Error:', error);
    const errorMessage = error?.message || "Failed to assign carrier. Please try again.";
    
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Change driver saga
 */
function* changeDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, currentDriverUserId, newDriverUserId, reason, onSuccess, onError } = action.payload;
    
    console.log('changeDriverSaga - changing driver:', { contractId, currentDriverUserId, newDriverUserId, reason });
    
    const response = yield call(
      httpRequest.post, 
      endPoints.changeDriver(parseInt(contractId)),
      {
        currentDriverUserId: parseInt(currentDriverUserId),
        newDriverUserId: parseInt(newDriverUserId),
        reason: reason
      }
    );
    
    console.log('changeDriverSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Driver Changed",
        description: "Driver has been changed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful change
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to change driver";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('changeDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to change driver. Please try again.";
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Remove driver saga
 */
function* removeDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, driverId, reason, onSuccess, onError } = action.payload;
    
    console.log('removeDriverSaga - removing driver:', { contractId, driverId, reason });
    
    const response = yield call(
      httpRequest.delete, 
      endPoints.removeDriver(parseInt(contractId), parseInt(driverId)),
      { data: { reason: reason } }
    );
    
    console.log('removeDriverSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Driver Removed",
        description: "Driver has been removed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful removal
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to remove driver";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('removeDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to remove driver. Please try again.";
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Root drivers saga
 */
function* driversSagas() {
  yield takeLatest(fetchDrivers, fetchDriversSaga);
  yield takeLatest(fetchCarriers, fetchCarriersSaga);
  yield takeLatest(inviteDriver, inviteDriverSaga);
  yield takeLatest(assignDriver, assignDriverSaga);
  yield takeLatest(assignCarrier, assignCarrierSaga);
  yield takeLatest(changeDriver, changeDriverSaga);
  yield takeLatest(removeDriver, removeDriverSaga);
}

export { driversSagas };
