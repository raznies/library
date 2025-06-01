"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Book } from '@/types/book';
import { User } from '@/types/user';

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    publish_date: "",
    description: "",
    cover_image_url: "",
    available_copies: 1,
    total_copies: 1,
    location: "",
    category: ""
  });
  const { toast } = useToast();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push("/login?redirectTo=/admin");
        return;
      }
      
      if (userRole && userRole !== "admin") {
        // User is authenticated but not admin, redirect to dashboard
        router.push("/dashboard");
        return;
      }
      
      if (userRole === "admin") {
        // User is admin, proceed with loading admin data
        fetchBooks();
        fetchUsers();
      }
      // If userRole is still null but user exists, wait for role to be determined
    }
  }, [user, userRole, loading, router]);
  const fetchBooks = async () => {
    try {
      setDataLoading(true);      const { data, error } = await supabase.from("books").select("*");
      if (error) throw error;
      setBooks((data as unknown as Book[]) || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load books. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")        .select("user_id, email, username, role, full_name, created_at");
      if (error) throw error;
      setUsers((data as unknown as User[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load users. Please try again.", 
        variant: "destructive" 
      });
    }
  };
  const handleDeleteBook = async (book_id: string) => {
    try {
      const { error } = await supabase.from("books").delete().eq("book_id", book_id);
      if (error) throw error;
      toast({ title: "Success", description: "Book deleted successfully!" });
      fetchBooks(); // Refresh books list
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete book. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handlePromoteDemote = async (user_id: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("user_id", user_id);
      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'} successfully!` 
      });
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update user role. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category) {
      toast({ title: "Error", description: "Title, Author, and Category are required.", variant: "destructive" });
      return;
    }
    
    try {
      const { error } = await supabase.from("books").insert([
        {
          ...form,
          available_copies: Number(form.available_copies),
          total_copies: Number(form.total_copies),
          category: Number(form.category)
        }
      ]);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Book added successfully!" });
      setForm({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        publish_date: "",
        description: "",
        cover_image_url: "",
        available_copies: 1,
        total_copies: 1,
        location: "",
        category: ""
      });
      fetchBooks(); // Refresh books list
    } catch (error) {
      console.error('Error adding book:', error);
      toast({ 
        title: "Error", 
        description: "Failed to add book. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const categoryOptions = [
    { id: 1, name: 'Science' },
    { id: 2, name: 'Non-Fiction' },
    { id: 3, name: 'Fiction' },
    { id: 4, name: 'History' },
    { id: 5, name: 'Technology' },
  ];
  // Show loading spinner while auth is loading or while determining access
  if (loading || (user && !userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-current border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : 'Verifying admin access...'}
        </p>
      </div>
    );
  }

  // Show unauthorized message if user is not admin
  if (user && userRole && userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full">
            Admin Access
          </span>
        </div>
      </div>
      
      {/* Books Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Book Management</h2>
          {dataLoading && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span>Loading books...</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {books.length > 0 ? (
            <ul className="space-y-2">
              {books.map((book: any) => (
                <li key={book.book_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{book.title}</span>
                    <span className="text-muted-foreground"> by {book.author}</span>
                    <div className="text-sm text-muted-foreground">
                      Available: {book.available_copies}/{book.total_copies}
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteBook(book.book_id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {dataLoading ? 'Loading books...' : 'No books found. Add your first book below.'}
            </p>
          )}
        </div>        {/* Add Book Form */}
        <div className="bg-muted/50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add New Book</h3>
          <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={form.title} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="author">Author *</Label>
              <Input id="author" name="author" value={form.author} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" name="isbn" value={form.isbn} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input id="publisher" name="publisher" value={form.publisher} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="publish_date">Publish Date</Label>
              <Input id="publish_date" name="publish_date" type="date" value={form.publish_date} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <Input id="cover_image_url" name="cover_image_url" value={form.cover_image_url} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="available_copies">Available Copies</Label>
              <Input id="available_copies" name="available_copies" type="number" min="1" value={form.available_copies} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="total_copies">Total Copies</Label>
              <Input id="total_copies" name="total_copies" type="number" min="1" value={form.total_copies} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={form.location} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <select 
                id="category" 
                name="category" 
                value={form.category} 
                onChange={handleFormChange} 
                required 
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleFormChange} 
                className="w-full border rounded-md px-3 py-2 bg-background" 
                rows={3} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Add Book</Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Users Management Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="space-y-4">
          {users.length > 0 ? (
            <ul className="space-y-2">
              {users.map((u: any) => (
                <li key={u.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{u.email}</span>
                    <div className="text-sm text-muted-foreground">
                      Role: <span className={`capitalize ${u.role === 'admin' ? 'text-primary font-medium' : ''}`}>
                        {u.role}
                      </span>
                      {u.full_name && ` • ${u.full_name}`}
                      {u.user_id === user?.id && ' (You)'}
                    </div>
                  </div>
                  {u.user_id !== user?.id && (
                    <Button 
                      variant={u.role === 'admin' ? 'destructive' : 'default'}
                      size="sm" 
                      onClick={() => handlePromoteDemote(u.user_id, u.role)}
                    >
                      {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
} 