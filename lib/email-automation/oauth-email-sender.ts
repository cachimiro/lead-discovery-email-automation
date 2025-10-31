/**
 * OAuth-based Email Sender
 * 
 * Sends emails directly from the authenticated user's Gmail or Microsoft account
 * using their OAuth tokens. No SendGrid or manual verification required.
 */

import { supabaseAdmin } from '@/lib/supabase';

interface EmailToSend {
  id: string;
  user_id: string;
  campaign_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_for: string;
  retry_count: number;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

/**
 * Get user's OAuth tokens from NextAuth session
 */
async function getUserOAuthTokens(userId: string): Promise<{
  provider: 'google' | 'microsoft';
  accessToken: string;
  refreshToken?: string;
  email: string;
} | null> {
  const supabase = supabaseAdmin();
  
  // Get user profile to find their email
  const { data: profile } = await supabase
    .from('cold_outreach_user_profiles')
    .select('email')
    .eq('id', userId)
    .single();
  
  if (!profile?.email) {
    return null;
  }
  
  // In NextAuth, tokens are stored in the JWT
  // We need to store them in our database for server-side access
  const { data: tokens } = await supabase
    .from('cold_outreach_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!tokens) {
    return null;
  }
  
  return {
    provider: tokens.provider,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    email: profile.email
  };
}

/**
 * Send email via Gmail API
 */
async function sendViaGmail(
  accessToken: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<SendResult> {
  try {
    // Create RFC 2822 formatted email
    const email = [
      `From: ${fromEmail}`,
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].join('\r\n');
    
    // Base64url encode the email
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      messageId: result.id
    };
    
  } catch (error: any) {
    console.error('Gmail send error:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Send email via Microsoft Graph API
 */
async function sendViaMicrosoft(
  accessToken: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<SendResult> {
  try {
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlBody
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail
            }
          }
        ],
        from: {
          emailAddress: {
            address: fromEmail
          }
        }
      },
      saveToSentItems: true
    };
    
    // Send via Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph API error: ${error}`);
    }
    
    // Microsoft Graph doesn't return message ID on send
    // We can use the timestamp as a unique identifier
    const messageId = `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      messageId: messageId
    };
    
  } catch (error: any) {
    console.error('Microsoft send error:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Refresh OAuth token if expired
 */
async function refreshOAuthToken(
  userId: string,
  provider: 'google' | 'microsoft',
  refreshToken: string
): Promise<string | null> {
  try {
    let tokenEndpoint: string;
    let clientId: string;
    let clientSecret: string;
    
    if (provider === 'google') {
      tokenEndpoint = 'https://oauth2.googleapis.com/token';
      clientId = process.env.GOOGLE_CLIENT_ID!;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    } else {
      tokenEndpoint = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
      clientId = process.env.MICROSOFT_CLIENT_ID!;
      clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
    }
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    const newAccessToken = data.access_token;
    
    // Update token in database
    const supabase = supabaseAdmin();
    await supabase
      .from('cold_outreach_oauth_tokens')
      .update({
        access_token: newAccessToken,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    return newAccessToken;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Send email using OAuth (main function)
 */
export async function sendEmailViaOAuth(email: EmailToSend): Promise<SendResult> {
  try {
    // Get user's OAuth tokens
    const tokens = await getUserOAuthTokens(email.user_id);
    
    if (!tokens) {
      throw new Error('No OAuth tokens found for user. User must re-authenticate.');
    }
    
    let accessToken = tokens.accessToken;
    
    // Try to send email
    let result: SendResult;
    
    if (tokens.provider === 'google') {
      result = await sendViaGmail(
        accessToken,
        tokens.email,
        email.recipient_email,
        email.subject,
        email.body
      );
    } else {
      result = await sendViaMicrosoft(
        accessToken,
        tokens.email,
        email.recipient_email,
        email.subject,
        email.body
      );
    }
    
    // If failed due to token expiration, try to refresh and retry
    if (!result.success && tokens.refreshToken) {
      console.log('Token may be expired, attempting refresh...');
      
      const newAccessToken = await refreshOAuthToken(
        email.user_id,
        tokens.provider,
        tokens.refreshToken
      );
      
      if (newAccessToken) {
        // Retry with new token
        if (tokens.provider === 'google') {
          result = await sendViaGmail(
            newAccessToken,
            tokens.email,
            email.recipient_email,
            email.subject,
            email.body
          );
        } else {
          result = await sendViaMicrosoft(
            newAccessToken,
            tokens.email,
            email.recipient_email,
            email.subject,
            email.body
          );
        }
      }
    }
    
    return result;
    
  } catch (error: any) {
    console.error('OAuth email send error:', error);
    return {
      success: false,
      error: error
    };
  }
}
