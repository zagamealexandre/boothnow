'use client';
import React from 'react';
import Image from 'next/image'
import { LinkedinIcon, InstagramIcon } from 'lucide-react';

export function Footer() {
	return (
		<footer className="w-full bg-[#2F3E5C] text-white">
			<div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
					{/* ABOUT KUBO Column */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold uppercase tracking-wide">ABOUT KUBO</h3>
						<ul className="space-y-2">
							<li>
								<a href="/company" className="text-sm hover:text-gray-300 transition-colors">
									Company
								</a>
							</li>
							<li>
								<a href="/contact" className="text-sm hover:text-gray-300 transition-colors">
									Contact
								</a>
							</li>
						</ul>
					</div>

					{/* PRODUCT Column */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold uppercase tracking-wide">PRODUCT</h3>
						<ul className="space-y-2">
							<li>
								<a href="/download" className="text-sm hover:text-gray-300 transition-colors">
									Download the app
								</a>
							</li>
							<li>
								<a href="/support" className="text-sm hover:text-gray-300 transition-colors">
									Customer service
								</a>
							</li>
						</ul>
					</div>

					{/* KUBO Logo and Social Media Column */}
					<div className="space-y-6 flex flex-col items-center md:items-start">
						{/* KUBO Logo */}
						<div className="flex items-center">
							<div className="kubo-logo-footer">
								<Image
									src="/images/kubologofooter.svg"
									alt="Kubo"
									width={120}
									height={32}
									priority={false}
								/>
							</div>
						</div>

						{/* Social Media Icons */}
						<div className="flex space-x-4">
							<a href="#" className="hover:text-gray-300 transition-colors">
								<LinkedinIcon className="w-5 h-5" />
							</a>
							<a href="#" className="hover:text-gray-300 transition-colors">
								<InstagramIcon className="w-5 h-5" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};