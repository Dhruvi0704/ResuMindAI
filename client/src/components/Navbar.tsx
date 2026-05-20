import { Link, useLocation } from "wouter";
import { Moon, Sun, FileText, ChevronDown, LogOut, User, LayoutDashboard, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-3 py-2 -ml-3 cursor-pointer">
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                ResuMind AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 cursor-pointer ${isActive("/") ? "bg-primary/10 text-primary" : "text-foreground"
                }`}>
                Home
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 cursor-pointer text-foreground group">
                  Features
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/resume-generator">
                    <span className="w-full cursor-pointer">Resume Generator</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/resume-screening">
                    <span className="w-full cursor-pointer">Resume Screening</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cv-generator">
                    <span className="w-full cursor-pointer">CV Generator</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mock-interview">
                    <span className="w-full cursor-pointer">Mock Interview</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/about">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 cursor-pointer ${isActive("/about") ? "bg-primary/10 text-primary" : "text-foreground"
                }`}>
                About
              </div>
            </Link>
            <Link href="/contact">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 cursor-pointer ${isActive("/contact") ? "bg-primary/10 text-primary" : "text-foreground"
                }`}>
                Contact
              </div>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.username}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <div className="flex items-center cursor-pointer w-full">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-documents">
                      <div className="flex items-center cursor-pointer w-full">
                        <FileStack className="mr-2 h-4 w-4" />
                        My Resumes
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
