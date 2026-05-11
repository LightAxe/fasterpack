import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AxprFooter } from '@/components/AxprFooter';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/signup">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold">Overview</h2>
              <p className="text-muted-foreground">
                Faster Pack is a team training management tool for cross country
                and track coaches and their athletes. This policy explains what information we collect,
                how we use it, and your rights regarding your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Information We Collect</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email address, and optionally phone number
                  when you create an account.
                </li>
                <li>
                  <strong>Training Data:</strong> Workout logs, race results, personal records, and
                  related notes that you or your coach enter.
                </li>
                <li>
                  <strong>Team Information:</strong> Team membership, role (coach, athlete, or parent),
                  and season participation.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To provide the training management features of the app</li>
                <li>To allow coaches to schedule workouts and track team progress</li>
                <li>To allow athletes to log workouts and view their records</li>
                <li>To allow parents to view their child's training activity</li>
                <li>To send verification codes for account authentication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Information Sharing</h2>
              <p className="text-muted-foreground">
                Your training data is shared only with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Coaches of teams you belong to</li>
                <li>Parents who have been linked to your athlete profile (with coach approval)</li>
                <li>Other team members can see leaderboards and team records</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We do not sell your personal information to third parties. We do not display advertising.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using Supabase, a trusted database provider. We use
                industry-standard security measures including encryption in transit and at rest,
                and row-level security policies to ensure users can only access data they are
                authorized to see.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Age Requirements</h2>
              <p className="text-muted-foreground">
                Athletes must be 13 years of age or older to create an account. Athletes under 13
                may participate through the team roster system, where coaches can log training on
                their behalf without the athlete having their own account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Leave a team at any time</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, contact your team coach or the app administrator.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify users of any
                significant changes through the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy or your data, please contact your
                team coach or the app administrator.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      </div>
      <AxprFooter />
    </div>
  );
}
