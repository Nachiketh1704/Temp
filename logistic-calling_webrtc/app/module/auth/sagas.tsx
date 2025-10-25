/**
 * Auth sagas
 * @format
 */

import { call, put, takeLatest } from "redux-saga/effects";

//Screens
import {
  changeAppSection,
  dismissLoader,
  presentLoader,
  setAuthToken,
  setRoles,
  setUser,
  setProfile,
} from "@app/module/common";
import { AppSection, Routes } from "@app/navigator";
import { forgotPassword, login, resetPassword, roles, signUp, verifyOTP, resendOTP } from "./slice";
import { showMessage } from "react-native-flash-message";
import { reconnectSocket } from "@app/service";
import { endPoints, httpRequest } from "@app/service";
import { AuthToken, NavigationService } from "@app/helpers";
import { profile } from "../profile/slice";

/**
 * Login action saga
 * @param {*} action - Login action with email and password
 */
function* loginSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, password } = action.payload;
    console.log(email, password, "login payload");
    console.log("Making request to:", endPoints.login);

    const response = yield call(httpRequest.post, endPoints.login, {
      email,
      password,
    });
    console.log("Login response:", response);

    if (response?.success && response?.token) {
      yield put(setAuthToken(response.token));
      yield put(
        setUser({
          id: response?.user?.id,
          username: response?.user?.userName,
          email: response?.user?.email,
        })
      );
      AuthToken.set(response.token);

      // Initialize socket connection after successful login
      reconnectSocket(response.token);

      // Check verification status
      if (response?.user?.isEmailVerified === false) {
        // Navigate to OTP screen for verification
        showMessage({
          message: "Verification Required",
          description: "Please verify your account with the OTP sent to your email",
          type: "info",
        });
        
        // Navigate to OTP screen with email parameter
        try {
          NavigationService.navigate(Routes.OTPScreen, {
            email: email,
            phone: email, // Using email as phone for demo
            purpose: 'email_verification',
            source: 'login'
          });
        } catch (navError) {
          console.error("Navigation error in login saga:", navError);
        }
      } else {
        // User is verified, navigate to main app
        showMessage({
          message: `Welcome back ${response?.user?.userName}!`,
          type: "success",
        });

        try {
          yield put(changeAppSection(AppSection.MainSection));
        } catch (sectionError) {
          console.error("Error changing app section:", sectionError);
        }
      }
    } else {
      showMessage({
        message: "Login failed. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    console.log(error, "erorrr login");
    showMessage({
      message: error?.message || "Login failed. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}
function* rolesSaga(): any {
  try {
    // yield put(presentLoader());

    const response = yield call(httpRequest.get, endPoints.roles);
    console.log("roles cat:", response);

    if (response?.success) {
      // yield put(setAuthToken(response.token));
      yield put(setRoles(response?.roleCategories));
      // AuthToken.set(response.token);

      // showMessage({
      //   message: `Welcome back ${response?.user?.userName}!`,
      //   type: "success",
      // });
    } else {
      showMessage({
        message: "Login failed. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    console.log(error, "erorrr login");
    showMessage({
      message: error?.message || "Login failed. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}
function* loginActionSaga({ payload }: any) {
  try {
    yield put(setUser({ email: payload.email }));
    yield put(changeAppSection(AppSection.MainSection));
  } catch (error) {}
}
function* signUpSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { userName, email, password, callbackUrl, companyName , companyTypeId ,phoneNumber, profileImage } = action.payload;

    const response = yield call(httpRequest.post, endPoints.signup, {
      email,
      password,
      userName,
      callbackUrl,
      companyName,
      companyTypeId,
      phoneNumber,
      profileImage
    });

    console.log("Signup response:", response);

    if (response?.success) {
      showMessage({
        message: response?.message || "Signup successful! Please verify your email.",
        type: "success",
      });
      
      // Navigate to OTP screen directly from saga
      try {
        NavigationService.navigate(Routes.OTPScreen, {
          email: email,
          purpose: 'email_verification',
          source: 'signup'
        });
      } catch (navError) {
        console.error("Navigation error in signup saga:", navError);
      }
    } else {
      const errorMessage = response?.message || "Something went wrong. Please try again.";
      showMessage({
        message: errorMessage,
        type: "danger",
      });
    }
  } catch (error: any) {
    console.log(error, "error signup");
    
    let errorMessage = "Signup failed. Please try again.";
    
    // Handle specific database constraint errors
    if (error?.response?.data?.message) {
      const dbMessage = error.response.data.message;
      if (dbMessage.includes("duplicate key value violates unique constraint")) {
        if (dbMessage.includes("users_username_unique")) {
          errorMessage = "Username already exists. Please choose a different username.";
        } else if (dbMessage.includes("users_email_unique")) {
          errorMessage = "Email already exists. Please use a different email or try logging in.";
        } else {
          errorMessage = "This information is already registered. Please use different details.";
        }
      } else {
        errorMessage = dbMessage;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });
    
    // Return error response to UI
    return { success: false, error: errorMessage };
  } finally {
    yield put(dismissLoader());
  }
}
/**
 * Verify OTP saga
 * @param {*} action - Verify OTP action with email and otp
 */
function* forgotPasswordSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email } = action.payload;

    const response = yield call(httpRequest.post, endPoints.forgotPassword, {
      email,
       callbackUrl: "https://www.google.com/"
    });
console.log(response,'forget response')
    showMessage({
      message: response?.message || "Reset link sent to your email",
      type: "success",
    });

    // Call the onSuccess callback to show OTP input
    action.payload.onSuccess?.();
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to send reset link. Please try again.";
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });

    // Call the onError callback
    action.payload.onError?.(error);
  } finally {
    yield put(dismissLoader());
  }
}
function* profileSaga(): any {
  try {
    const response = yield call(httpRequest.get, endPoints.profile, {});

    if (response) {
      console.log(response, "profile response");
      yield put(setProfile({ ...response?.data }));
    } else {
      showMessage({
        message: "Unable to fetch profile. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    showMessage({
      message: "Unable to fetch profile. Please try again.",

      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Verify OTP saga
 * @param {*} action - Verify OTP action with email, otp, and purpose
 */
function* verifyOTPSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, otp, purpose, source, onSuccess, onError } = action.payload;
    console.log("Verify OTP payload:", { email, otp, purpose, source });

    const response = yield call(httpRequest.post, endPoints.verifyOTP, {
      email,
      otp,
      purpose: purpose || "email_verification",
    });

    console.log("Verify OTP response:", response);

    if (response?.success) {
      // Handle different purposes
      if (purpose === "password_reset") {
        // For password reset, just show success message and call callback
        showMessage({
          message: "OTP Verified",
          description: "Your OTP has been verified successfully!",
          type: "success",
        });
        
        // Call the onSuccess callback with response data
        onSuccess?.(response);
      } else if (purpose === "email_verification") {
        if (source === "signup") {
          // For email verification during signup, don't auto-login
          showMessage({
            message: "Email Verified Successfully",
            description: "Your email has been verified. Please login to continue.",
            type: "success",
          });
          
          // Call the onSuccess callback to let the UI handle navigation
          onSuccess?.(response);
        } else {
          // For email verification during login, auto-login
          // Store auth token if provided
          if (response?.token) {
            yield put(setAuthToken(response.token));
          }

          // Store user data if provided
          if (response?.user) {
            yield put(setUser(response.user));
          } else {
            // Create a basic user object if not provided in response
            yield put(setUser({
              id: null,
              username: null,
              email: email,
            }));
          }

          showMessage({
            message: "Email Verified Successfully",
            description: "Your email has been verified. Welcome back!",
            type: "success",
          });

          // Navigate to home screen after setting user data
          yield put(changeAppSection(AppSection.MainSection));
        }
      } else {
        // For other purposes (like login flow)
        // Store auth token if provided
        if (response?.token) {
          yield put(setAuthToken(response.token));
        }

        // Store user data if provided
        if (response?.user) {
          yield put(setUser(response.user));
        } else {
          // Create a basic user object if not provided in response
          yield put(setUser({
            id: null,
            username: null,
            email: email,
          }));
        }

        showMessage({
          message: "OTP Verified",
          description: "Your account has been verified successfully!",
          type: "success",
        });

        // Navigate to home screen after setting user data
        yield put(changeAppSection(AppSection.MainSection));
      }
    } else {
      const errorMessage = response?.message || "Invalid OTP. Please try again.";
      showMessage({
        message: "Verification Failed",
        description: errorMessage,
        type: "danger",
      });
      
      // Call the onError callback
      onError?.({ message: errorMessage });
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred during verification";
    
    showMessage({
      message: "Verification Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call the onError callback
    action.payload.onError?.({ message: errorMessage });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Resend OTP saga
 * @param {*} action - Resend OTP action with email and purpose
 */
function* resendOTPSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, purpose } = action.payload;
    console.log("Resend OTP payload:", { email, purpose });

    const response = yield call(httpRequest.post, endPoints.resendOTP, {
      email,
      purpose: purpose || "email_verification",
    });

    console.log("Resend OTP response:", response);

    if (response?.success) {
      showMessage({
        message: "OTP Resent",
        description: "A new verification code has been sent to your email",
        type: "success",
      });
    } else {
      showMessage({
        message: "Resend Failed",
        description: response?.message || "Failed to resend OTP. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    showMessage({
      message: "Resend Error",
      description: error?.response?.data?.message || error?.message || "An error occurred while resending OTP",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

function* resetPasswordSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { token, newPassword, onSuccess, onError } = action.payload;
    console.log("Reset password payload:", { token, newPassword });

    const response = yield call(httpRequest.post, endPoints.resetPassword, {
      token,
      newPassword,
    });

    console.log("Reset password response:", response);

    if (response?.success) {
      showMessage({
        message: "Password Reset Successful",
        description: "Your password has been reset successfully!",
        type: "success",
      });
      onSuccess?.(response);
    } else {
      const errorMessage = response?.message || "Failed to reset password. Please try again.";
      showMessage({
        message: "Reset Failed",
        description: errorMessage,
        type: "danger",
      });
      onError?.({ message: errorMessage });
    }
  } catch (error: any) {
    console.error("Reset password error:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while resetting password";
    showMessage({
      message: "Reset Error",
      description: errorMessage,
      type: "danger",
    });
    action.payload.onError?.({ message: errorMessage });
  } finally {
    yield put(dismissLoader());
  }
}

function* authSagas() {
  yield takeLatest(login, loginSaga);
  yield takeLatest(signUp, signUpSaga);
  yield takeLatest(roles, rolesSaga);
  yield takeLatest(forgotPassword, forgotPasswordSaga);
  yield takeLatest(resetPassword, resetPasswordSaga);
  yield takeLatest(verifyOTP, verifyOTPSaga);
  yield takeLatest(resendOTP, resendOTPSaga);
  yield takeLatest(profile, profileSaga);
}

export { authSagas };
