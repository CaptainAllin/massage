import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground font-display mb-2">
            Get Started
          </h1>
          <p className="text-muted-foreground">
            Create your Wellness CRM account
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              card: 'shadow-soft-lg rounded-2xl',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
