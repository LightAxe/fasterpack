import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { detectIdentifierType, maskPhone } from '@/lib/phone';
import { AxprFooter } from '@/components/AxprFooter';

const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Please enter your email or phone number')
    .max(255, 'Input too long')
    .refine(
      (val) => detectIdentifierType(val) !== null,
      'Please enter a valid email or US phone number'
    ),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { sendOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const detected = detectIdentifierType(data.identifier);
    if (!detected) return;

    setIsLoading(true);
    const { error } = await sendOtp(detected.identifier, detected.method);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Failed to send code',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const display = detected.method === 'sms'
        ? maskPhone(detected.identifier)
        : detected.identifier;
      toast({
        title: 'Code sent!',
        description: `Check your ${detected.method === 'sms' ? 'phone' : 'email'} for the verification code.`,
      });
      navigate('/verify-otp', {
        state: {
          identifier: detected.identifier,
          method: detected.method,
          display,
          isSignup: false,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-lg">FP</span>
          </div>
          <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
          <CardDescription>Enter your email or phone number to receive a sign-in code</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or phone number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@email.com or (555) 123-4567" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Send me a code
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
      <AxprFooter />
    </div>
  );
}
