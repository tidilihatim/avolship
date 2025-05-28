import React from 'react';
import { useTranslations } from 'next-intl';
import RegistrationForm from '@/components/forms/registeration-form';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { get } from 'http';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Register | AvolShip',
};

export default async function RegisterPage() {
  const t = await getTranslations('register');
  const session = await getServerSession(authOptions);

  if(session?.user?.id){
    // redirect to dashboard in future
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full py-16 px-4 sm:px-6 bg-white"> {/* Simplified background */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12"> {/* Increased margin for better spacing */}
          <h1 className="text-4xl font-bold text-[#1c2d51] mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12"> {/* Increased gap */}
          {/* Left Column - Feature Cards */}
          <div className="lg:col-span-1 flex flex-col gap-8"> {/* Increased gap */}
            <div className="bg-white rounded-xl p-8 shadow-md border border-[#e3e4e8] group hover:border-[#f37922] transition-all"> {/* Increased padding and more subtle shadow */}
              <div className="p-3 bg-[#1c2d51] text-white w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:bg-[#f37922] transition-all"> {/* Increased margin */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h10"></path>
                  <path d="M9 19l-7-7 7-7"></path>
                  <path d="M12 5v14"></path>
                  <path d="M16 9l3 3-3 3"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#1c2d51]">{t('realTimeTracking')}</h2> {/* Increased margin */}
              <p className="text-gray-600">{t('trackingDesc')}</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md border border-[#e3e4e8] group hover:border-[#f37922] transition-all"> {/* Increased padding and more subtle shadow */}
              <div className="p-3 bg-[#1c2d51] text-white w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:bg-[#f37922] transition-all"> {/* Increased margin */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                  <circle cx="12" cy="12" r="2"></circle>
                  <path d="M6 12h.01M18 12h.01"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#1c2d51]">{t('orderAutomation')}</h2> {/* Increased margin */}
              <p className="text-gray-600">{t('automationDesc')}</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md border border-[#e3e4e8] group hover:border-[#f37922] transition-all lg:block hidden"> {/* Increased padding and more subtle shadow */}
              <div className="p-3 bg-[#1c2d51] text-white w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:bg-[#f37922] transition-all"> {/* Increased margin */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M6 8h.01"></path>
                  <path d="M12 8h.01"></path>
                  <path d="M18 8h.01"></path>
                  <path d="M6 12h.01"></path>
                  <path d="M12 12h.01"></path>
                  <path d="M18 12h.01"></path>
                  <path d="M6 16h.01"></path>
                  <path d="M12 16h.01"></path>
                  <path d="M18 16h.01"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#1c2d51]">{t('multiCountry')}</h2> {/* Increased margin */}
              <p className="text-gray-600">{t('multiCountryDesc')}</p>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:col-span-2">
            <RegistrationForm />

            <div className="mt-10 text-center text-sm text-gray-500"> {/* Increased margin */}
              {t('termsText')}{' '}
              <Link href="/terms" className="text-[#f37922] hover:underline font-semibold"> {/* Use orange for emphasis */}
                {t('termsLink')}
              </Link>{' '}
              {t('andText')}{' '}
              <Link href="/privacy" className="text-[#f37922] hover:underline font-semibold"> {/* Use orange for emphasis */}
                {t('privacyLink')}
              </Link>
            </div>
          </div>

          {/* Mobile Features - Only visible on small screens */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"> {/* Increased margin */}
            <div className="bg-white rounded-xl p-8 shadow-md border border-[#e3e4e8] group hover:border-[#f37922] transition-all"> {/* Increased padding and more subtle shadow */}
              <div className="p-3 bg-[#1c2d51] text-white w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:bg-[#f37922] transition-all"> {/* Increased margin */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M6 8h.01"></path>
                  <path d="M12 8h.01"></path>
                  <path d="M18 8h.01"></path>
                  <path d="M6 12h.01"></path>
                  <path d="M12 12h.01"></path>
                  <path d="M18 12h.01"></path>
                  <path d="M6 16h.01"></path>
                  <path d="M12 16h.01"></path>
                  <path d="M18 16h.01"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#1c2d51]">{t('multiCountry')}</h2> {/* Increased margin */}
              <p className="text-gray-600">{t('multiCountryDesc')}</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md border border-[#e3e4e8] group hover:border-[#f37922] transition-all"> {/* Increased padding and more subtle shadow */}
              <div className="p-3 bg-[#1c2d51] text-white w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:bg-[#f37922] transition-all"> {/* Increased margin */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#1c2d51]">{t('paymentTracking')}</h2> {/* Increased margin */}
              <p className="text-gray-600">{t('paymentDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}