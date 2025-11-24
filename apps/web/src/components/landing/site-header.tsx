"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Heart, X } from "lucide-react";
import { getDashboardPath } from "@/lib/routing";
import { cn } from "@/lib/utils";
import NextImage from "next/image";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "Solutions", href: "#solutions" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="healthcare-container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-40 h-10">
              <NextImage 
                src="/logo.png" 
                alt="CareLinkMN Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button variant="default" size="sm" asChild className="shadow-md shadow-primary/20">
              <Link href={user ? getDashboardPath(user.role) : "/search"}>
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="shadow-md shadow-primary/20">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary-foreground fill-current" />
                  </div>
                  <span className="font-bold">CareLinkMN</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 mt-8">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-col gap-4">
                  {isAuthenticated ? (
                    <Button size="lg" asChild className="w-full shadow-md shadow-primary/20">
                      <Link href={user ? getDashboardPath(user.role) : "/auth/signin"} onClick={() => setIsOpen(false)}>
                        {user ? "Dashboard" : "Sign In"}
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="lg" asChild className="w-full">
                        <Link href="/auth/signin" onClick={() => setIsOpen(false)}>Sign In</Link>
                      </Button>
                      <Button size="lg" asChild className="w-full shadow-md shadow-primary/20">
                        <Link href="/auth/signup" onClick={() => setIsOpen(false)}>Get Started Free</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
