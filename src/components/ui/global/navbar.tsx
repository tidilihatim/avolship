'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Locale } from '@/config/locales';
import { setUserLocale } from "@/services/locale";
import { useSession } from 'next-auth/react';

interface NavbarProps {
  currentLocale: string;
}

export default function Navbar({ currentLocale }: NavbarProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLanguageChange = async (locale: Locale) => {
    await setUserLocale(locale);
    setIsLangDropdownOpen(false);
  };

  const menuItems = [
    { name: t('home'), href: '/' },
    { name: t('features'), href: '/features' },
    { name: t('pricing'), href: '/pricing' },
    { name: t('about'), href: '/about' },
    { name: t('contact'), href: '/contact' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-sm shadow-lg py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" fill="#1c2d51" />
                  <path d="M20 5L35 12.5L20 20L5 12.5L20 5Z" fill="#f37922" />
                  <path d="M20 20V35L35 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.8" />
                  <path d="M20 20V35L5 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">AvolShip</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Menu Items */}
              <div className="flex items-center space-x-6">
                {menuItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`text-sm font-medium transition-colors relative group ${
                      pathname === item.href 
                        ? 'text-[#f37922]' 
                        : 'text-gray-700 hover:text-[#f37922]'
                    }`}
                  >
                    {item.name}
                    <span 
                      className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[#f37922] transition-all duration-300 group-hover:w-full ${
                        pathname === item.href ? 'w-full' : ''
                      }`}
                    />
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                {/* Language Switcher */}
                <div className="relative">
                  <button 
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="flex items-center cursor-pointer space-x-1 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                    aria-expanded={isLangDropdownOpen}
                    aria-label="Select language"
                  >
                    <div className="w-5 h-5 relative">
                      {currentLocale === 'en' ? (
                        <img src="https://img.icons8.com/?size=100&id=t3NE3BsOAQwq&format=png&color=000000" alt="English" className="object-cover rounded-sm" />
                      ) : (
                        <img src="https://img.icons8.com/?size=100&id=YwnngGdMBmIV&format=png&color=000000" alt="Français" className="object-cover rounded-sm" />
                      )}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Language Dropdown */}
                  {isLangDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20"
                        onClick={() => setIsLangDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-30 border border-gray-100">
                        <div className="py-1">
                          <button
                            onClick={() => handleLanguageChange('en')}
                            className={`flex items-center w-full px-4 py-2 text-sm ${
                              currentLocale === 'en' ? 'bg-gray-100 text-[#f37922]' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-5 h-5 relative mr-3">
                              <img src="https://img.icons8.com/?size=100&id=t3NE3BsOAQwq&format=png&color=000000" alt="English" className="object-cover rounded-sm" />
                            </div>
                            English
                          </button>
                          <button
                            onClick={() => handleLanguageChange('fr')}
                            className={`flex items-center w-full px-4 py-2 text-sm ${
                              currentLocale === 'fr' ? 'bg-gray-100 text-[#f37922]' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-5 h-5 relative mr-3">
                              <img src="https://img.icons8.com/?size=100&id=YwnngGdMBmIV&format=png&color=000000" alt="Français" className="object-cover rounded-sm" />
                            </div>
                            Français
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Get Started Button */}
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#f37922] hover:bg-[#f37922]/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  {t('getStarted')}
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-[#f37922] hover:bg-gray-100 transition-colors focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-0 left-0 w-full bg-white shadow-xl">
            {/* Menu Items */}
            <div className="px-4 py-6 pt-20"> {/* Added pt-20 to account for navbar height */}
              <div className="flex flex-col space-y-2">
                {menuItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                      pathname === item.href 
                        ? 'bg-[#f37922]/10 text-[#f37922]' 
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Language Switcher (Mobile) */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    {t('language')}
                  </p>
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => {
                        handleLanguageChange('en');
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                        currentLocale === 'en' ? 'bg-[#f37922]/10 text-[#f37922]' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-5 h-5 relative mr-3">
                        <img src="https://img.icons8.com/?size=100&id=t3NE3BsOAQwq&format=png&color=000000" alt="English" className="object-cover rounded-sm" />
                      </div>
                      English
                    </button>
                    <button
                      onClick={() => {
                        handleLanguageChange('fr');
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                        currentLocale === 'fr' ? 'bg-[#f37922]/10 text-[#f37922]' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-5 h-5 relative mr-3">
                        <img src="https://img.icons8.com/?size=100&id=YwnngGdMBmIV&format=png&color=000000" alt="Français" className="object-cover rounded-sm" />
                      </div>
                      Français
                    </button>
                  </div>
                </div>
                
                {/* Get Started Button (Mobile) */}
                <Link
                  href="/auth/register"
                  className="mt-6 flex items-center justify-center px-4 py-3 bg-[#f37922] hover:bg-[#f37922]/90 text-white font-medium rounded-lg transition-colors shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('getStarted')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}