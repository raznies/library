'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BookOpenCheck, UserCircle, Settings, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
    const { user, userRole, signOut, loading } = useAuth()
    const router = useRouter()
    const [isSigningOut, setIsSigningOut] = useState(false)

    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await signOut()
            router.push('/')
        } catch (error) {
            console.error('Sign out error:', error)
        } finally {
            setIsSigningOut(false)
        }
    }

    const getDashboardLink = () => {
        if (userRole === 'admin') {
            return { href: '/admin', text: 'Admin Dashboard', icon: Settings }
        }
        return { href: '/dashboard', text: 'My Dashboard', icon: User }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container h-14 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <BookOpenCheck className="h-6 w-6" />
                        <span className="font-bold hidden md:inline-block">Library System</span>
                    </Link>                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/books" className="nav-link text-sm font-medium transition-colors hover:text-primary">
                            Browse Books
                        </Link>
                        {user && userRole && (
                            <>
                                {(() => {
                                    const dashboardLink = getDashboardLink()
                                    const Icon = dashboardLink.icon
                                    return (
                                        <Link 
                                            href={dashboardLink.href} 
                                            className="nav-link text-sm font-medium transition-colors hover:text-primary flex items-center space-x-1"
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{dashboardLink.text}</span>
                                        </Link>
                                    )
                                })()}
                                {userRole === 'admin' && (
                                    <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                                        Admin
                                    </span>
                                )}
                            </>
                        )}
                    </nav>
                </div>                <div className="flex items-center space-x-4">
                    {user && !loading ? (
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2">
                                <UserCircle className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {user.email}
                                </span>
                                {userRole && (
                                    <span className="text-xs text-muted-foreground capitalize">
                                        ({userRole})
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                size="sm"
                                disabled={isSigningOut}
                                className="flex items-center space-x-1"
                            >
                                {isSigningOut ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                                        <span>Signing out...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="h-3 w-3" />
                                        <span>Sign Out</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : !user && !loading ? (
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
