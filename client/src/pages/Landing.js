import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#101418] mx-auto"></div>
          <p className="mt-4 text-[#5c728a]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" style={{fontFamily: '"Public Sans", "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#eaedf1] px-4 py-0">
          <div className="flex items-center gap-4 text-[#101418]">
            <div className="size-20">
              <img src="/selfky-logo.png" alt="Selfky Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-[#101418] text-sm font-medium leading-normal" href="#contact">Contact Us</a>
            </div>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#dce7f3] text-[#101418] text-sm font-bold leading-normal tracking-[0.015em]"
                  >
                    <span className="truncate">Dashboard</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#dce7f3] text-[#101418] text-sm font-bold leading-normal tracking-[0.015em]">
                      <span className="truncate">Log In</span>
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#eaedf1] text-[#101418] text-sm font-bold leading-normal tracking-[0.015em]">
                      <span className="truncate">Sign Up</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Full Screen Hero Section */}
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4"
             style={{
               backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%), url("/hero-bg.jpg")',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundRepeat: 'no-repeat'
             }}>
          <div className="flex flex-col gap-6 items-center justify-center text-center max-w-4xl mx-auto">
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-white text-5xl font-black leading-tight tracking-[-0.033em] md:text-6xl lg:text-7xl">
                Simplify Your Application Journey
              </h1>
              <h2 className="text-white text-lg font-normal leading-normal md:text-xl lg:text-2xl max-w-3xl">
                Selfky is your all-in-one platform for managing and submitting applications with ease. From forms to documents, we've got you covered.
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 md:h-14 md:px-8 bg-[#dce7f3] text-[#101418] text-base font-bold leading-normal tracking-[0.015em] md:text-lg hover:bg-[#c5d8e8] transition-colors"
                >
                  <span className="truncate">Go to Dashboard</span>
                </button>
              ) : (
                <>
                  <Link to="/login">
                    <button className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 md:h-14 md:px-8 bg-[#dce7f3] text-[#101418] text-base font-bold leading-normal tracking-[0.015em] md:text-lg hover:bg-[#c5d8e8] transition-colors">
                      <span className="truncate">Log In</span>
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 md:h-14 md:px-8 bg-[#eaedf1] text-[#101418] text-base font-bold leading-normal tracking-[0.015em] md:text-lg hover:bg-[#d4dbe2] transition-colors">
                      <span className="truncate">Sign Up</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* How It Works Section */}
            <div className="px-4 py-16 bg-white">
              <h2 className="text-[#101418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-8 text-center">How It Works</h2>
              <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
                <div className="flex flex-col items-center gap-1 pt-3">
                  <div className="text-[#101418]" data-icon="User" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
                    </svg>
                  </div>
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2 grow"></div>
                </div>
                <div className="flex flex-1 flex-col pt-3 pb-5">
                  <p className="text-[#101418] text-base font-medium leading-normal">Register and Log In with Your Email</p>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2"></div>
                  <div className="text-[#101418]" data-icon="File" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path>
                    </svg>
                  </div>
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2 grow"></div>
                </div>
                <div className="flex flex-1 flex-col pt-3 pb-5">
                  <p className="text-[#101418] text-base font-medium leading-normal">Complete the Form and Upload Necessary Documents</p>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2"></div>
                  <div className="text-[#101418]" data-icon="CreditCard" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,16V88H32V64Zm0,128H32V104H224v88Zm-16-24a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h32A8,8,0,0,1,208,168Zm-64,0a8,8,0,0,1-8,8H120a8,8,0,0,1,0-16h16A8,8,0,0,1,144,168Z"></path>
                    </svg>
                  </div>
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2 grow"></div>
                </div>
                <div className="flex flex-1 flex-col pt-3 pb-5">
                  <p className="text-[#101418] text-base font-medium leading-normal">Pay the Application Fee Securely</p>
                </div>
                
                <div className="flex flex-col items-center gap-1 pb-3">
                  <div className="w-[1.5px] bg-[#d4dbe2] h-2"></div>
                  <div className="text-[#101418]" data-icon="DownloadSimple" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-1 flex-col pt-3 pb-5">
                  <p className="text-[#101418] text-base font-medium leading-normal">Download Your Admit Cards</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container" id="contact">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a className="text-[#5c728a] text-base font-normal leading-normal min-w-40" href="tel:+1-555-123-4567">Contact: +1-555-123-4567</a>
                <a className="text-[#5c728a] text-base font-normal leading-normal min-w-40" href="mailto:support@selfky.com">Email: support@selfky.com</a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="https://twitter.com/selfky" target="_blank" rel="noopener noreferrer">
                  <div className="text-[#5c728a]" data-icon="TwitterLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="https://facebook.com/selfky" target="_blank" rel="noopener noreferrer">
                  <div className="text-[#5c728a]" data-icon="FacebookLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="https://instagram.com/selfky" target="_blank" rel="noopener noreferrer">
                  <div className="text-[#5c728a]" data-icon="InstagramLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-[#5c728a] text-base font-normal leading-normal">© 2024 Selfky. All rights reserved.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing; 