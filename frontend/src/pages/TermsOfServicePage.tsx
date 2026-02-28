import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';

const TermsOfServicePage: React.FC = () => {
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
          icon={FileCheck2}
          title="Terms of Service"
          subtitle="Usage rules for reporting and managing university complaints."
          iconWrapClassName="bg-emerald-600"
        />

        <Card>
          <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <p>
              This platform is for university-related complaint reporting and resolution only. Users must
              submit accurate and respectful information.
            </p>
            <p>
              Misuse of the system, false reporting, abuse, or unauthorized access attempts may lead to
              account restrictions according to university policy.
            </p>
            <p>
              Complaint statuses and remarks are official workflow records. Staff and admin actions are
              role-based and auditable.
            </p>
            <p>
              By using this service, you agree to these terms and applicable ASTU administrative rules.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
