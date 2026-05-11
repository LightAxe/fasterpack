import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { AxprFooter } from '@/components/AxprFooter';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { verifyOtp, sendOtp, pendingSignupData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Support both old { email } and new { identifier, method } state
  const identifier = (location.state?.identifier ?? location.state?.email) as string;
  const method = (location.state?.method ?? 'email') as 'email' | 'sms';
  const display = (location.state?.display ?? identifier) as string;
  const isSignup = location.state?.isSignup as boolean;

  useEffect(() => {
    if (!identifier) {
      navigate('/login');
    }
  }, [identifier, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    const { error, isNewUser, needsSignup } = await verifyOtp(identifier, otp, method);
    setIsLoading(false);

    if (error) {
      if (needsSignup) {
        toast({
          title: 'Account not found',
          description: 'Please create an account first.',
          variant: 'destructive',
        });
        navigate('/signup');
        return;
      }
      
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
      setOtp('');
    } else {
      toast({
        title: isSignup ? 'Account created!' : 'Welcome back!',
        description: isSignup ? 'Your account has been created successfully.' : 'You have been signed in.',
      });

      if (isSignup && pendingSignupData) {
        if (pendingSignupData.phone) {
          navigate('/verify-phone');
          return;
        }

        if (pendingSignupData.role === 'coach') {
          navigate('/create-team');
        } else if (pendingSignupData.role === 'parent') {
          navigate('/link-child');
        } else {
          navigate('/join-team');
        }
      } else {
        navigate('/');
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const { error } = await sendOtp(identifier, method);
    setIsResending(false);

    if (error) {
      toast({
        title: 'Failed to resend code',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Code sent!',
        description: `A new verification code has been sent to your ${method === 'sms' ? 'phone' : 'email'}.`,
      });
    }
  };

  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  if (!identifier) return null;

  const IconComponent = method === 'sms' ? Phone : Mail;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <IconComponent className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading">Check your {method === 'sms' ? 'phone' : 'email'}</CardTitle>
          <CardDescription>
            We sent a 6-digit code to<br />
            <span className="font-medium text-foreground">{display}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Code
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend code
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Link 
            to={isSignup ? "/signup" : "/login"} 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {isSignup ? 'signup' : 'login'}
          </Link>
        </CardFooter>
      </Card>
      </div>
      <AxprFooter />
    </div>
  );
}
