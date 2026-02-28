import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent px-4 py-10 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>
        </Link>

        <PageHero
          icon={ShieldCheck}
          title="Privacy Policy"
          subtitle="How complaint data and user information are handled in the system."
          iconWrapClassName="bg-emerald-600"
        />

        <Card>
          <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <p>
              ASTU Smart Campus Complaint System collects only the data needed to manage complaints:
              account details, complaint content, attachments, and resolution remarks.
            </p>
            <p>
              Your data is used for complaint investigation, status tracking, communication, and service
              improvement. Access is restricted by role (student, staff, admin).
            </p>
            <p>
              Attachments and complaint history are stored securely and are visible only to authorized
              users connected to the complaint workflow.
            </p>
            <p>
              For privacy concerns, contact support from the Contact Support page with your complaint ID
              and request details.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
