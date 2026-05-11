import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { normalizeUSPhone } from '@/lib/phone';
import { AxprFooter } from '@/components/AxprFooter';

export default function VerifyPhone() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasSentCode, setHasSentCode] = useState(false);
  const {
    pendingSignupData,
    setPendingSignupData,
    sendPhoneVerificationOtp,
    verifyPhoneOtp,
    refreshProfile,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!pendingSignupData) {
      navigate('/signup', { replace: true });
      return;
    }
    setPhone(pendingSignupData.phone || '');
  }, [pendingSignupData, navigate]);

  const normalizedPhone = normalizeUSPhone(phone.trim());

  const handleSendCode = async () => {
    if (!pendingSignupData) return;
    if (!normalizedPhone) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid US phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const { error } = await sendPhoneVerificationOtp(normalizedPhone);
    setIsSending(false);

    if (error) {
      toast({
        title: 'Failed to send code',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPendingSignupData({
      ...pendingSignupData,
      phone: normalizedPhone,
    });
    setHasSentCode(true);
    toast({
      title: 'Code sent!',
      description: 'Check your phone for the verification code.',
    });
  };

  const handleVerify = async () => {
    if (!pendingSignupData) return;
    if (!normalizedPhone) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid US phone number.',
        variant: 'destructive',
      });
      return;
    }
    if (otp.length !== 6) return;

    setIsVerifying(true);
    const { error } = await verifyPhoneOtp(normalizedPhone, otp);
    setIsVerifying(false);

    if (error) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
      setOtp('');
      return;
    }

    const role = pendingSignupData.role;
    setPendingSignupData(null);
    await refreshProfile();

    toast({
      title: 'Phone verified',
      description: 'Your account setup is complete.',
    });

    if (role === 'coach') {
      navigate('/create-team');
    } else if (role === 'parent') {
      navigate('/link-child');
    } else {
      navigate('/join-team');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading">Verify your phone</CardTitle>
          <CardDescription>
            Finish phone verification to complete account setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone number</label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSending || isVerifying}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSendCode}
              disabled={isSending || isVerifying}
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasSentCode ? 'Resend code' : 'Send code'}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Verification code</p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={isVerifying || isSending}
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
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify phone
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Link
            to="/signup"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to signup
          </Link>
        </CardFooter>
      </Card>
      </div>
      <AxprFooter />
    </div>
  );
}
