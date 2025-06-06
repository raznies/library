'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'

type AuthContextType = {
    user: User | null
    userRole: string | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', userId)
                .single();
            
            if (error) {
                console.error('Error fetching user role:', error);
                setUserRole('user'); // Default to user role if error
            } else {
                setUserRole((data as any)?.role || 'user');
            }
        } catch (error) {
            console.error('Exception fetching user role:', error);
            setUserRole('user'); // Default to user role if exception
        }
    };

    const syncUserProfile = async (currentUser: User) => {
        try {
            // First check if user exists by user_id
            const { data: existingUserById, error: checkIdError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle()

            if (checkIdError) {
                console.error('Error checking user by ID:', checkIdError)
                throw checkIdError;
            }

            if (existingUserById) {
                setUserRole((existingUserById as any).role || 'user');
                return; // User profile already exists and is synced by ID
            }

            // If user doesn't exist by ID, check if email is already in use by another user
            if (currentUser.email) {
                const { data: existingUserByEmailData, error: checkEmailError } = await supabase
                    .from('users')
                    .select('user_id, email, role')
                    .eq('email', currentUser.email)
                    .maybeSingle()

                if (checkEmailError) {
                    console.error('Error checking user by email:', checkEmailError)
                    throw checkEmailError;
                }

                if (existingUserByEmailData && typeof existingUserByEmailData === 'object' && 'user_id' in existingUserByEmailData) {
                    const profileData = existingUserByEmailData as { user_id: string; email: string; role: string; };

                    if (profileData.user_id === currentUser.id) {
                        // This case should ideally be caught by the existingUserById check earlier,
                        // but if reached, it means the profile matches the current auth user.
                        setUserRole(profileData.role || 'user');
                        console.log(`User profile for ${currentUser.email} (ID: ${currentUser.id}) confirmed by email check.`);
                    } else {
                        // Email conflict: email is associated with a different user_id in your public 'users' table.
                        // This is a critical data integrity issue.
                        console.error(
                            `CRITICAL DATA CONFLICT: Authenticated user (ID: ${currentUser.id}, Email: ${currentUser.email}) ` +
                            `has an email that is already associated with a different user profile (ID: ${profileData.user_id}) ` +
                            `in the public 'users' table. Using role ('${profileData.role || 'user'}') from existing public profile. ` +
                            `This conflict needs manual investigation and resolution in the database.`
                        );
                        // Allow user to proceed but with the role from the existing public profile.
                        setUserRole(profileData.role || 'user');
                    }
                    return; // Profile handling (matched or conflicted and logged) is done.
                }
            }

            // If user doesn't exist by ID and email is not taken by another user (or the conflict was handled), create new user record
            const { error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        user_id: currentUser.id,
                        email: currentUser.email,
                        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'user',
                        full_name: currentUser.user_metadata?.full_name || 'Unknown',
                        // password_hash: 'PLACEHOLDER', // Avoid storing placeholder passwords if not necessary
                        membership_type: 'regular',
                        role: 'user', // Default role for new users
                    }
                ])
                .select()
                .single()

            if (insertError) {
                console.error('Error creating user profile:', insertError)
                // Check if the error is specifically the unique constraint violation for email
                if (insertError.message.includes('users_email_key')) {
                    // This means our earlier check somehow missed an existing email.
                    // This could happen due to race conditions or if the email check was bypassed.
                    console.error("Duplicate email error during insert, even after pre-check. Email:", currentUser.email);
                    throw new Error(`Failed to create user profile: Email ${currentUser.email} already exists.`);
                }
                throw new Error('Failed to create user profile');
            }
            setUserRole('user');
        } catch (error) {
            console.error('Error syncing user profile:', error);
            throw error;
        }
    }

    useEffect(() => {
        const setupAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    await syncUserProfile(session.user)
                    setUser(session.user)
                }
            } catch (error) {
                console.error('Auth setup error:', error)
            } finally {
                setLoading(false)
            }
        }

        setupAuth()

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                try {
                    await syncUserProfile(session.user)
                    setUser(session.user)
                } catch (error) {
                    console.error('Auth state change error:', error)
                    setUser(null)
                }
            } else {
                setUser(null)
                setUserRole(null)
            }
            setLoading(false)
        })

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                console.error("SignIn error:", error);
                throw error;
            }
            if (data.user) {
                await syncUserProfile(data.user);
            }
        } catch (err) {
            console.error("SignIn Exception:", err);
            throw err;
        }
    };

    const signUp = async (email: string, password: string, username: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        full_name: fullName
                    }
                }
            })

            if (error) throw error
            if (!data.user) throw new Error('No user data returned')

            await syncUserProfile(data.user)
        } catch (error) {
            console.error('SignUp error:', error)
            throw error
        }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUserRole(null);
    }

    return (
        <AuthContext.Provider value={{ user, userRole, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
