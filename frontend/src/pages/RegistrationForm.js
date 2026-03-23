import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerTeam } from '../api';
import { QRCodeCanvas } from 'qrcode.react';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGhostLock, setShowGhostLock] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    p1Name: '', p1Contact: '', p1Email: '', p1College: '', p1YearBranch: '',
    p2Name: '', p2Contact: '', p2Email: '', p2College: '', p2YearBranch: '',
    paymentMethod: 'UPI',
    transactionId: ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validators = {
    teamName: v => v.trim() ? '' : 'Team name is required',
    p1Name: v => v.trim() ? '' : 'Full name is required',
    p1Contact: v => /^[6-9]\d{9}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit mobile number',
    p1Email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address',
    p1College: v => v.trim() ? '' : 'College name is required',
    p1YearBranch: v => v.trim() ? '' : 'Year & Branch is required',
    p2Name: v => v.trim() ? '' : 'Full name is required',
    p2Contact: v => /^[6-9]\d{9}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit mobile number',
    p2Email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address',
    p2College: v => v.trim() ? '' : 'College name is required',
    p2YearBranch: v => v.trim() ? '' : 'Year & Branch is required',
    transactionId: v => v.trim().length >= 6 ? '' : 'Enter a valid transaction ID (min 6 chars)',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validators[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validators[name](value) }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, screenshot: 'Only JPEG/PNG files are allowed' }));
      setScreenshot(null);
    } else {
      setFieldErrors(prev => ({ ...prev, screenshot: '' }));
      setScreenshot(file);
    }
  };

  const validateAll = () => {
    const errors = {};
    let valid = true;
    Object.keys(validators).forEach(key => {
      const msg = validators[key](formData[key] || '');
      if (msg) { errors[key] = msg; valid = false; }
    });
    if (!screenshot) { errors.screenshot = 'Payment screenshot is required'; valid = false; }
    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      setError('Please fix the errors above before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('screenshot', screenshot);
      await registerTeam(data);
      setSuccess('REGISTRATION SUCCESSFUL');
      setShowGhostLock(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? <span className="field-error">⚠ {fieldErrors[name]}</span> : null;

  if (showGhostLock) {
    return (
      <div className="reg-page">
        <div className="vignette"></div>
        <div className="ghost-lock-screen fade-in">
          <div className="glitch-overlay"></div>
          <h1 className="ghost-title flicker">LOCKED BY THE GHOST LEADER</h1>
          <div className="ghost-visual"><span className="lock-icon">🔒</span></div>
          <p className="ghost-msg">Your entry has been intercepted. The temporal gates are sealed.</p>
          <p className="ghost-submsg">Wait for the shadows to clear. Do not exit this reality.</p>
          <button className="k-btn" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>BACK TO LANDING</button>
        </div>
        <style jsx>{`
          .ghost-lock-screen { z-index: 10; text-align: center; max-width: 600px; color: var(--red-glow); padding: 2rem; position: relative; }
          .ghost-title { font-family: var(--horror); font-size: 3.5rem; margin-bottom: 2rem; text-shadow: 0 0 15px var(--red); }
          .ghost-visual { font-size: 5rem; margin-bottom: 2rem; animation: pulse-red 2s infinite; }
          .ghost-msg { font-family: var(--mono); font-size: 1.2rem; margin-bottom: 1rem; letter-spacing: 0.1em; }
          .ghost-submsg { font-family: var(--sans); font-size: 0.9rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.2em; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className="vignette"></div>
      <div className="reg-container fade-in">
        <h2 className="reg-form-title flicker">TEAM REGISTRATION</h2>

        <form onSubmit={handleSubmit} className="reg-form" noValidate>
          {/* ── Section 1: Team Details ── */}
          <section className="reg-section">
            <h3 className="section-title">📂 Section 1: Team Details</h3>

            <div className="input-group">
              <label className="k-label">Team Name *</label>
              <input type="text" name="teamName" className={`k-input ${fieldErrors.teamName ? 'input-err' : ''}`} placeholder="Enter team name" onChange={handleChange} />
              <FieldError name="teamName" />
            </div>

            <div className="participant-grid">
              <div className="participant-box">
                <h4 className="p-title">Participant 1 (Lead)</h4>
                <div className="input-group">
                  <input type="text" name="p1Name" className={`k-input ${fieldErrors.p1Name ? 'input-err' : ''}`} placeholder="Full Name *" onChange={handleChange} />
                  <FieldError name="p1Name" />
                </div>
                <div className="input-group">
                  <input type="tel" name="p1Contact" className={`k-input ${fieldErrors.p1Contact ? 'input-err' : ''}`} placeholder="Contact Number (10-digit) *" maxLength={10} onChange={handleChange} />
                  <FieldError name="p1Contact" />
                </div>
                <div className="input-group">
                  <input type="email" name="p1Email" className={`k-input ${fieldErrors.p1Email ? 'input-err' : ''}`} placeholder="Email Address *" onChange={handleChange} />
                  <FieldError name="p1Email" />
                </div>
                <div className="input-group">
                  <input type="text" name="p1College" className={`k-input ${fieldErrors.p1College ? 'input-err' : ''}`} placeholder="College / Institute *" onChange={handleChange} />
                  <FieldError name="p1College" />
                </div>
                <div className="input-group">
                  <input type="text" name="p1YearBranch" className={`k-input ${fieldErrors.p1YearBranch ? 'input-err' : ''}`} placeholder="Year & Branch (e.g. 2nd CSE) *" onChange={handleChange} />
                  <FieldError name="p1YearBranch" />
                </div>
              </div>

              <div className="participant-box">
                <h4 className="p-title">Participant 2</h4>
                <div className="input-group">
                  <input type="text" name="p2Name" className={`k-input ${fieldErrors.p2Name ? 'input-err' : ''}`} placeholder="Full Name *" onChange={handleChange} />
                  <FieldError name="p2Name" />
                </div>
                <div className="input-group">
                  <input type="tel" name="p2Contact" className={`k-input ${fieldErrors.p2Contact ? 'input-err' : ''}`} placeholder="Contact Number (10-digit) *" maxLength={10} onChange={handleChange} />
                  <FieldError name="p2Contact" />
                </div>
                <div className="input-group">
                  <input type="email" name="p2Email" className={`k-input ${fieldErrors.p2Email ? 'input-err' : ''}`} placeholder="Email Address *" onChange={handleChange} />
                  <FieldError name="p2Email" />
                </div>
                <div className="input-group">
                  <input type="text" name="p2College" className={`k-input ${fieldErrors.p2College ? 'input-err' : ''}`} placeholder="College / Institute *" onChange={handleChange} />
                  <FieldError name="p2College" />
                </div>
                <div className="input-group">
                  <input type="text" name="p2YearBranch" className={`k-input ${fieldErrors.p2YearBranch ? 'input-err' : ''}`} placeholder="Year & Branch (e.g. 2nd CSE) *" onChange={handleChange} />
                  <FieldError name="p2YearBranch" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Payment ── */}
          <section className="reg-section">
            <h3 className="section-title">📂 Section 2: Payment Confirmation</h3>
            <p className="fee-notice">Entry Fee: <span className="red-glow-text">₹100</span> — Scan any QR below to pay</p>

            {/* Dual QR Scanner */}
            <div className="dual-qr-container fade-in">
              {/* QR 1 – Yash Bawari */}
              <div className="upi-card">
                <div className="upi-header">
                  <div className="upi-logo-circle">Y</div>
                  <div className="upi-user-info">
                    <div className="upi-name">Yash Bawari</div>
                    <div className="upi-id">yashbawari182006@okaxis</div>
                  </div>
                </div>
                <div className="qr-box">
                  <QRCodeCanvas
                    value="upi://pay?pa=yashbawari182006@okaxis&pn=Yash%20Bawari&am=100&cu=INR"
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="upi-footer">
                  <div className="upi-amount">Amount: ₹100.00</div>
                  <div className="upi-hint">Scan to pay with any UPI app</div>
                </div>
              </div>

              <div className="qr-divider">OR</div>

              {/* QR 2 – Shravani Khanvilkar */}
              <div className="upi-card">
                <div className="upi-header">
                  <div className="upi-logo-circle" style={{ background: '#1a4a2a' }}>S</div>
                  <div className="upi-user-info">
                    <div className="upi-name">Shravani Khanvilkar</div>
                    <div className="upi-id">khanvilkarshravani2006@oksbi</div>
                  </div>
                </div>
                <div className="qr-box">
                  <QRCodeCanvas
                    value="upi://pay?pa=khanvilkarshravani2006@oksbi&pn=Shravani%20Khanvilkar&am=100&cu=INR"
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="upi-footer">
                  <div className="upi-amount">Amount: ₹100.00</div>
                  <div className="upi-hint">Scan to pay with any UPI app</div>
                </div>
              </div>
            </div>

            <div className="payment-grid" style={{ marginTop: '1.5rem' }}>
              <div className="input-group">
                <label className="k-label">Payment Method</label>
                <div className="k-input readonly-payment">UPI ONLY</div>
              </div>

              <div className="input-group">
                <label className="k-label">Transaction ID / Reference No. *</label>
                <input type="text" name="transactionId" className={`k-input ${fieldErrors.transactionId ? 'input-err' : ''}`} placeholder="Enter Transaction ID" onChange={handleChange} />
                <FieldError name="transactionId" />
              </div>

              <div className="input-group full-width">
                <label className="k-label">Upload Payment Screenshot (JPEG/PNG) *</label>
                <input type="file" accept="image/jpeg,image/png,image/jpg" className="k-input file-input" onChange={handleFileChange} />
                <FieldError name="screenshot" />
              </div>
            </div>
          </section>

          {error && <div className="k-error">{error}</div>}
          {success && <div className="k-success">{success}</div>}

          <div className="form-actions">
            <button type="submit" className="k-btn full" disabled={loading}>
              {loading ? 'SUBMITTING...' : 'SUBMIT REGISTRATION'}
            </button>
            <p className="back-link" onClick={() => navigate('/')}>Back to Landing</p>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input-group { display: flex; flex-direction: column; gap: 0.2rem; }
        .input-err { border-color: var(--red) !important; box-shadow: 0 0 6px rgba(255,0,0,0.4); }
        .field-error { font-family: var(--mono); font-size: 0.65rem; color: #ff4444; letter-spacing: 0.05em; }

        .dual-qr-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem 1rem;
          background: rgba(20, 0, 0, 0.4);
          border: 1px dashed var(--red-dim);
          border-radius: 8px;
          flex-wrap: wrap;
        }
        .qr-divider {
          font-family: var(--mono);
          font-size: 1rem;
          color: var(--red-glow);
          letter-spacing: 0.2em;
          padding: 0 0.5rem;
        }
        .upi-card {
          background: white;
          color: #333;
          padding: 1.25rem;
          border-radius: 12px;
          width: 220px;
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .upi-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.65rem;
        }
        .upi-logo-circle {
          background: #3a2060;
          color: white;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 1.1rem;
          flex-shrink: 0;
        }
        .upi-name { font-weight: 600; font-size: 0.9rem; color: #111; }
        .upi-id { font-size: 0.65rem; color: #666; word-break: break-all; }
        .qr-box { background: white; padding: 0.4rem; border-radius: 8px; margin-bottom: 0.75rem; }
        .upi-footer { text-align: center; width: 100%; }
        .upi-amount { font-weight: 600; font-size: 1rem; color: #111; margin-bottom: 0.2rem; }
        .upi-hint { font-size: 0.65rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }

        .readonly-payment {
          display: flex; align-items: center;
          background: rgba(255,0,0,0.1);
          color: var(--red-glow);
          font-weight: bold;
          border: 1px solid var(--red-dim);
        }

        @media (max-width: 768px) {
          .reg-container { padding: 1.5rem; margin: 1rem; width: calc(100% - 2rem); }
          .participant-grid { grid-template-columns: 1fr; }
          .reg-form-title { font-size: 2rem; }
          .section-title { font-size: 1.1rem; }
          .dual-qr-container { flex-direction: column; }
          .qr-divider { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
};

export default RegistrationForm;
