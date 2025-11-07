import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { loginUser } from '../../store/slices/AuthSlice';
import { FaEnvelope, FaLock, FaSignInAlt, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './LandingPage.css'

const LandingPage = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle auth errors from Redux store
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsSubmitting(false);
    }
  }, [authError]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: any) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setMenuOpen(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await dispatch(loginUser(credentials) as any);
      
      if (result.error) {
        return;
      }
      
      // If login successful, close modal
      setShowLoginModal(false);
    } catch (error) {
      console.error('Login failed:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials({ ...credentials, [field]: value });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    setError('');
    setCredentials({ email: '', password: '' });
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setError('');
  };

  // Show loading if checking authentication or logging in
  if (loading && !isSubmitting) {
    return (
      <div className="login-modal-overlay">
        <div className="login-modal">
          <div className="loading">
            <div className="spinner"></div>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeLoginModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeLoginModal}>
              <FaTimes />
            </button>
            
            <div className="login-modal-header">
              <h1 className="login-modal-title">T&T VisionDesk</h1>
              <p className="login-modal-subtitle">Progress tracking made easy</p>
            </div>
            
            {error && (
              <div className="login-error-message">
                <FaExclamationTriangle className="error-icon" />
                <div className="error-content">
                  <strong>Login Failed </strong>
                  <span>{error}</span>
                </div>
                <button 
                  onClick={() => setError('')} 
                  className="error-close"
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}
            
            <form onSubmit={handleLoginSubmit} className="login-modal-form">
              <div className="form-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="form-input"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              
              <div className="form-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="form-input"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`login-submit-btn ${isSubmitting ? 'loading' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="btn-icon" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="demo-accounts">
              <h3>Demo Accounts:</h3>
              <div className="demo-account-item">
                <strong>Admin:</strong> admin@visiondesk.com / password
              </div>
              <div className="demo-account-item">
                <strong>Manager:</strong> manager@visiondesk.com / password
              </div>
              <div className="demo-account-item">
                <strong>Employee:</strong> dev@visiondesk.com / password
              </div>
              <div className="demo-account-item">
                <strong>Client:</strong> client@company.com / password
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header/Navigation */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="logo">
            <h2>T&T VisionDesk</h2>
          </div>
          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <ul>
              <li>
                <button 
                  className="login-button"
                  onClick={openLoginModal}
                >
                  Login
                </button>
              </li>
              <li><a 
                href="#home" 
                className={activeSection === 'home' ? 'active' : ''}
                onClick={() => scrollToSection('home')}
              >Home</a></li>
              <li><a 
                href="#about" 
                className={activeSection === 'about' ? 'active' : ''}
                onClick={() => scrollToSection('about')}
              >About</a></li>
              <li><a 
                href="#services" 
                className={activeSection === 'services' ? 'active' : ''}
                onClick={() => scrollToSection('services')}
              >Services</a></li>
              <li><a 
                href="#contact" 
                className={activeSection === 'contact' ? 'active' : ''}
                onClick={() => scrollToSection('contact')}
              >Contact</a></li>
            </ul>
          </nav>
          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Rest of your existing LandingPage JSX remains the same */}
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content-container">
          <div className="container">
            <div className="hero-content">
              <h1>T&T GROUP</h1>
              <p className="hero-subtitle">CLIENT NEEDS IST</p>
              <div className="hero-buttons">
                <button 
                  className="cta-button primary"
                  onClick={() => scrollToSection('services')}
                >
                  Our Services
                </button>
                <button 
                  className="cta-button secondary"
                  onClick={() => scrollToSection('contact')}
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll Down</span>
          <div className="arrow"></div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header">
            <h2>About T&T Group</h2>
            <div className="divider"></div>
          </div>
          <div className="about-content">
            <div className="about-text">
              <p>
                T&T Group is a premier consulting firm dedicated to understanding and 
                fulfilling our clients' unique requirements. With years of industry 
                experience, we've built a reputation for excellence and reliability.
              </p>
              <p>
                Our team of experts works closely with each client to develop 
                customized strategies that drive growth, efficiency, and sustainable 
                success in today's competitive business landscape.
              </p>
              <div className="about-features">
                <div className="feature">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Expertise</h3>
                  <p>Deep industry knowledge across multiple sectors</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Innovation</h3>
                  <p>Cutting-edge solutions for modern challenges</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19.4 15C19.2669 15.3031 19.1337 15.6062 19.0006 15.9094C18.5134 16.941 18.0198 17.9684 17.5199 18.9914C17.2658 19.5351 16.735 19.9094 16.1426 19.9687C14.7642 20.1039 13.3825 20.1556 12.0006 20.1234C10.6187 20.1556 9.23703 20.1039 7.85858 19.9687C7.2662 19.9094 6.73539 19.5351 6.48132 18.9914C5.47795 16.9667 4.46936 14.9446 3.45557 12.9252C3.32426 12.6508 3.25986 12.3272 3.31109 12.0094C3.36232 11.6916 3.52587 11.4007 3.77179 11.1882C6.12866 9.24215 8.55417 7.39231 11.0419 5.64375C11.3293 5.42891 11.6603 5.31573 12.0006 5.31573C12.3409 5.31573 12.6719 5.42891 12.9593 5.64375C15.447 7.39231 17.8725 9.24215 20.2294 11.1882C20.4753 11.4007 20.6389 11.6916 20.6901 12.0094C20.7413 12.3272 20.6769 12.6508 20.5456 12.9252C20.1941 13.6978 19.797 14.3489 19.4 15Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>Results</h3>
                  <p>Proven track record of delivering value</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="services-background"></div>
        <div className="container">
          <div className="section-header">
            <h2>Our Services</h2>
            <div className="divider"></div>
            <p>Comprehensive solutions tailored to your needs</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📊</div>
              <h3>Business Consulting</h3>
              <p>Strategic guidance to optimize your operations and maximize profitability.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💼</div>
              <h3>Project Management</h3>
              <p>End-to-end project oversight ensuring timely delivery and quality results.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🔧</div>
              <h3>Implementation Support</h3>
              <p>Hands-on assistance with system implementations and process improvements.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📈</div>
              <h3>Growth Strategy</h3>
              <p>Data-driven approaches to expand your market presence and revenue streams.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>150+</h3>
              <p>Projects Completed</p>
            </div>
            <div className="stat-item">
              <h3>50+</h3>
              <p>Satisfied Clients</p>
            </div>
            <div className="stat-item">
              <h3>12+</h3>
              <p>Years Experience</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Client Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <div className="divider"></div>
            <p>Get in touch to discuss how we can help your business</p>
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get In Touch</h3>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <h4>Address</h4>
                  <p>46 Corridor Hill Langa Crescent Witbank, eMalahleni 1034</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>Phone</h4>
                  <p>+27 75 245 3432</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h4>Email</h4>
                  <p>admin@tandtgroup.co.za</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕒</span>
                <div>
                  <h4>Business Hours</h4>
                  <p>Mon - Fri: 8am - 4pm</p>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Subject" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" required></textarea>
                </div>
                <button type="submit" className="submit-button">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>T&T GROUP</h3>
              <p>Delivering exceptional solutions that meet our clients' unique needs and drive sustainable success.</p>
              <div className="social-links">
                <a href="#" aria-label="LinkedIn">LinkedIn</a>
                <a href="#" aria-label="Twitter">Twitter</a>
                <a href="#" aria-label="Facebook">Facebook</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home" onClick={() => scrollToSection('home')}>Home</a></li>
                <li><a href="#about" onClick={() => scrollToSection('about')}>About</a></li>
                <li><a href="#services" onClick={() => scrollToSection('services')}>Services</a></li>
                <li><a href="#contact" onClick={() => scrollToSection('contact')}>Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Our Services</h4>
              <ul>
                <li><a href="#">Business Consulting</a></li>
                <li><a href="#">Project Management</a></li>
                <li><a href="#">Implementation Support</a></li>
                <li><a href="#">Growth Strategy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Newsletter</h4>
              <p>Subscribe to our newsletter for the latest updates.</p>
              <div className="newsletter-form">
                <input type="email" placeholder="Your email address" />
                <button type="submit">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} T&T Group. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;