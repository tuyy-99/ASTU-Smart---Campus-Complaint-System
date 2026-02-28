import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headset, ArrowLeft, Mail, MessageSquare, FilePlus2, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHero } from '../components/ui/PageHero';
import { useAuth } from '../context/AuthContext';

const ContactSupportPage: React.FC = () => {
  const { isAuthenticated, isStudent, user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create mailto link with form data
      const mailtoLink = `mailto:tursinayisehak@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      
      window.location.href = mailtoLink;
      
      setSubmitStatus('success');
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          subject: '',
          message: ''
        });
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          icon={Headset}
          title="Contact Support"
          subtitle="Need help? Send us a message and we'll get back to you soon."
          iconWrapClassName="bg-emerald-600"
        />

        <Card>
          <h3 className="mb-4 text-lg font-bold">Send Support Email</h3>
          
          {submitStatus === 'success' && (
            <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              Your email client will open. Please send the email to complete your request.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
              Failed to open email client. Please try again or email directly to tursinayisehak@gmail.com
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Your Email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Subject"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                className="flex min-h-[150px] w-full rounded-xl border border-slate-300 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700 transition-all resize-none"
                placeholder="Describe your issue in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              <Send size={16} className="mr-2" />
              Send Email
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Other Support Options</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
                  <Mail size={16} />
                  Direct Email
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">tursinayisehak@gmail.com</p>
              </div>

              <Link
                to={isAuthenticated ? '/chatbot' : '/login'}
                className="rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
                  <MessageSquare size={16} />
                  AI Assistant
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAuthenticated ? 'Get instant help' : 'Login to chat'}
                </p>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {isAuthenticated && isStudent ? (
              <Link to="/complaints/new">
                <Button>
                  <FilePlus2 size={16} className="mr-2" />
                  Submit a New Complaint
                </Button>
              </Link>
            ) : (
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button>
                  <FilePlus2 size={16} className="mr-2" />
                  {isAuthenticated ? 'Go to Dashboard' : 'Submit Registration Request'}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactSupportPage;

