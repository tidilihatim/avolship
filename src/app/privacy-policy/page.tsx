"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail, AlertCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section 
        className="bg-[#1c2d51] pt-24 pb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="inline-flex items-center mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link 
                href="/" 
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </motion.div>

            <motion.div
              className="flex items-center justify-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-[#f37922] rounded-full flex items-center justify-center mr-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Privacy Policy
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-white/80 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Your privacy is important to us. This policy explains how Avolship collects, uses, and protects your information.
            </motion.p>

            <motion.div
              className="mt-6 text-white/60 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Content */}
      <motion.section 
        className="py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Quick Overview */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm mb-8 border-l-4 border-[#f37922]"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-[#f37922]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Eye className="h-6 w-6 text-[#f37922]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1c2d51] mb-3">Quick Overview</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Avolship is committed to protecting your privacy. We collect only the information necessary to provide our logistics and fulfillment services, and we never sell your personal data to third parties.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Information We Collect */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm mb-8"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1c2d51] mb-4">Information We Collect</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Personal Information</h3>
                      <p className="text-gray-600 mb-2">When you create an account or use our services, we collect:</p>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Name, email address, and contact information</li>
                        <li>• Business details and shipping addresses</li>
                        <li>• Payment information (processed securely through third-party providers)</li>
                        <li>• Communication preferences</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Business Information</h3>
                      <p className="text-gray-600 mb-2">To provide logistics services, we collect:</p>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Product catalog and inventory data</li>
                        <li>• Order and shipping information</li>
                        <li>• Warehouse and fulfillment preferences</li>
                        <li>• Integration data from connected platforms (Shopify, WooCommerce, etc.)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Usage Information</h3>
                      <p className="text-gray-600 mb-2">We automatically collect:</p>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• IP address and browser information</li>
                        <li>• Platform usage patterns and preferences</li>
                        <li>• Performance data and error logs</li>
                        <li>• Device and location information (when permitted)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* How We Use Information */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm mb-8"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1c2d51] mb-4">How We Use Your Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Service Delivery</h3>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Process and fulfill orders across multiple warehouses</li>
                        <li>• Provide real-time tracking and delivery updates</li>
                        <li>• Manage inventory and optimize logistics operations</li>
                        <li>• Facilitate communication between all parties</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Platform Improvement</h3>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Analyze usage patterns to enhance user experience</li>
                        <li>• Develop new features and optimize existing ones</li>
                        <li>• Ensure platform security and prevent fraud</li>
                        <li>• Provide customer support and troubleshooting</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Communication</h3>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Send service notifications and updates</li>
                        <li>• Provide customer support responses</li>
                        <li>• Share relevant product updates (with consent)</li>
                        <li>• Comply with legal requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Data Sharing */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm mb-8"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1c2d51] mb-4">Data Sharing and Disclosure</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-[#f37922]/5 border border-[#f37922]/20 rounded-lg p-4">
                      <p className="text-[#1c2d51] font-semibold mb-2">🔒 We never sell your personal data</p>
                      <p className="text-gray-600 text-sm">Your information is only shared when necessary to provide our services or as required by law.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Service Providers</h3>
                      <p className="text-gray-600 mb-2">We share data with trusted partners to deliver our services:</p>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Shipping carriers and logistics partners</li>
                        <li>• Payment processors and financial institutions</li>
                        <li>• Cloud hosting and data storage providers</li>
                        <li>• Customer support and communication tools</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Legal Requirements</h3>
                      <p className="text-gray-600 mb-2">We may disclose information when required by law or to:</p>
                      <ul className="text-gray-600 space-y-1 pl-4">
                        <li>• Comply with legal processes and government requests</li>
                        <li>• Protect our rights, property, or safety</li>
                        <li>• Prevent fraud or illegal activities</li>
                        <li>• Enforce our terms of service</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Your Rights */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm mb-8"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-[#f37922]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Shield className="h-6 w-6 text-[#f37922]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1c2d51] mb-4">Your Rights and Choices</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Access and Control</h3>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>• View and update your personal information</li>
                        <li>• Download your data in a portable format</li>
                        <li>• Delete your account and associated data</li>
                        <li>• Opt out of marketing communications</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">Data Protection</h3>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>• Request correction of inaccurate data</li>
                        <li>• Restrict processing of your information</li>
                        <li>• Object to certain data processing</li>
                        <li>• File complaints with regulatory authorities</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div 
              className="bg-[#1c2d51] rounded-xl p-8 text-white"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-[#f37922] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                  <p className="text-white/80 mb-4">
                    If you have questions about this privacy policy or how we handle your data, please contact us:
                  </p>
                  
                  <div className="space-y-2 text-white/90">
                    <p><strong>Email:</strong> privacy@avolship.com</p>
                    <p><strong>Address:</strong> Avolship Privacy Team, [Your Business Address]</p>
                    <p><strong>Phone:</strong> [Your Contact Number]</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white/70 text-sm">
                      This policy may be updated periodically. We'll notify you of significant changes via email or platform notifications.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>
    </div>
  );
}