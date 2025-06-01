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
            // First check if user exists
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle()

            if (checkError) {
                console.error('Error checking user:', checkError)
                throw checkError;
            }

            if (!existingUser) {
                // If user doesn't exist, create new user record
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            user_id: currentUser.id,
                            email: currentUser.email,
                            username: currentUser.email?.split('@')[0] || 'user',
                            full_name: currentUser.user_metadata.full_name || 'Unknown',
                            password_hash: 'PLACEHOLDER',
                            membership_type: 'regular',
                            role: 'user',
                        }
                    ])
                    .select()
                    .single()

                if (insertError) {
                    console.error('Error creating user profile:', insertError)
                    throw new Error('Failed to create user profile');
                }
                setUserRole('user');
            } else {
                setUserRole((existingUser as any).role || 'user');
            }
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
