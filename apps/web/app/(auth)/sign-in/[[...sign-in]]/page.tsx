import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground font-display mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to your Wellness CRM account
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              card: 'shadow-soft-lg rounded-2xl',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
