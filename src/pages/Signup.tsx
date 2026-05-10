import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Users, GraduationCap, Heart, Mail } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { normalizeUSPhone } from '@/lib/phone';

const signupSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  email: z.string()
    .email('Please enter a valid email')
    .max(255, 'Email too long'),
  phone: z.string()
    .regex(/^[\d\s()+-]*$/, 'Invalid phone format')
    .max(20, 'Phone number too long')
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || normalizeUSPhone(value) !== null, 'Please enter a valid US phone number'),
  role: z.enum(['coach', 'athlete', 'parent'], {
    required_error: 'Please select a role',
  }),
  ageConfirmed: z.boolean().optional(),
}).refine(
  (data) => data.role !== 'athlete' || data.ageConfirmed === true,
  {
    message: 'You must confirm you are 13 or older to create an account',
    path: ['ageConfirmed'],
  }
);

type SignupFormData = z.infer<typeof signupSchema>;

const roleOptions = [
  {
    value: 'coach' as const,
    label: 'Coach',
    description: 'Create teams, manage athletes, assign workouts',
    icon: GraduationCap,
  },
  {
    value: 'athlete' as const,
    label: 'Athlete',
    description: 'Join a team, log workouts, track PRs',
    icon: Users,
  },
  {
    value: 'parent' as const,
    label: 'Parent',
    description: 'View your child\'s progress (read-only)',
    icon: Heart,
  },
];

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const { sendOtp, setPendingSignupData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: undefined,
      ageConfirmed: false,
    },
  });

  const selectedRole = form.watch('role');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    
    // Store signup data for after OTP verification
    const normalizedPhone = data.phone?.trim()
      ? normalizeUSPhone(data.phone) ?? data.phone.trim()
      : '';
    const signupData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: normalizedPhone || undefined,
      role: data.role as UserRole,
    };
    setPendingSignupData(signupData);

    // Pass signupData explicitly so sendOtp doesn't race the
    // React state update from setPendingSignupData above.
    const { error } = await sendOtp(data.email, 'email', 'login', signupData);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Failed to send code',
        description: error.message,
        variant: 'destructive',
      });
      setPendingSignupData(null);
    } else {
      toast({
        title: 'Code sent!',
        description: 'Check your email for the verification code.',
      });
      navigate('/verify-otp', { state: { email: data.email, isSignup: true } });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
             <span className="text-primary-foreground font-bold text-lg">FP</span>
           </div>
           <CardTitle className="text-2xl font-heading">Create your account</CardTitle>
           <CardDescription>Join Faster Pack to manage your training</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {roleOptions.map((role) => (
                          <Label
                            key={role.value}
                            htmlFor={role.value}
                            className={cn(
                              'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
                              selectedRole === role.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/50'
                            )}
                          >
                            <RadioGroupItem value={role.value} id={role.value} />
                            <role.icon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">{role.label}</p>
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === 'athlete' && (
                <FormField
                  control={form.control}
                  name="ageConfirmed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          I confirm that I am 13 years of age or older
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send verification code
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
