"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Package, Warehouse, CheckCircle, DollarSign, Shield, Zap, TrendingUp, Settings } from "lucide-react";

export default function PricingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const fees = [
    {
      icon: CheckCircle,
      title: "Confirmation Fee",
      description: "Fee charged for order verification and processing confirmation",
      price: "$0.30",
      priceDetail: "per order",
      details: "Applied per confirmed order to ensure accuracy and quality control",
      color: "bg-[#f37922]",
      colorLight: "bg-[#f37922]/10",
      colorBorder: "border-[#f37922]",
    },
    {
      icon: Warehouse,
      title: "Warehouse Fee",
      description: "Storage and inventory management fee",
      price: "$0.30",
      priceDetail: "per order",
      details: "Fee for warehousing and inventory handling services",
      color: "bg-[#1c2d51]",
      colorLight: "bg-[#1c2d51]/10",
      colorBorder: "border-[#1c2d51]",
    },
    {
      icon: Settings,
      title: "Processing Fee",
      description: "Order processing and fulfillment coordination fee",
      price: "$0.30",
      priceDetail: "per order",
      details: "Fee for order processing, picking, packing, and coordination",
      color: "bg-[#e3e438]",
      colorLight: "bg-[#e3e438]/10",
      colorBorder: "border-[#e3e438]",
    },
    {
      icon: DollarSign,
      title: "Service Fee",
      description: "Platform processing and management fee",
      price: "$0.30",
      priceDetail: "per order",
      details: "Fixed fee for each order processed through our platform",
      color: "bg-[#f37922]",
      colorLight: "bg-[#f37922]/10",
      colorBorder: "border-[#f37922]",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Transparent Pricing",
      description: "No hidden fees. You always know what you're paying for.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Quick order processing and fulfillment across multiple warehouses.",
    },
    {
      icon: TrendingUp,
      title: "Scalable Solutions",
      description: "Our pricing grows with your business. Volume discounts available.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section
        className="bg-[#1c2d51] pt-24 pb-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
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
              className="flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-20 h-20 bg-[#f37922] rounded-full flex items-center justify-center mr-4">
                <Package className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Pricing
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Simple, transparent pricing for your fulfillment needs.
              Pay only for what you use with no hidden charges.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Fee Cards */}
      <motion.section
        className="py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

            <motion.div
              className="text-center mb-12"
              variants={itemVariants}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
                Our Fee Structure
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Every order includes these transparent fees to ensure quality service
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {fees.map((fee, index) => {
                const Icon = fee.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow border-t-4"
                    variants={itemVariants}
                    style={{ borderTopColor: fee.color.replace('bg-', '') === 'bg-[#1c2d51]' ? '#1c2d51' : fee.color.replace('bg-', '') === 'bg-[#f37922]' ? '#f37922' : '#e3e438' }}
                  >
                    <div className={`w-16 h-16 ${fee.colorLight} rounded-xl flex items-center justify-center mb-6`}>
                      <Icon className={`h-8 w-8 ${fee.color.replace('bg-', 'text-')}`} style={{ color: fee.color.replace('bg-', '') === 'bg-[#1c2d51]' ? '#1c2d51' : fee.color.replace('bg-', '') === 'bg-[#f37922]' ? '#f37922' : '#e3e438' }} />
                    </div>

                    <h3 className="text-2xl font-bold text-[#1c2d51] mb-3">
                      {fee.title}
                    </h3>

                    <p className="text-gray-600 mb-6 min-h-[48px]">
                      {fee.description}
                    </p>

                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold" style={{ color: fee.color.replace('bg-', '') === 'bg-[#1c2d51]' ? '#1c2d51' : fee.color.replace('bg-', '') === 'bg-[#f37922]' ? '#f37922' : '#e3e438' }}>
                          {fee.price}
                        </span>
                        {fee.priceDetail && (
                          <span className="text-gray-500 ml-2 text-lg">
                            {fee.priceDetail}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`${fee.colorLight} rounded-lg p-4 border ${fee.colorBorder}`} style={{ borderColor: fee.color.replace('bg-', '') === 'bg-[#1c2d51]' ? '#1c2d51' : fee.color.replace('bg-', '') === 'bg-[#f37922]' ? '#f37922' : '#e3e438' }}>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {fee.details}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Example Calculation */}
            <motion.div
              className="bg-white rounded-2xl p-8 shadow-lg mb-16"
              variants={itemVariants}
            >
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-[#1c2d51] mb-6 text-center">
                  Example Order Breakdown
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-[#f37922] mr-3" />
                      <span className="text-gray-700">Confirmation Fee</span>
                    </div>
                    <span className="font-semibold text-[#1c2d51]">$0.30</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <Warehouse className="h-5 w-5 text-[#1c2d51] mr-3" />
                      <span className="text-gray-700">Warehouse Fee</span>
                    </div>
                    <span className="font-semibold text-[#1c2d51]">$0.30</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 text-[#e3e438]" style={{ color: '#e3e438' }} />
                      <span className="text-gray-700">Processing Fee</span>
                    </div>
                    <span className="font-semibold text-[#1c2d51]">$0.30</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-[#f37922] mr-3" />
                      <span className="text-gray-700">Service Fee</span>
                    </div>
                    <span className="font-semibold text-[#1c2d51]">$0.30</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 bg-[#1c2d51] -mx-8 -mb-8 px-8 py-6 rounded-b-2xl">
                    <span className="text-white font-bold text-lg">Total Per Order</span>
                    <span className="text-[#e3e438] font-bold text-2xl">$1.20</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div variants={itemVariants}>
              <h3 className="text-3xl font-bold text-[#1c2d51] mb-10 text-center">
                Why Choose AvolShip?
              </h3>

              <div className="grid md:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
                    >
                      <div className="w-14 h-14 bg-[#f37922]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-7 w-7 text-[#f37922]" />
                      </div>
                      <h4 className="text-xl font-bold text-[#1c2d51] mb-3">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>
    </div>
  );
}
