import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerTeam } from '../api';
import { QRCodeCanvas } from 'qrcode.react';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regLocked, setRegLocked] = useState(false);
  const [showGhostLock, setShowGhostLock] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    p1Name: '', p1Contact: '', p1Email: '', p1College: '', p1YearBranch: '',
    p2Name: '', p2Contact: '', p2Email: '', p2College: '', p2YearBranch: '',
    paymentMethod: 'UPI',
    transactionId: ''
  });
  const [screenshot, setScreenshot] = useState(null);

  React.useEffect(() => {
    const checkLock = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/health`);
        // We can just try to hit the register endpoint or a public gamestate endpoint
        // For now, let's assume the form handles the error from server if locked
      } catch (e) {}
    };
    checkLock();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (screenshot) data.append('screenshot', screenshot);
      else throw new Error('Payment screenshot is required');

      await registerTeam(data);
      setSuccess('REGISTRATION SUCCESSFUL');
      setShowGhostLock(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showGhostLock) {
    return (
      <div className="reg-page">
        <div className="vignette"></div>
        <div className="ghost-lock-screen fade-in">
          <div className="glitch-overlay"></div>
          <h1 className="ghost-title flicker">LOCKED BY THE GHOST LEADER</h1>
          <div className="ghost-visual">
            <span className="lock-icon">🔒</span>
          </div>
          <p className="ghost-msg">Your entry has been intercepted. The temporal gates are sealed.</p>
          <p className="ghost-submsg">Wait for the shadows to clear. Do not exit this reality.</p>
          <button className="k-btn" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>BACK TO LANDING</button>
        </div>

        <style jsx>{`
          .ghost-lock-screen {
            z-index: 10;
            text-align: center;
            max-width: 600px;
            color: var(--red-glow);
            padding: 2rem;
            position: relative;
          }
          .ghost-title {
            font-family: var(--horror);
            font-size: 3.5rem;
            margin-bottom: 2rem;
            text-shadow: 0 0 15px var(--red);
          }
          .ghost-visual {
            font-size: 5rem;
            margin-bottom: 2rem;
            animation: pulse-red 2s infinite;
          }
          .ghost-msg {
            font-family: var(--mono);
            font-size: 1.2rem;
            margin-bottom: 1rem;
            letter-spacing: 0.1em;
          }
          .ghost-submsg {
            font-family: var(--sans);
            font-size: 0.9rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.2em;
          }

          /* UPI Scanner Styles */
          .upi-scanner-container {
            grid-column: 1 / -1;
            display: flex;
            justify-content: center;
            margin: 1.5rem 0;
            padding: 1.5rem;
            background: rgba(20, 0, 0, 0.4);
            border: 1px dashed var(--red-dim);
            border-radius: 8px;
          }
          .upi-card {
            background: white;
            color: #333;
            padding: 1.5rem;
            border-radius: 12px;
            width: 100%;
            max-width: 320px;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .upi-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            width: 100%;
            margin-bottom: 1rem;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.75rem;
          }
          .upi-logo-circle {
            background: #5f3333;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
          }
          .upi-user-info {
            display: flex;
            flex-direction: column;
          }
          .upi-name {
            font-weight: 600;
            font-size: 1rem;
            color: #111;
          }
          .upi-id {
            font-size: 0.75rem;
            color: #666;
          }
          .qr-box {
            background: white;
            padding: 0.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }
          .upi-footer {
            text-align: center;
            width: 100%;
          }
          .upi-amount {
            font-weight: 600;
            font-size: 1.1rem;
            color: #111;
            margin-bottom: 0.25rem;
          }
          .upi-hint {
            font-size: 0.7rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .readonly-payment {
            display: flex;
            align-items: center;
            background: rgba(255, 0, 0, 0.1);
            color: var(--red-glow);
            font-weight: bold;
            border: 1px solid var(--red-dim);
          }

          @media (max-width: 768px) {
            .reg-container {
              padding: 1.5rem;
              margin: 1rem;
              width: calc(100% - 2rem);
            }
            .participant-grid {
              grid-template-columns: 1fr;
            }
            .reg-form-title {
              font-size: 2rem;
            }
            .section-title {
              font-size: 1.1rem;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className="vignette"></div>
      <div className="reg-container fade-in">
        <h2 className="reg-form-title flicker">TEAM REGISTRATION</h2>
        
        <form onSubmit={handleSubmit} className="reg-form">
          <section className="reg-section">
            <h3 className="section-title">📂 Section 1: Team Details</h3>
            
            <div className="input-group">
              <label className="k-label">Team Name</label>
              <input type="text" name="teamName" className="k-input" placeholder="Enter team name" required onChange={handleChange} />
            </div>

            <div className="participant-grid">
              <div className="participant-box">
                <h4 className="p-title">Participant 1 (Lead)</h4>
                <input type="text" name="p1Name" className="k-input" placeholder="Full Name" required onChange={handleChange} />
                <input type="text" name="p1Contact" className="k-input" placeholder="Contact Number" required onChange={handleChange} />
                <input type="email" name="p1Email" className="k-input" placeholder="Email Address" required onChange={handleChange} />
                <input type="text" name="p1College" className="k-input" placeholder="College / Institute" required onChange={handleChange} />
                <input type="text" name="p1YearBranch" className="k-input" placeholder="Year & Branch" required onChange={handleChange} />
              </div>

              <div className="participant-box">
                <h4 className="p-title">Participant 2</h4>
                <input type="text" name="p2Name" className="k-input" placeholder="Full Name" required onChange={handleChange} />
                <input type="text" name="p2Contact" className="k-input" placeholder="Contact Number" required onChange={handleChange} />
                <input type="email" name="p2Email" className="k-input" placeholder="Email Address" required onChange={handleChange} />
                <input type="text" name="p2College" className="k-input" placeholder="College / Institute" required onChange={handleChange} />
                <input type="text" name="p2YearBranch" className="k-input" placeholder="Year & Branch" required onChange={handleChange} />
              </div>
            </div>
          </section>

          <section className="reg-section">
            <h3 className="section-title">📂 Section 2: Payment Confirmation</h3>
            <p className="fee-notice">Entry Fee: <span className="red-glow-text">₹100</span></p>
            
            <div className="payment-grid">
              <div className="input-group">
                <label className="k-label">Payment Method</label>
                <div className="k-input readonly-payment">UPI ONLY</div>
              </div>

              <div className="input-group">
                <label className="k-label">Transaction ID / Reference No.</label>
                <input type="text" name="transactionId" className="k-input" placeholder="Enter ID" required onChange={handleChange} />
              </div>

              {formData.paymentMethod === 'UPI' && (
                <div className="upi-scanner-container fade-in">
                  <div className="upi-card">
                    <div className="upi-header">
                      <div className="upi-logo-circle">K</div>
                      <div className="upi-user-info">
                        <div className="upi-name">Krushal Telawane</div>
                        <div className="upi-id">krushaltelawane956@okicici</div>
                      </div>
                    </div>
                    <div className="qr-box">
                      <QRCodeCanvas 
                        value="upi://pay?pa=krushaltelawane956@okicici&pn=Krushal%20Telawane&am=100&cu=INR"
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
              )}

              <div className="input-group full-width">
                <label className="k-label">Upload Payment Screenshot (JPEG/PNG)</label>
                <input type="file" accept="image/*" className="k-input file-input" required onChange={handleFileChange} />
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
    </div>
  );
};

export default RegistrationForm;
