"use client";

import React, { useState, useEffect, useRef } from 'react';

const AnimatedNavLink = ({ id, href, children, isActive = false }: { id: string; href: string; children: React.ReactNode; isActive?: boolean }) => {
  const defaultTextColor = isActive ? 'text-white' : 'text-gray-300';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-xs md:text-sm font-medium';

  return (
    <a
      href={href}
      data-id={id}
      className={`nav-pill group relative inline-flex items-center justify-center h-8 px-3 py-1 rounded-full hover:bg-white/10 transition-all duration-200 ${textSizeClass} whitespace-nowrap`}
    >
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className={`h-8 flex items-center justify-center ${defaultTextColor}`}>{children}</span>
        <span className={`h-8 flex items-center justify-center ${hoverTextColor}`}>{children}</span>
      </div>
    </a>
  );
};

interface NavbarProps {
  sections?: Array<{ id: string; label: string; href: string }>;
  activeSection?: string;
}

export function Navbar({ sections = [], activeSection = '' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const [currentActiveSection, setCurrentActiveSection] = useState(activeSection);
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Listen for section changes from scroll
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setCurrentActiveSection(event.detail.activeSection);
    };

    window.addEventListener('sectionChange', handleSectionChange as EventListener);
    return () => {
      window.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, []);

  const logoElement = (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
    </div>
  );

  const handleSectionClick = (_e: React.MouseEvent<HTMLAnchorElement>, _sectionId: string) => {};

  const homeButtonElement = (
    <a
      href="/"
      className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-200 rounded-full hover:border-white/60 hover:text-white transition-colors duration-200 w-full sm:w-auto"
    >
      Home
    </a>
  );

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       px-6 py-4 backdrop-blur-sm
                       ${headerShapeClass}
                       border border-[#333] bg-[#1f1f1f57]
                       w-[calc(100%-2rem)] max-w-[1400px] min-w-[1000px] overflow-hidden
                       transition-[border-radius] duration-0 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-1 text-sm flex-wrap justify-center flex-1 mx-4">
          {sections.map((section) => (
            <AnimatedNavLink 
              key={section.id} 
              id={section.id}
              href={section.href}
              isActive={currentActiveSection === section.id}
            >
              {section.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {homeButtonElement}
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-3 text-base w-full">
          {sections.map((section) => (
            <a 
              key={section.id} 
              href={section.href}
              data-id={section.id}
              className={`nav-pill transition-colors w-full text-center px-4 py-2 rounded-full hover:bg-white/10 ${
                currentActiveSection === section.id ? 'text-white bg-white/20' : 'text-gray-300 hover:text-white'
              }`}
              onClick={(e) => handleSectionClick(e, section.id)}
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {homeButtonElement}
        </div>
      </div>
    </header>
  );
}
