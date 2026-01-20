import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Send,
  Eye,
  FileText,
  AlertTriangle,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  RefreshCw,
  Download,
  Sparkles,
  Car,
  Bell,
} from 'lucide-react';
import {
  sendWelcomeEmail,
  sendVehicleReportEmail,
  sendAlertEmail,
  generateWelcomeEmailHTML,
  generateVehicleReportEmailHTML,
  generateAlertEmailHTML,
  getEmailHistory,
  clearEmailHistory,
  getEmailConfig,
  setEmailConfig,
  WelcomeEmailData,
  VehicleReportEmailData,
  AlertEmailData,
} from '@/services/emailService';

export function EmailCenter() {
  const { vehicles, alerts } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('compose');
  const [emailType, setEmailType] = useState<'welcome' | 'report' | 'alert'>('report');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  
  // EmailJS Config
  const [config, setConfig] = useState(getEmailConfig());

  useEffect(() => {
    setEmailHistory(getEmailHistory());
  }, []);

  // Generate report data from vehicles
  const generateReportData = (): VehicleReportEmailData => {
    const healthyVehicles = vehicles.filter(v => v.healthScore >= 80).length;
    const warningVehicles = vehicles.filter(v => v.healthScore >= 50 && v.healthScore < 80).length;
    const criticalVehicles = vehicles.filter(v => v.healthScore < 50).length;
    const avgHealth = vehicles.length > 0 
      ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
      : 0;

    const topIssues: string[] = [];
    vehicles.forEach(v => {
      if (v.healthScore < 50) topIssues.push(`${v.name} - Critical health (${v.healthScore}%)`);
      if (v.sensors?.engineTemp > 100) topIssues.push(`${v.name} - Engine overheating`);
      if (v.sensors?.fuelLevel < 15) topIssues.push(`${v.name} - Low fuel level`);
      if (v.sensors?.batteryVoltage < 11.8) topIssues.push(`${v.name} - Low battery`);
    });

    return {
      userName: user?.name || 'Fleet Manager',
      userEmail: recipientEmail,
      reportDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }),
      totalVehicles: vehicles.length,
      healthyVehicles,
      warningVehicles,
      criticalVehicles,
      fleetHealthScore: avgHealth,
      topIssues: topIssues.slice(0, 5),
      vehicleDetails: vehicles.map(v => ({
        name: v.name,
        licensePlate: v.licensePlate,
        healthScore: v.healthScore,
        status: v.healthScore >= 80 ? 'healthy' : v.healthScore >= 50 ? 'warning' : 'critical',
        issues: [
          v.healthScore < 50 ? 'Low health score' : '',
          v.sensors?.engineTemp > 100 ? 'Engine overheating' : '',
          v.sensors?.fuelLevel < 15 ? 'Low fuel' : '',
        ].filter(Boolean),
      })),
    };
  };

  const generateWelcomeData = (): WelcomeEmailData => ({
    userName: user?.name || 'New User',
    userEmail: recipientEmail,
    registrationDate: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }),
    role: user?.role || 'Fleet Manager',
  });

  const generateAlertData = (): AlertEmailData => {
    const activeAlert = alerts.find(a => !a.acknowledged) || {
      type: 'warning',
      title: 'Sample Alert',
      message: 'This is a sample alert for preview purposes.',
      vehicleId: vehicles[0]?.id || '',
    };
    const vehicle = vehicles.find(v => v.id === activeAlert.vehicleId) || vehicles[0];

    return {
      userName: user?.name || 'Fleet Manager',
      userEmail: recipientEmail,
      alertTime: new Date().toLocaleString(),
      alertType: (activeAlert.type as 'critical' | 'warning' | 'info') || 'warning',
      vehicleName: vehicle?.name || 'Unknown Vehicle',
      licensePlate: vehicle?.licensePlate || 'N/A',
      alertTitle: activeAlert.title || 'Vehicle Alert',
      alertMessage: activeAlert.message || 'Alert details unavailable.',
      recommendedAction: getRecommendedAction(activeAlert.type, activeAlert.title),
    };
  };

  const getRecommendedAction = (type: string, title: string): string => {
    if (title?.toLowerCase().includes('engine')) return 'Stop the vehicle immediately and allow the engine to cool down. Schedule immediate inspection.';
    if (title?.toLowerCase().includes('brake')) return 'Reduce speed and avoid sudden braking. Schedule immediate brake system inspection.';
    if (title?.toLowerCase().includes('fuel')) return 'Refuel the vehicle as soon as possible to avoid breakdowns.';
    if (title?.toLowerCase().includes('battery')) return 'Check battery connections and consider replacement if voltage remains low.';
    if (type === 'critical') return 'Take immediate action to address this issue. Contact maintenance team.';
    if (type === 'warning') return 'Schedule maintenance inspection within 24-48 hours.';
    return 'Monitor the situation and take action if conditions worsen.';
  };

  const handlePreview = () => {
    let html = '';
    switch (emailType) {
      case 'welcome':
        html = generateWelcomeEmailHTML(generateWelcomeData());
        break;
      case 'report':
        html = generateVehicleReportEmailHTML(generateReportData());
        break;
      case 'alert':
        html = generateAlertEmailHTML(generateAlertData());
        break;
    }
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    let result;

    try {
      switch (emailType) {
        case 'welcome':
          result = await sendWelcomeEmail(generateWelcomeData());
          break;
        case 'report':
          result = await sendVehicleReportEmail(generateReportData());
          break;
        case 'alert':
          result = await sendAlertEmail(generateAlertData());
          break;
      }

      if (result.success) {
        toast({
          title: '✅ Email Sent!',
          description: result.message,
        });
        setEmailHistory(getEmailHistory());
      } else {
        toast({
          title: 'Send Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSending(false);
  };

  const handleConfigSave = () => {
    setEmailConfig(config);
    toast({
      title: 'Settings Saved',
      description: 'Email configuration updated successfully.',
    });
  };

  const handleClearHistory = () => {
    clearEmailHistory();
    setEmailHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Email history has been cleared.',
    });
  };

  const downloadEmailHTML = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-guardian-${emailType}-email.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Email Center</h2>
            <p className="text-sm text-muted-foreground">Send beautiful email reports and notifications</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-violet-500/20 text-violet-300 border-violet-500/50">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered Templates
        </Badge>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="compose" className="data-[state=active]:bg-violet-600">
            <Send className="w-4 h-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-violet-600">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-violet-600">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Type Selection */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Select Email Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'welcome', icon: UserPlus, label: 'Welcome', color: 'from-green-500 to-emerald-600' },
                    { type: 'report', icon: FileText, label: 'Report', color: 'from-blue-500 to-indigo-600' },
                    { type: 'alert', icon: AlertTriangle, label: 'Alert', color: 'from-orange-500 to-red-600' },
                  ].map((item) => (
                    <motion.button
                      key={item.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEmailType(item.type as any)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        emailType === item.type
                          ? `bg-gradient-to-br ${item.color} border-transparent shadow-lg`
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <item.icon className={`w-8 h-8 mx-auto mb-2 ${
                        emailType === item.type ? 'text-white' : 'text-slate-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        emailType === item.type ? 'text-white' : 'text-slate-300'
                      }`}>{item.label}</p>
                    </motion.button>
                  ))}
                </div>

                <div className="space-y-3 pt-4">
                  <Label className="text-slate-300">Recipient Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>

                {/* Email Type Info */}
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
                  {emailType === 'welcome' && (
                    <div className="flex items-start gap-3">
                      <UserPlus className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Welcome Email</p>
                        <p className="text-sm text-slate-400">Beautiful animated welcome card for new users with platform features and quick start guide.</p>
                      </div>
                    </div>
                  )}
                  {emailType === 'report' && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Vehicle Report</p>
                        <p className="text-sm text-slate-400">Comprehensive fleet health report with all vehicle statuses, health scores, and issues.</p>
                      </div>
                    </div>
                  )}
                  {emailType === 'alert' && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Alert Notification</p>
                        <p className="text-sm text-slate-400">Urgent alert notification with vehicle details and recommended actions.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="flex-1 border-slate-600"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={isSending || !recipientEmail}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Email Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailType === 'report' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                        <Car className="w-6 h-6 text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{vehicles.length}</p>
                        <p className="text-sm text-slate-400">Total Vehicles</p>
                      </div>
                      <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30">
                        <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {vehicles.filter(v => v.healthScore >= 80).length}
                        </p>
                        <p className="text-sm text-slate-400">Healthy</p>
                      </div>
                      <div className="p-4 rounded-xl bg-orange-500/20 border border-orange-500/30">
                        <AlertTriangle className="w-6 h-6 text-orange-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {vehicles.filter(v => v.healthScore >= 50 && v.healthScore < 80).length}
                        </p>
                        <p className="text-sm text-slate-400">Warning</p>
                      </div>
                      <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                        <XCircle className="w-6 h-6 text-red-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {vehicles.filter(v => v.healthScore < 50).length}
                        </p>
                        <p className="text-sm text-slate-400">Critical</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-violet-500/20 border border-violet-500/30">
                      <p className="text-sm text-slate-400 mb-1">Fleet Health Score</p>
                      <p className="text-3xl font-bold text-white">
                        {vehicles.length > 0 
                          ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                )}

                {emailType === 'alert' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                      <Bell className="w-6 h-6 text-red-400 mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {alerts.filter(a => !a.acknowledged).length}
                      </p>
                      <p className="text-sm text-slate-400">Active Alerts</p>
                    </div>
                    <div className="space-y-2">
                      {alerts.filter(a => !a.acknowledged).slice(0, 3).map((alert, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                          <p className="text-sm font-medium text-white">{alert.title}</p>
                          <p className="text-xs text-slate-400">{vehicles.find(v => v.id === alert.vehicleId)?.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {emailType === 'welcome' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
                      <UserPlus className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-lg font-semibold text-white">Welcome Email Preview</p>
                      <p className="text-sm text-slate-400 mt-2">
                        A beautiful animated welcome email will be sent to the new user with platform features and getting started guide.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
                      <p className="text-sm text-slate-400 mb-1">Recipient</p>
                      <p className="font-medium text-white">{user?.name || 'New User'}</p>
                      <p className="text-sm text-slate-400">{recipientEmail || 'No email specified'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Email History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {emailHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No emails sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailHistory.map((email, idx) => (
                      <motion.div
                        key={email.id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-slate-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              email.templateType === 'welcome' ? 'bg-green-500/20' :
                              email.templateType === 'report' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                            }`}>
                              {email.templateType === 'welcome' ? (
                                <UserPlus className="w-4 h-4 text-green-400" />
                              ) : email.templateType === 'report' ? (
                                <FileText className="w-4 h-4 text-blue-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{email.subject}</p>
                              <p className="text-sm text-slate-400">To: {email.to}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={email.status === 'sent' ? 'default' : 'secondary'}>
                              {email.status === 'sent' ? 'Sent' : 'Preview'}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(email.sentAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">EmailJS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">📧 EmailJS Setup Instructions</h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>Sign up at <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">EmailJS.com</a></li>
                  <li>Create an Email Service (Gmail, Outlook, etc.)</li>
                  <li>Create a new Email Template with these variables:
                    <code className="block mt-1 p-2 bg-slate-800 rounded text-green-400 text-[10px]">
                      {"{{to_email}}"} - Recipient email<br/>
                      {"{{subject}}"} - Email subject<br/>
                      {"{{html_content}}"} - HTML body (our template)
                    </code>
                  </li>
                  <li>Copy Service ID, Template ID, and Public Key below</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    Service ID
                    <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/50">Configured ✓</Badge>
                  </Label>
                  <Input
                    placeholder="service_xxxxx"
                    value={config.serviceId}
                    onChange={(e) => setConfig({ ...config, serviceId: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Your EmailJS service ID (e.g., service_bq5asog)</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Template ID</Label>
                  <Input
                    placeholder="template_xxxxx"
                    value={config.templateId}
                    onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Create a template that accepts to_email, subject, html_content</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Public Key</Label>
                  <Input
                    placeholder="Your public key from Account > API Keys"
                    value={config.publicKey}
                    onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Found in your EmailJS Account &gt; API Keys</p>
                </div>
              </div>

              <Button onClick={handleConfigSave} className="w-full bg-gradient-to-r from-violet-500 to-purple-600">
                <Settings className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>

              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-xs text-orange-300">
                  💡 <strong>Tip:</strong> Emails work in preview mode until you configure valid EmailJS credentials. 
                  You can download the HTML template and use it with any email service.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-white">Email Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadEmailHTML}>
                    <Download className="w-4 h-4 mr-2" />
                    Download HTML
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="h-[calc(90vh-120px)] overflow-auto bg-slate-800">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full"
                  title="Email Preview"
                />
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    handleSend();
                  }}
                  className="bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send This Email
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
