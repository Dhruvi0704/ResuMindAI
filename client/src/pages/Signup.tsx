import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

export default function Signup() {
    const [, setLocation] = useLocation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { registerMutation, user } = useAuth();

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password) {
            setError("Please fill in all fields");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        registerMutation.mutate({ username: email, password, name }, {
            onSuccess: () => setLocation("/login")
        });
    };

    if (user) {
        setLocation("/");
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center mb-8 max-w-xl">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-blue-600 mb-4">Join ResuMind AI</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Create your account today and start transforming your career journey with our AI-powered tools.
                </p>
            </div>

            <Card className="w-full max-w-[500px] p-8 shadow-xl border-t-4 border-t-blue-600">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">Create Account</h2>
                    <p className="text-muted-foreground">Sign up to get started</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-blue-600 font-medium">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 border-border focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-blue-600 font-medium">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 border-border focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-blue-600 font-medium">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 border-border focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" className="w-full h-12 font-medium" onClick={() => { }}>
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26+-.19-.58z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    Already have an account?{" "}
                    <a onClick={() => setLocation("/login")} className="text-blue-600 font-semibold cursor-pointer hover:underline">
                        Sign In
                    </a>
                </p>
            </Card>

            <p className="mt-8 text-xs text-muted-foreground">
                &copy; 2026 ResuMind AI. All rights reserved.
            </p>
        </div>
    );
}
