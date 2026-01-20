// Email Service using EmailJS
// Sign up at https://www.emailjs.com/ and get your keys

interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// EmailJS Configuration - Your actual keys
const EMAIL_CONFIG: EmailConfig = {
  serviceId: 'service_bq5asog',      // Your EmailJS service ID
  templateId: 'template_rt8uhoj',    // Your EmailJS template ID
  publicKey: 'gEZ-CO1QlK68UQEU3',    // Your EmailJS public key
};

// Store config in localStorage for easy updates
export const getEmailConfig = (): EmailConfig => {
  const stored = localStorage.getItem('emailjs_config');
  if (stored) {
    return JSON.parse(stored);
  }
  return EMAIL_CONFIG;
};

export const setEmailConfig = (config: Partial<EmailConfig>) => {
  const current = getEmailConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('emailjs_config', JSON.stringify(updated));
};

// Email Templates
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  registrationDate: string;
  role: string;
}

export interface VehicleReportEmailData {
  userName: string;
  userEmail: string;
  reportDate: string;
  totalVehicles: number;
  healthyVehicles: number;
  warningVehicles: number;
  criticalVehicles: number;
  fleetHealthScore: number;
  topIssues: string[];
  vehicleDetails: Array<{
    name: string;
    licensePlate: string;
    healthScore: number;
    status: string;
    issues: string[];
  }>;
}

export interface AlertEmailData {
  userName: string;
  userEmail: string;
  alertTime: string;
  alertType: 'critical' | 'warning' | 'info';
  vehicleName: string;
  licensePlate: string;
  alertTitle: string;
  alertMessage: string;
  recommendedAction: string;
}

// Generate Welcome Email HTML
export const generateWelcomeEmailHTML = (data: WelcomeEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fleet Guardian AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 30px 10px rgba(139, 92, 246, 0.2); }
    }
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-10px) rotate(2deg); }
      75% { transform: translateY(-5px) rotate(-2deg); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5)); }
      50% { filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.8)); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 25%, #0f172a 50%, #1e1b4b 75%, #0c0a1d 100%);
      background-size: 400% 400%;
      animation: gradientFlow 15s ease infinite;
      min-height: 100vh; 
      padding: 40px 20px;
    }
    .container { 
      max-width: 650px; 
      margin: 0 auto; 
      background: linear-gradient(145deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
      backdrop-filter: blur(20px); 
      border-radius: 32px; 
      overflow: hidden; 
      border: 1px solid rgba(139, 92, 246, 0.3); 
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 60px -10px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1); 
      animation: fadeInUp 1s ease-out;
    }
    .header { 
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 25%, #ec4899 50%, #f43f5e 75%, #8b5cf6 100%); 
      background-size: 300% 300%;
      animation: gradientFlow 8s ease infinite; 
      padding: 60px 40px; 
      text-align: center; 
      position: relative; 
      overflow: hidden;
    }
    .header::before { 
      content: ''; 
      position: absolute; 
      top: -50%; 
      left: -50%; 
      width: 200%; 
      height: 200%; 
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%);
      animation: float 8s ease-in-out infinite;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6, #ec4899, #f43f5e);
    }
    .logo-container {
      position: relative;
      width: 130px;
      height: 130px;
      margin: 0 auto 25px;
    }
    .logo-ring {
      position: absolute;
      inset: 0;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      animation: spin 20s linear infinite;
    }
    .logo-ring::before {
      content: '';
      position: absolute;
      top: -3px;
      left: 50%;
      width: 12px;
      height: 12px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 20px #22c55e;
    }
    .logo { 
      width: 100px; 
      height: 100px; 
      background: rgba(255,255,255,0.15); 
      border-radius: 50%; 
      margin: 15px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      animation: pulse 3s ease-in-out infinite; 
      backdrop-filter: blur(10px); 
      border: 2px solid rgba(255,255,255,0.4);
      box-shadow: inset 0 0 30px rgba(255,255,255,0.1);
    }
    .logo svg { width: 55px; height: 55px; fill: white; animation: glow 2s ease-in-out infinite; }
    .header h1 { 
      color: white; 
      font-size: 32px; 
      font-weight: 800; 
      text-shadow: 0 4px 20px rgba(0,0,0,0.3); 
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    .header p { color: rgba(255,255,255,0.95); font-size: 17px; font-weight: 400; }
    .confetti {
      position: absolute;
      font-size: 28px;
      animation: bounce 2s ease-in-out infinite;
    }
    .confetti-1 { top: 20px; left: 20px; animation-delay: 0s; }
    .confetti-2 { top: 30px; right: 30px; animation-delay: 0.3s; }
    .confetti-3 { bottom: 40px; left: 40px; animation-delay: 0.6s; }
    .confetti-4 { bottom: 30px; right: 20px; animation-delay: 0.9s; }
    .content { padding: 50px 40px; }
    .welcome-card { 
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%); 
      border-radius: 24px; 
      padding: 35px; 
      margin-bottom: 35px; 
      border: 1px solid rgba(139, 92, 246, 0.25);
      position: relative;
      overflow: hidden;
    }
    .welcome-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -200%;
      width: 200%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shimmer 3s infinite;
    }
    .welcome-card h2 { 
      color: #c4b5fd; 
      font-size: 28px; 
      margin-bottom: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .welcome-card p { color: rgba(255,255,255,0.85); line-height: 1.8; font-size: 16px; }
    .user-info { 
      background: rgba(255,255,255,0.03); 
      border-radius: 20px; 
      padding: 25px 30px; 
      margin: 30px 0;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .user-info-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 16px 0; 
      border-bottom: 1px solid rgba(255,255,255,0.06); 
    }
    .user-info-item:last-child { border-bottom: none; }
    .user-info-label { color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; }
    .user-info-value { 
      color: #c4b5fd; 
      font-weight: 600; 
      font-size: 15px;
      background: rgba(139, 92, 246, 0.15);
      padding: 6px 14px;
      border-radius: 20px;
    }
    .section-title {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 25px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .features { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 18px; 
      margin: 30px 0; 
    }
    .feature { 
      background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); 
      border-radius: 20px; 
      padding: 28px 20px; 
      text-align: center; 
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
      border: 1px solid rgba(255,255,255,0.08);
      position: relative;
      overflow: hidden;
    }
    .feature:hover { 
      background: rgba(139, 92, 246, 0.15); 
      border-color: rgba(139, 92, 246, 0.4); 
      transform: translateY(-5px);
      box-shadow: 0 20px 40px -15px rgba(139, 92, 246, 0.3);
    }
    .feature-icon { 
      width: 65px; 
      height: 65px; 
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%); 
      border-radius: 20px; 
      margin: 0 auto 18px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 30px;
      box-shadow: 0 10px 30px -5px rgba(139, 92, 246, 0.5);
    }
    .feature h3 { color: white; font-size: 15px; margin-bottom: 8px; font-weight: 600; }
    .feature p { color: rgba(255,255,255,0.5); font-size: 13px; }
    .cta-button { 
      display: block; 
      width: 100%; 
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%); 
      background-size: 200% 200%;
      animation: gradientFlow 4s ease infinite;
      color: white; 
      text-decoration: none; 
      padding: 22px 35px; 
      border-radius: 16px; 
      text-align: center; 
      font-weight: 700; 
      font-size: 17px; 
      margin: 35px 0; 
      transition: all 0.3s ease; 
      box-shadow: 0 15px 40px -10px rgba(139, 92, 246, 0.6);
      letter-spacing: 0.5px;
    }
    .cta-button:hover { 
      transform: translateY(-3px) scale(1.02); 
      box-shadow: 0 20px 50px -10px rgba(139, 92, 246, 0.7);
    }
    .footer { 
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%); 
      padding: 35px; 
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .footer p { color: rgba(255,255,255,0.4); font-size: 14px; margin-bottom: 12px; }
    .social-links { display: flex; justify-content: center; gap: 15px; margin-top: 20px; }
    .social-link { 
      width: 48px; 
      height: 48px; 
      background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); 
      border-radius: 14px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: rgba(255,255,255,0.6); 
      text-decoration: none; 
      transition: all 0.3s ease;
      font-size: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .social-link:hover { 
      background: rgba(139, 92, 246, 0.3); 
      color: white;
      transform: translateY(-3px);
      border-color: rgba(139, 92, 246, 0.5);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="confetti confetti-1">🎊</span>
      <span class="confetti confetti-2">✨</span>
      <span class="confetti confetti-3">🎉</span>
      <span class="confetti confetti-4">🌟</span>
      <div class="logo-container">
        <div class="logo-ring"></div>
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      </div>
      <h1>🎉 Welcome to Fleet Guardian AI!</h1>
      <p>Your intelligent fleet management journey begins now</p>
    </div>
    
    <div class="content">
      <div class="welcome-card">
        <h2><span>👋</span> Hello, ${data.userName}!</h2>
        <p>Thank you for joining <strong>Fleet Guardian AI</strong> - the most advanced AI-powered fleet management platform. We're absolutely thrilled to have you on board! Get ready to experience the future of fleet management.</p>
      </div>
      
      <div class="user-info">
        <div class="user-info-item">
          <span class="user-info-label">📧 Email</span>
          <span class="user-info-value">${data.userEmail}</span>
        </div>
        <div class="user-info-item">
          <span class="user-info-label">👤 Account Type</span>
          <span class="user-info-value">${data.role}</span>
        </div>
        <div class="user-info-item">
          <span class="user-info-label">📅 Registration Date</span>
          <span class="user-info-value">${data.registrationDate}</span>
        </div>
      </div>
      
      <h3 class="section-title"><span>🚀</span> What You Can Do</h3>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🚗</div>
          <h3>Fleet Monitoring</h3>
          <p>Real-time GPS tracking & status</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🤖</div>
          <h3>AI Predictions</h3>
          <p>ML-powered maintenance alerts</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <h3>Smart Analytics</h3>
          <p>Advanced insights & reports</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🔔</div>
          <h3>Instant Alerts</h3>
          <p>Real-time notifications</p>
        </div>
      </div>
      
      <a href="#" class="cta-button">🚀 Launch Your Dashboard</a>
    </div>
    
    <div class="footer">
      <p>© 2026 Fleet Guardian AI. All rights reserved.</p>
      <p style="color: rgba(255,255,255,0.6); font-weight: 500;">Intelligent Fleet Management for the Modern World</p>
      <div class="social-links">
        <a href="#" class="social-link">📧</a>
        <a href="#" class="social-link">🐦</a>
        <a href="#" class="social-link">💼</a>
        <a href="#" class="social-link">📱</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate Vehicle Report Email HTML
export const generateVehicleReportEmailHTML = (data: VehicleReportEmailData): string => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getHealthGradient = (score: number) => {
    if (score >= 80) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  };

  const getHealthEmoji = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  const vehicleRows = data.vehicleDetails.map(v => `
    <tr class="vehicle-row">
      <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2)); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🚗</div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 16px; margin-bottom: 4px;">${v.name}</div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 6px;">
              <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px;">🔖 ${v.licensePlate}</span>
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 8px; background: ${getHealthGradient(v.healthScore)}; padding: 8px 18px; border-radius: 25px; color: white; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px -3px ${v.healthScore >= 80 ? 'rgba(34, 197, 94, 0.4)' : v.healthScore >= 60 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'};">
          ${getHealthEmoji(v.healthScore)} ${v.healthScore}%
        </div>
      </td>
      <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
        <span style="display: inline-flex; align-items: center; gap: 6px; background: ${getStatusColor(v.status)}15; color: ${getStatusColor(v.status)}; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${getStatusColor(v.status)}30;">
          <span style="width: 8px; height: 8px; background: ${getStatusColor(v.status)}; border-radius: 50%; display: inline-block;"></span>
          ${v.status}
        </span>
      </td>
      <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
        ${v.issues.length > 0 
          ? `<div style="display: flex; flex-direction: column; gap: 6px;">${v.issues.slice(0, 2).map(issue => `<span style="color: rgba(255,255,255,0.7); font-size: 13px; display: flex; align-items: center; gap: 6px;"><span style="color: #f59e0b;">⚡</span> ${issue}</span>`).join('')}</div>` 
          : '<span style="color: #22c55e; display: flex; align-items: center; gap: 6px; font-size: 13px;"><span>✅</span> All systems normal</span>'}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Report - Fleet Guardian AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 30px 10px rgba(59, 130, 246, 0.1); } }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 25%, #0f172a 50%, #1e1b4b 75%, #0c0a1d 100%);
      background-size: 400% 400%;
      animation: gradientFlow 20s ease infinite;
      min-height: 100vh; 
      padding: 40px 20px;
    }
    .container { 
      max-width: 750px; 
      margin: 0 auto; 
      background: linear-gradient(145deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
      backdrop-filter: blur(20px); 
      border-radius: 32px; 
      overflow: hidden; 
      border: 1px solid rgba(59, 130, 246, 0.2); 
      box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8), 0 0 80px -20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
      animation: fadeInUp 0.8s ease-out;
    }
    .header { 
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #8b5cf6 50%, #a855f7 75%, #1e40af 100%); 
      background-size: 300% 300%;
      animation: gradientFlow 10s ease infinite;
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    .header::after { 
      content: ''; 
      position: absolute; 
      bottom: 0; 
      left: 0; 
      right: 0; 
      height: 5px; 
      background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6, #f59e0b, #ef4444); 
    }
    .report-badge { 
      display: inline-flex; 
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15); 
      backdrop-filter: blur(10px);
      padding: 10px 24px; 
      border-radius: 30px; 
      color: white; 
      font-size: 13px; 
      font-weight: 700; 
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .header h1 { 
      color: white; 
      font-size: 32px; 
      font-weight: 800;
      margin-bottom: 12px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
      letter-spacing: -0.5px;
    }
    .header p { color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400; }
    .summary-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 16px; 
      padding: 35px; 
      background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
    }
    .summary-card { 
      background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); 
      border-radius: 20px; 
      padding: 24px 16px; 
      text-align: center; 
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .summary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      animation: shimmer 3s infinite;
    }
    .summary-card:hover { 
      transform: translateY(-5px); 
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 15px 40px -10px rgba(59, 130, 246, 0.2);
    }
    .summary-icon { font-size: 28px; margin-bottom: 12px; animation: bounce 2s ease-in-out infinite; }
    .summary-value { font-size: 36px; font-weight: 800; margin-bottom: 6px; }
    .summary-label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
    .health-meter { padding: 45px 30px; text-align: center; background: linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.05) 100%); }
    .health-container { position: relative; width: 200px; height: 200px; margin: 0 auto 25px; }
    .health-ring {
      position: absolute;
      inset: 0;
      border: 4px solid rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    .health-ring-progress {
      position: absolute;
      inset: 0;
      border: 6px solid transparent;
      border-top-color: ${data.fleetHealthScore >= 80 ? '#22c55e' : data.fleetHealthScore >= 60 ? '#f59e0b' : '#ef4444'};
      border-right-color: ${data.fleetHealthScore >= 50 ? (data.fleetHealthScore >= 80 ? '#22c55e' : data.fleetHealthScore >= 60 ? '#f59e0b' : '#ef4444') : 'transparent'};
      border-bottom-color: ${data.fleetHealthScore >= 75 ? (data.fleetHealthScore >= 80 ? '#22c55e' : '#f59e0b') : 'transparent'};
      border-left-color: ${data.fleetHealthScore >= 87 ? '#22c55e' : 'transparent'};
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .health-circle { 
      position: absolute;
      inset: 15px;
      border-radius: 50%; 
      background: linear-gradient(145deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .health-score { font-size: 48px; font-weight: 800; color: white; line-height: 1; }
    .health-label { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500; margin-top: 5px; }
    .health-status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: ${data.fleetHealthScore >= 80 ? 'rgba(34, 197, 94, 0.15)' : data.fleetHealthScore >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      border: 1px solid ${data.fleetHealthScore >= 80 ? 'rgba(34, 197, 94, 0.3)' : data.fleetHealthScore >= 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      padding: 12px 24px;
      border-radius: 30px;
      color: ${data.fleetHealthScore >= 80 ? '#22c55e' : data.fleetHealthScore >= 60 ? '#f59e0b' : '#ef4444'};
      font-size: 15px;
      font-weight: 600;
    }
    .section { padding: 35px; }
    .section-title { 
      color: white; 
      font-size: 20px; 
      font-weight: 700;
      margin-bottom: 25px; 
      display: flex; 
      align-items: center; 
      gap: 12px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .section-title span { font-size: 24px; }
    .issues-list { display: flex; flex-direction: column; gap: 12px; }
    .issue-item { 
      background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%); 
      border: 1px solid rgba(239,68,68,0.2); 
      border-radius: 16px; 
      padding: 18px 20px; 
      color: #fca5a5; 
      font-size: 15px; 
      display: flex; 
      align-items: center; 
      gap: 14px;
      transition: all 0.3s ease;
    }
    .issue-item:hover {
      background: rgba(239,68,68,0.15);
      transform: translateX(5px);
    }
    .issue-icon { 
      font-size: 20px; 
      width: 40px;
      height: 40px;
      background: rgba(239,68,68,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    table { width: 100%; border-collapse: collapse; }
    th { 
      text-align: left; 
      padding: 18px 20px; 
      color: rgba(255,255,255,0.5); 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1.5px;
      font-weight: 700;
      border-bottom: 2px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.2);
    }
    .vehicle-row:hover {
      background: rgba(59, 130, 246, 0.05);
    }
    .footer { 
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%); 
      padding: 35px; 
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .footer p { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 8px; }
    .cta-button { 
      display: inline-flex; 
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%); 
      background-size: 200% 200%;
      animation: gradientFlow 4s ease infinite;
      color: white; 
      text-decoration: none; 
      padding: 16px 35px; 
      border-radius: 14px; 
      font-weight: 700; 
      font-size: 15px; 
      margin-top: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px -5px rgba(59, 130, 246, 0.5);
    }
    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px -5px rgba(59, 130, 246, 0.6);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="report-badge">📊 <span>FLEET HEALTH REPORT</span></div>
      <h1>🚀 Fleet Performance Analysis</h1>
      <p>Generated for <strong>${data.userName}</strong> on ${data.reportDate}</p>
    </div>
    
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">🚗</div>
        <div class="summary-value" style="color: #60a5fa;">${data.totalVehicles}</div>
        <div class="summary-label">Total Fleet</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">✅</div>
        <div class="summary-value" style="color: #22c55e;">${data.healthyVehicles}</div>
        <div class="summary-label">Healthy</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⚠️</div>
        <div class="summary-value" style="color: #f59e0b;">${data.warningVehicles}</div>
        <div class="summary-label">Warning</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🚨</div>
        <div class="summary-value" style="color: #ef4444;">${data.criticalVehicles}</div>
        <div class="summary-label">Critical</div>
      </div>
    </div>
    
    <div class="health-meter">
      <div class="health-container">
        <div class="health-ring"></div>
        <div class="health-ring-progress"></div>
        <div class="health-circle">
          <div class="health-score">${data.fleetHealthScore}%</div>
          <div class="health-label">Fleet Health</div>
        </div>
      </div>
      <div class="health-status">
        ${data.fleetHealthScore >= 80 ? '✅ Excellent condition!' : data.fleetHealthScore >= 60 ? '⚠️ Needs attention' : '🚨 Critical attention required'}
      </div>
    </div>
    
    ${data.topIssues.length > 0 ? `
    <div class="section" style="background: linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%);">
      <h3 class="section-title"><span>⚡</span> Priority Issues</h3>
      <div class="issues-list">
        ${data.topIssues.map((issue, i) => `<div class="issue-item"><span class="issue-icon">⚠️</span> <span>${issue}</span></div>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <h3 class="section-title"><span>📋</span> Vehicle Details</h3>
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th style="text-align: center;">Health Score</th>
            <th style="text-align: center;">Status</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          ${vehicleRows}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>📧 This report was automatically generated by <strong>Fleet Guardian AI</strong></p>
      <p style="color: rgba(255,255,255,0.6);">Real-time monitoring • AI-powered predictions • Smart alerts</p>
      <a href="#" class="cta-button">🔍 View Full Dashboard</a>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate Alert Email HTML
export const generateAlertEmailHTML = (data: AlertEmailData): string => {
  const getAlertColors = (type: string) => {
    switch (type) {
      case 'critical': return { 
        bg: '#dc2626', 
        light: '#fef2f2', 
        text: '#ef4444', 
        gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
        glow: 'rgba(239, 68, 68, 0.4)'
      };
      case 'warning': return { 
        bg: '#d97706', 
        light: '#fffbeb', 
        text: '#f59e0b', 
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        glow: 'rgba(245, 158, 11, 0.4)'
      };
      default: return { 
        bg: '#2563eb', 
        light: '#eff6ff', 
        text: '#3b82f6', 
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        glow: 'rgba(59, 130, 246, 0.4)'
      };
    }
  };

  const colors = getAlertColors(data.alertType);
  const alertIcon = data.alertType === 'critical' ? '🚨' : data.alertType === 'warning' ? '⚠️' : 'ℹ️';
  const alertEmoji = data.alertType === 'critical' ? '🔴' : data.alertType === 'warning' ? '🟡' : '🔵';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Alert - ${data.alertTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @keyframes shake { 
      0%, 100% { transform: translateX(0); } 
      10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); } 
      20%, 40%, 60%, 80% { transform: translateX(8px); } 
    }
    @keyframes blink { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0.4; } 
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${colors.glow}; }
      50% { transform: scale(1.05); box-shadow: 0 0 40px 15px transparent; }
    }
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 10px ${colors.glow}); }
      50% { filter: drop-shadow(0 0 30px ${colors.glow}); }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 25%, #0f172a 50%, #1e1b4b 75%, #0c0a1d 100%);
      background-size: 400% 400%;
      animation: gradientFlow 20s ease infinite;
      min-height: 100vh; 
      padding: 40px 20px;
    }
    .container { 
      max-width: 620px; 
      margin: 0 auto; 
      background: linear-gradient(145deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
      backdrop-filter: blur(20px); 
      border-radius: 32px; 
      overflow: hidden; 
      border: 2px solid ${colors.bg}50; 
      box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8), 0 0 80px -10px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1);
      animation: slideInUp 0.6s ease-out;
    }
    .alert-header { 
      background: ${colors.gradient}; 
      background-size: 200% 200%;
      animation: gradientFlow 5s ease infinite;
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .alert-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%);
    }
    .alert-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, white, ${colors.bg}, white);
    }
    .alert-icon-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 25px;
    }
    .alert-icon-ring {
      position: absolute;
      inset: 0;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      ${data.alertType === 'critical' ? 'animation: ripple 1.5s infinite;' : ''}
    }
    .alert-icon-ring-2 {
      position: absolute;
      inset: -10px;
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      ${data.alertType === 'critical' ? 'animation: ripple 1.5s infinite 0.3s;' : ''}
    }
    .alert-icon { 
      position: absolute;
      inset: 10px;
      font-size: 55px; 
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      ${data.alertType === 'critical' ? 'animation: shake 0.6s ease-in-out, glow 2s infinite;' : 'animation: float 3s ease-in-out infinite;'} 
    }
    .alert-badge { 
      display: inline-flex; 
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.2); 
      backdrop-filter: blur(10px);
      padding: 10px 22px; 
      border-radius: 30px; 
      color: white; 
      font-size: 12px; 
      font-weight: 800; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
      margin-bottom: 18px;
      border: 1px solid rgba(255,255,255,0.3);
      ${data.alertType === 'critical' ? 'animation: blink 1s infinite;' : ''} 
    }
    .alert-badge-dot {
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      ${data.alertType === 'critical' ? 'animation: blink 0.5s infinite;' : ''}
    }
    .alert-header h1 { 
      color: white; 
      font-size: 26px; 
      font-weight: 800;
      margin-bottom: 12px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .alert-time { 
      color: rgba(255,255,255,0.9); 
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
    }
    .vehicle-info { 
      background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
      padding: 30px 40px; 
      display: flex; 
      align-items: center; 
      gap: 20px; 
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .vehicle-icon { 
      width: 75px; 
      height: 75px; 
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border-radius: 20px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 38px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .vehicle-details h3 { 
      color: white; 
      font-size: 22px; 
      font-weight: 700;
      margin-bottom: 8px;
    }
    .vehicle-details p { 
      color: rgba(255,255,255,0.5); 
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vehicle-details p span {
      background: rgba(255,255,255,0.1);
      padding: 4px 12px;
      border-radius: 8px;
      font-weight: 500;
    }
    .alert-content { padding: 35px 40px; }
    .message-box { 
      background: linear-gradient(135deg, ${colors.bg}20 0%, ${colors.bg}10 100%);
      border: 1px solid ${colors.bg}40; 
      border-radius: 20px; 
      padding: 28px; 
      margin-bottom: 25px;
      position: relative;
      overflow: hidden;
    }
    .message-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: ${colors.gradient};
    }
    .message-box h4 { 
      color: ${colors.text}; 
      font-size: 13px; 
      text-transform: uppercase; 
      letter-spacing: 1.5px; 
      margin-bottom: 14px; 
      display: flex; 
      align-items: center; 
      gap: 10px;
      font-weight: 700;
    }
    .message-box p { color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; }
    .action-box { 
      background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.1) 100%); 
      border: 1px solid rgba(34,197,94,0.25); 
      border-radius: 20px; 
      padding: 28px;
      position: relative;
      overflow: hidden;
    }
    .action-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: linear-gradient(180deg, #22c55e, #16a34a);
    }
    .action-box h4 { 
      color: #22c55e; 
      font-size: 13px; 
      text-transform: uppercase; 
      letter-spacing: 1.5px; 
      margin-bottom: 14px; 
      display: flex; 
      align-items: center; 
      gap: 10px;
      font-weight: 700;
    }
    .action-box p { color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; }
    .cta-section { 
      padding: 0 40px 35px; 
      display: flex; 
      gap: 15px;
    }
    .cta-button { 
      flex: 1; 
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 18px 25px; 
      border-radius: 16px; 
      text-align: center; 
      text-decoration: none; 
      font-weight: 700; 
      font-size: 15px; 
      transition: all 0.3s ease;
    }
    .cta-primary { 
      background: ${colors.gradient};
      background-size: 200% 200%;
      animation: gradientFlow 4s ease infinite;
      color: white;
      box-shadow: 0 10px 30px -5px ${colors.glow};
    }
    .cta-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px -5px ${colors.glow};
    }
    .cta-secondary { 
      background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
      color: white; 
      border: 1px solid rgba(255,255,255,0.15);
    }
    .cta-secondary:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-3px);
    }
    .footer { 
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
      padding: 30px 40px; 
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .footer p { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 6px; }
    .footer-brand {
      color: rgba(255,255,255,0.6);
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-header">
      <div class="alert-icon-container">
        <div class="alert-icon-ring"></div>
        <div class="alert-icon-ring-2"></div>
        <div class="alert-icon">${alertIcon}</div>
      </div>
      <div class="alert-badge">
        <span class="alert-badge-dot"></span>
        ${data.alertType.toUpperCase()} ALERT
      </div>
      <h1>${data.alertTitle}</h1>
      <p class="alert-time">🕐 ${data.alertTime}</p>
    </div>
    
    <div class="vehicle-info">
      <div class="vehicle-icon">🚗</div>
      <div class="vehicle-details">
        <h3>${data.vehicleName}</h3>
        <p>License Plate: <span>🔖 ${data.licensePlate}</span></p>
      </div>
    </div>
    
    <div class="alert-content">
      <div class="message-box">
        <h4>${alertEmoji} Alert Details</h4>
        <p>${data.alertMessage}</p>
      </div>
      
      <div class="action-box">
        <h4>✅ Recommended Action</h4>
        <p>${data.recommendedAction}</p>
      </div>
    </div>
    
    <div class="cta-section">
      <a href="#" class="cta-button cta-primary">🔍 View Details</a>
      <a href="#" class="cta-button cta-secondary">✓ Acknowledge</a>
    </div>
    
    <div class="footer">
      <p>📧 Alert sent to <strong>${data.userEmail}</strong></p>
      <p style="color: rgba(255,255,255,0.5);">You received this alert because you're subscribed to fleet notifications</p>
      <div class="footer-brand">
        🚀 Fleet Guardian AI - Smart Fleet Management
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send Email Function (using EmailJS or custom backend)
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  templateType: 'welcome' | 'report' | 'alert'
): Promise<{ success: boolean; message: string }> => {
  const config = getEmailConfig();
  
  // Check if EmailJS is configured
  if (config.publicKey === 'YOUR_PUBLIC_KEY') {
    console.log('Email Preview Mode - EmailJS not configured');
    console.log('To:', to);
    console.log('Subject:', subject);
    // Store in localStorage for preview
    const emailHistory = JSON.parse(localStorage.getItem('email_history') || '[]');
    emailHistory.unshift({
      id: Date.now(),
      to,
      subject,
      htmlContent,
      templateType,
      sentAt: new Date().toISOString(),
      status: 'preview'
    });
    localStorage.setItem('email_history', JSON.stringify(emailHistory.slice(0, 50)));
    
    return {
      success: true,
      message: 'Email saved to preview (EmailJS not configured)'
    };
  }

  try {
    // Using EmailJS with your template variables
    // Note: EmailJS template should contain the design, we just pass the data
    const templateParams = {
      to_email: to,           // IMPORTANT: This is the recipient email
      name: templateType === 'welcome' ? 'Fleet Guardian AI' : 'Fleet Alert System',
      email: to,              // Recipient's email to display
      title: subject,
      time: new Date().toLocaleString(),
      message: htmlContent,   // Plain text message or simple HTML
    };

    console.log('📧 Sending email with params:', { to, subject, templateType });
    console.log('📧 Config:', { serviceId: config.serviceId, templateId: config.templateId });

    // @ts-ignore - EmailJS types
    if (window.emailjs) {
      // @ts-ignore
      const response = await window.emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        config.publicKey
      );
      console.log('📧 EmailJS Response:', response);
    } else {
      console.error('❌ EmailJS not loaded!');
      return { success: false, message: 'EmailJS not loaded. Please refresh the page.' };
    }

    // Store in history
    const emailHistory = JSON.parse(localStorage.getItem('email_history') || '[]');
    emailHistory.unshift({
      id: Date.now(),
      to,
      subject,
      htmlContent,
      templateType,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    localStorage.setItem('email_history', JSON.stringify(emailHistory.slice(0, 50)));

    return {
      success: true,
      message: 'Email sent successfully!'
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: `Failed to send email: ${error}`
    };
  }
};

// Helper functions
export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<{ success: boolean; message: string }> => {
  // Send plain text message - the EmailJS template will handle the design
  const message = `Welcome to Fleet Guardian AI!

Hello ${data.userName}! 👋

Thank you for joining Fleet Guardian AI - the most advanced AI-powered fleet management platform.

Your Account Details:
• Email: ${data.userEmail}
• Role: ${data.role}
• Registered: ${data.registrationDate}

What you can do:
🚗 Real-time Fleet Monitoring
🤖 AI-Powered Predictions
📊 Advanced Analytics
🔔 Smart Alerts

Get started by logging into your dashboard!

Best regards,
Fleet Guardian AI Team`;

  return sendEmail(
    data.userEmail,
    '🎉 Welcome to Fleet Guardian AI!',
    message,
    'welcome'
  );
};

export const sendVehicleReportEmail = async (data: VehicleReportEmailData): Promise<{ success: boolean; message: string }> => {
  // Build plain text report
  const vehicleList = data.vehicleDetails.map(v => 
    `• ${v.name} (${v.licensePlate}) - Health: ${v.healthScore}% - Status: ${v.status.toUpperCase()}`
  ).join('\n');

  const message = `Fleet Health Report - ${data.reportDate}

Hello ${data.userName}!

Here's your fleet health summary:

📊 Fleet Overview:
• Total Vehicles: ${data.totalVehicles}
• Healthy: ${data.healthyVehicles} ✅
• Warning: ${data.warningVehicles} ⚠️
• Critical: ${data.criticalVehicles} 🚨

🏥 Overall Fleet Health: ${data.fleetHealthScore}%

${data.topIssues.length > 0 ? `⚠️ Top Issues:\n${data.topIssues.map(i => `• ${i}`).join('\n')}\n` : ''}
🚗 Vehicle Details:
${vehicleList}

View your full dashboard for more details.

Best regards,
Fleet Guardian AI Team`;

  return sendEmail(
    data.userEmail,
    `📊 Fleet Health Report - ${data.reportDate}`,
    message,
    'report'
  );
};

export const sendAlertEmail = async (data: AlertEmailData): Promise<{ success: boolean; message: string }> => {
  const priority = data.alertType === 'critical' ? '🚨 CRITICAL' : data.alertType === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO';
  
  const message = `${priority} ALERT

Vehicle: ${data.vehicleName}
License Plate: ${data.licensePlate}
Time: ${data.alertTime}

Alert: ${data.alertTitle}

Details:
${data.alertMessage}

✅ Recommended Action:
${data.recommendedAction}

Please take appropriate action immediately.

Best regards,
Fleet Guardian AI Alert System`;

  return sendEmail(
    data.userEmail,
    `${data.alertType === 'critical' ? '🚨' : data.alertType === 'warning' ? '⚠️' : 'ℹ️'} ${data.alertType.toUpperCase()} Alert: ${data.vehicleName} - ${data.alertTitle}`,
    message,
    'alert'
  );
};

// Get email history
export const getEmailHistory = () => {
  return JSON.parse(localStorage.getItem('email_history') || '[]');
};

// Clear email history
export const clearEmailHistory = () => {
  localStorage.removeItem('email_history');
};

// Test function to send welcome email
export const sendTestWelcomeEmail = async (email: string = 'jayakrishna0023@gmail.com'): Promise<{ success: boolean; message: string }> => {
  const testData: WelcomeEmailData = {
    userName: 'Jaya Krishna',
    userEmail: email,
    registrationDate: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }),
    role: 'Fleet Manager',
  };
  
  console.log('📧 Sending test welcome email to:', email);
  const result = await sendWelcomeEmail(testData);
  console.log('📧 Email result:', result);
  return result;
};

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).sendTestWelcomeEmail = sendTestWelcomeEmail;
  (window as any).sendWelcomeEmail = sendWelcomeEmail;
  (window as any).sendVehicleReportEmail = sendVehicleReportEmail;
  (window as any).sendAlertEmail = sendAlertEmail;
}
