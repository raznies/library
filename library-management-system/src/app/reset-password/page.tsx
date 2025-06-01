'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Supabase sends the access_token in the URL fragment, not as a query parameter.
    // We need to parse it from the fragment.
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isSessionSet, setIsSessionSet] = useState(false); // New state to track if session is set

    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const tokenFromUrl = params.get('access_token');
        const refreshTokenFromUrl = params.get('refresh_token'); // Supabase might also send a refresh token

        if (tokenFromUrl) {
            setAccessToken(tokenFromUrl);
            // Attempt to set the session with the token
            // Supabase typically uses onAuthStateChange to handle this when it detects tokens in the URL
            // but we can be more explicit if needed, or ensure our AuthContext handles this.
            // For now, let's assume onAuthStateChange in AuthContext or Supabase client handles it.
            // If direct session setting is needed, it would look like:
            // supabase.auth.setSession({ access_token: tokenFromUrl, refresh_token: refreshTokenFromUrl || '' })
            //  .then(({ data, error }) => {
            //    if (error) {
            //      console.error('Error setting session with token:', error);
            //      setError('Failed to verify reset link. It might be invalid or expired.');
            //    } else {
            //      console.log('Session set successfully from token');
            //      setIsSessionSet(true); // Indicate session is ready
            //    }
            //  });
            // For simplicity and relying on Supabase client's default behavior with URL fragments:
            setIsSessionSet(true); // Assume Supabase client handles session from URL fragment
        } else {
            console.warn('Access token not found in URL fragment.');
            setError('Invalid or expired password reset link. Please request a new one.');
        }
    }, []);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // Ensure the session is expected to be set by Supabase client from the URL fragment
        // No explicit accessToken is passed to updateUser as the client should have an active session
        // if the token in the URL was valid and processed by onAuthStateChange.
        setIsLoading(true);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error getting user or no user in session:', userError);
            setError('Could not verify your session. The reset link may be invalid or expired. Please try again.');
            setIsLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        }/*, { accessToken: accessToken } // The JS SDK might handle the token automatically if it's set by onAuthStateChange from the fragment */)
        // Note: Supabase client JS v2 automatically handles the access token from the URL fragment 
        // if the user lands on this page after clicking the reset link.
        // If you are using an older version or have specific needs, you might need to manage the session differently.

        if (updateError) {
            console.error('Password update error:', updateError)
            setError(updateError.message || 'Failed to update password. The link may have expired or been used already.')
        } else {
            setMessage('Your password has been updated successfully! You can now sign in with your new password.')
            // Optionally redirect to login after a delay
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        }
        setIsLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!accessToken && !error && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            <p>Verifying link...</p>
                        </div>
                    )}
                    {(accessToken || error) && (
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading || !isSessionSet} // Disable if session not set
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading || !isSessionSet} // Disable if session not set
                                    required
                                    className="w-full"
                                />
                            </div>
                            
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {message && (
                                <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !isSessionSet || !!message} // Disable if loading, session not set, or success message shown
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
