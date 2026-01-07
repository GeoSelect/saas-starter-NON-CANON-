/**
 * AUDIT LOGGING INTEGRATION GUIDE
 * 
 * To track sign-in events in your /(login)/sign-in page, add this code:
 * 
 * 1. Import the logging function:
 *    import { logAuditEvent } from '@/lib/audit/client';
 * 
 * 2. Inside your sign-in handler, call:
 *    
 *    await logAuditEvent(
 *      userId,           // user.id or user_id from auth
 *      userName,         // user's display name
 *      userEmail,        // user's email
 *      userPlan,         // user's current plan from auth context
 *      'login',          // action type
 *      'success',        // success or failure
 *      errorMessage      // optional details if failure
 *    );
 * 
 * EXAMPLE IMPLEMENTATION:
 * 
 *    'use client';
 *    import { useAuth } from '@/lib/context/AuthContext';
 *    import { logAuditEvent } from '@/lib/audit/client';
 *    import { useState } from 'react';
 *    
 *    export default function SignIn() {
 *      const { login } = useAuth();
 *      const [error, setError] = useState('');
 *    
 *      async function handleSignIn(email: string, password: string) {
 *        try {
 *          const user = await login(email, password);
 *          
 *          // Log successful login
 *          await logAuditEvent(
 *            user.id,
 *            user.name,
 *            user.email,
 *            user.plan || 'browse',
 *            'login',
 *            'success'
 *          );
 *        } catch (err) {
 *          const errorMsg = err instanceof Error ? err.message : 'Login failed';
 *          setError(errorMsg);
 *          
 *          // Log failed login attempt
 *          await logAuditEvent(
 *            email,                    // or use extracted ID if available
 *            'Unknown',                // name unknown at failure point
 *            email,
 *            'browse',                 // default plan at login attempt
 *            'login',
 *            'failure',
 *            errorMsg
 *          );
 *        }
 *      }
 *    
 *      return (
 *        // ... rest of sign-in form
 *      );
 *    }
 * 
 * FOR SIGN-UP:
 *    - Use action 'signup' instead of 'login'
 *    - Call after user account is created but before redirect
 *    - Status will be 'success'
 * 
 * FOR PLAN CHANGES:
 *    - Use action 'plan_change'
 *    - Include old plan and new plan in details
 *    - Example:
 *      await logAuditEvent(
 *        userId,
 *        userName,
 *        userEmail,
 *        newPlan,
 *        'plan_change',
 *        'success',
 *        `Upgraded from ${oldPlan} to ${newPlan}`
 *      );
 * 
 * VIEWING AUDIT LOGS:
 *    - Navigate to /(dashboard)/audit
 *    - Shows all events with date, time, IP, user, plan, action, status
 *    - Summary cards show total events, successful logins, failed attempts
 */

// This file is for documentation only - no runtime code needed
export {};
