"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight,
  TruckIcon,
  BarChart3,
  Globe,
  Shield,
  Star,
  Check,
  Globe2,
  CogIcon,
  LifeBuoyIcon,
  Eye,
  CheckCircle,
  MapPin,
  RefreshCw,
  Settings,
} from "lucide-react";

// Custom components

import CountUp from "./_components/count-up"; // You may need to create this component
import TestimonialCard from "./_components/testimonial-card"; // You may need to create this component
import ContactUsForm from "@/components/forms/contact-us-form";

export default function HomePage() {
  const t = useTranslations("home");
  const [isLoaded, setIsLoaded] = useState(false);

  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.3 });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
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

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Fashion Outlet",
      avatar: "/images/hero-person-1.png",
      rating: 5,
      content: t("testimonial1"),
    },
    {
      name: "David Chen",
      company: "Tech Gadgets Inc.",
      avatar: "/images/hero-person-2.png",
      rating: 4,
      content: t("testimonial2"),
    },
    {
      name: "Maria Rodriguez",
      company: "Home Essentials",
      avatar: "/images/hero-person-3.png",
      rating: 5,
      content: t("testimonial3"),
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden"
        style={{ opacity: heroOpacity, y: heroY }}
      >
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-primary opacity-5 blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-secondary opacity-5 blur-3xl"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary opacity-10 blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:space-x-10">
            <motion.div
              className="md:w-1/2 mb-10 md:mb-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -50 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1c2d51] mb-4 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {t("heroTitle1")}{" "}
                <span className="text-[#f37922]">{t("heroTitle2")}</span>{" "}
              </motion.h1>

              <motion.p
                className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {t("heroSubtitle")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#f37922] hover:bg-[#f37922]/90 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  {t("getStartedBtn")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3 border border-[#1c2d51]/20 hover:border-[#1c2d51]/40 text-[#1c2d51] font-medium rounded-lg transition-all hover:bg-[#1c2d51]/5"
                >
                  {t("learnMoreBtn")}
                </Link>
              </motion.div>

              
            </motion.div>

            <motion.div
              className="md:w-1/2 relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 50 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="md:relative w-full h-[400px] md:h-[500px] bg-gradient-to-br from-[#1c2d51]/5 to-[#f37922]/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="md:absolute inset-0 bg-white/40 backdrop-blur-sm rounded-2xl"></div>

                {/* Dashboard mockup */}
                <div className="md:absolute top-8 left-8 right-8 bottom-8 bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src="/images/hero3.png"
                    alt="Dashboard preview showing platform features"
                    className="w-full h-full object-cover"
                  />
                  {/* <div className="h-12 bg-[#1c2d51] flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 h-6 w-40 bg-white/20 rounded"></div>
                  </div>
                  
                  <div className="p-4 flex">
                    <div className="w-48 bg-gray-100 h-full rounded-lg p-3">
                      <div className="w-full h-8 bg-[#1c2d51]/10 mb-3 rounded"></div>
                      <div className="w-full h-6 bg-gray-200 mb-2 rounded"></div>
                      <div className="w-full h-6 bg-gray-200 mb-2 rounded"></div>
                      <div className="w-full h-6 bg-[#f37922]/20 mb-2 rounded"></div>
                      <div className="w-full h-6 bg-gray-200 mb-2 rounded"></div>
                      <div className="w-full h-6 bg-gray-200 mb-6 rounded"></div>
                      <div className="w-full h-20 bg-gray-200 rounded"></div>
                    </div>
                    
                    <div className="flex-1 pl-4">
                      <div className="flex justify-between mb-4">
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-24 bg-[#f37922] rounded"></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="h-24 bg-[#1c2d51]/5 rounded-lg p-3">
                          <div className="h-4 w-12 bg-[#1c2d51]/20 mb-2 rounded"></div>
                          <div className="h-8 w-16 bg-[#1c2d51]/30 rounded"></div>
                        </div>
                        <div className="h-24 bg-[#f37922]/5 rounded-lg p-3">
                          <div className="h-4 w-12 bg-[#f37922]/20 mb-2 rounded"></div>
                          <div className="h-8 w-16 bg-[#f37922]/30 rounded"></div>
                        </div>
                        <div className="h-24 bg-gray-100 rounded-lg p-3">
                          <div className="h-4 w-12 bg-gray-200 mb-2 rounded"></div>
                          <div className="h-8 w-16 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      
                      <div className="h-40 bg-gray-100 rounded-lg p-3 relative overflow-hidden">
                        <div className="h-4 w-32 bg-gray-200 mb-4 rounded"></div>
                        <div className="absolute bottom-3 left-3 right-3 h-24">
                          <div className="flex items-end h-full">
                            <div className="w-1/6 h-40% bg-[#1c2d51] rounded-t"></div>
                            <div className="w-1/6 h-60% bg-[#1c2d51] rounded-t ml-2"></div>
                            <div className="w-1/6 h-80% bg-[#1c2d51] rounded-t ml-2"></div>
                            <div className="w-1/6 h-50% bg-[#1c2d51] rounded-t ml-2"></div>
                            <div className="w-1/6 h-70% bg-[#1c2d51] rounded-t ml-2"></div>
                            <div className="w-1/6 h-90% bg-[#f37922] rounded-t ml-2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>

                {/* Animated elements */}
                <motion.div
                  className="absolute top-4 right-4 w-16 h-16 bg-[#f37922]/20 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />

                <motion.div
                  className="absolute bottom-16 left-6 w-10 h-10 bg-[#1c2d51]/20 rounded-full"
                  animate={{
                    y: [0, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5,
                  }}
                />
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -left-5 top-1/3 bg-white shadow-lg rounded-lg px-3 py-2 z-10" // Adjusted position
                initial={{ opacity: 0, x: -20, rotate: -5 }}
                animate={{
                  opacity: isLoaded ? 1 : 0,
                  x: isLoaded ? 0 : -20,
                  y: [0, 6, 0], // Different y-axis movement
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.2 }, // Staggered delay
                  x: { duration: 0.5, delay: 1.2 },
                  y: {
                    duration: 3.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.8,
                  },
                }}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                    {/* Replace with your GlobeIcon or similar */}
                    <Globe2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {t("multiCountrySupport")}
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="absolute -right-5 bottom-1/3 bg-white shadow-lg rounded-lg px-3 py-2 z-10" // Adjusted position
                initial={{ opacity: 0, x: 20, rotate: 3 }}
                animate={{
                  opacity: isLoaded ? 1 : 0,
                  x: isLoaded ? 0 : 20,
                  y: [0, -6, 0], // Different y-axis movement
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.4 }, // Staggered delay
                  x: { duration: 0.5, delay: 1.4 },
                  y: {
                    duration: 4.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 1.2,
                  },
                }}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-2">
                    {/* Replace with your CogIcon or similar */}
                    <CogIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {t("automatedProcessing")}
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="absolute -right-4 top-1/4 bg-white shadow-lg rounded-lg px-3 py-2 z-10"
                initial={{ opacity: 0, x: 20, rotate: 5 }}
                animate={{
                  opacity: isLoaded ? 1 : 0,
                  x: isLoaded ? 0 : 20,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.9 },
                  x: { duration: 0.5, delay: 0.9 },
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 1,
                  },
                }}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center mr-2">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {t("instantDelivery")}
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-6 bg-white shadow-lg rounded-lg px-3 py-2 z-10" // Centered top position (example)
                initial={{ opacity: 0, y: -20 }}
                animate={{
                  opacity: isLoaded ? 1 : 0,
                  y: isLoaded ? [0, 5, 0] : -20, // Vertical bob
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.6 },
                  y: {
                    duration: 3.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 1.5,
                  },
                }}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-teal-500/20 rounded-full flex items-center justify-center mr-2">
                    {/* Replace with your HeadsetIcon or similar */}
                    <LifeBuoyIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {t("dedicatedSupport")}
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="absolute -left-4 bottom-1/4 bg-white shadow-lg rounded-lg px-3 py-2 z-10"
                initial={{ opacity: 0, x: -20, rotate: -5 }}
                animate={{
                  opacity: isLoaded ? 1 : 0,
                  x: isLoaded ? 0 : -20,
                  y: [0, 8, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 1 },
                  x: { duration: 0.5, delay: 1 },
                  y: {
                    duration: 4.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5,
                  },
                }}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-[#f37922]/20 rounded-full flex items-center justify-center mr-2">
                    <Star className="h-5 w-5 text-[#f37922]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {t("realTimeTracking")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-12 md:h-16"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V69.81C57.65,65.41,165.22,31.21,321.39,56.44Z"
              className="fill-white"
            ></path>
          </svg>
        </div>
      </motion.section>

      {/* Stats Section */}
      {/* <section className="py-16 bg-white" ref={statsRef}>
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isStatsInView ? "visible" : "hidden"}
          >
            <motion.div variants={itemVariants} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1c2d51]">
                <CountUp end={15} duration={2} trigger={isStatsInView} />+
              </h3>
              <p className="text-gray-600 mt-2">{t("countries")}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-primary">
                <CountUp end={2000} duration={2} trigger={isStatsInView} />+
              </h3>
              <p className="text-gray-600 mt-2">{t("businesses")}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-primary">
                <CountUp
                  end={99.8}
                  decimals={1}
                  duration={2}
                  trigger={isStatsInView}
                />
                %
              </h3>
              <p className="text-gray-600 mt-2">{t("deliveryRate")}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-primary">
                <CountUp end={10000} duration={2} trigger={isStatsInView} />+
              </h3>
              <p className="text-gray-600 mt-2">{t("dailyDeliveries")}</p>
            </motion.div>
          </motion.div>
        </div>
      </section> */}

      {/* What is actually handled by AvolShip Section */}
      <section className="py-16 md:py-24 bg-[#f8f8f8]">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
              {t("section2Title")}
            </h2>
            <p className="text-lg text-gray-500">
              {t("section2Subtitle")}
            </p>
            <span className="inline-block mt-4 px-4 py-1.5 text-sm font-semibold text-[#e8792b] border border-[#e8792b] rounded-full">
              {t("section2Badge")}
            </span>
          </motion.div>

          {/* Cards Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 max-w-7xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {[
              { icon: "Goods Reception.svg", labelKey: "section2Item1" },
              { icon: "Controlled Storage.svg", labelKey: "section2Item2" },
              { icon: "Order Confirmation.svg", labelKey: "section2Item3" },
              { icon: "Delivery Management.svg", labelKey: "section2Item4" },
              { icon: "Get Paid on Your Deliveries.svg", labelKey: "section2Item5" },
              { icon: "Track Your Business Performance.svg", labelKey: "section2Item6" },
              { icon: "Operational Support When You Need It.svg", labelKey: "section2Item7" },
              { icon: "A team Focused on Improving Your Delivery Results.svg", labelKey: "section2Item8" },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-6 md:p-8"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="w-52 h-52 sm:w-56 sm:h-56 md:w-60 md:h-60 mb-5 relative">
                  <Image
                    src={`/icons/section2/${item.icon}`}
                    alt={t(item.labelKey)}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-lg md:text-xl font-semibold text-[#1c2d51] leading-snug max-w-[250px]">
                  {t(item.labelKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Operational Flow Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center max-w-4xl mx-auto mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
              {t("section3Title")}
            </h2>
            <p className="text-lg text-gray-500">
              {t("section3Subtitle")}
            </p>
            <span className="inline-block mt-4 px-4 py-1.5 text-sm font-semibold text-[#e8792b] border border-[#e8792b] rounded-full">
              {t("section3Badge")}
            </span>
          </motion.div>

          {/* Cards */}
          <div className="relative max-w-6xl mx-auto">
            {/* Background Design between cards */}
            <div className="hidden md:block absolute left-1/3 -translate-x-1/2 top-1/3 -translate-y-1/2 w-[900px] h-[900px] z-0 opacity-50">
              <Image
                src="/icons/section3/Background Design.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden md:block absolute left-2/3 -translate-x-1/2 top-1/3 -translate-y-1/2 w-[900px] h-[900px] z-0 opacity-50">
              <Image
                src="/icons/section3/Background Design.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 relative z-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.15 },
                },
              }}
            >
              {[
                {
                  icon: "Inbound Control.svg",
                  titleKey: "section3Card1Title",
                  descKey: "section3Card1Desc",
                },
                {
                  icon: "Execution & Tracking.svg",
                  titleKey: "section3Card2Title",
                  descKey: "section3Card2Desc",
                },
                {
                  icon: "Cash & Reporting.svg",
                  titleKey: "section3Card3Title",
                  descKey: "section3Card3Desc",
                },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  className="relative flex flex-col items-center"
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                  }}
                >
                  {/* Card - navy behind + light card on top */}
                  <div className="relative w-full flex-1">
                    {/* Navy card (behind, in natural position) */}
                    <div className="absolute inset-0 bg-[#1c2d51] rounded-2xl" />
                    {/* White card (on top, shifted left over the blue) */}
                    <div className="relative z-10 -translate-x-3 translate-y-3 rounded-2xl bg-[#f0eeee] p-8 md:p-10 text-center h-full flex flex-col justify-center">
                      <h3 className="text-xl md:text-2xl font-bold text-[#1c2d51] mb-3">
                        {t(card.titleKey)}
                      </h3>
                      <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                        {t(card.descKey)}
                      </p>
                    </div>
                  </div>

                  {/* Icon below card */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 -mt-6 relative z-10 flex-shrink-0">
                    <Image
                      src={`/icons/section3/${card.icon}`}
                      alt={t(card.titleKey)}
                      fill
                      className="object-contain"
                    />
                  </div>
              </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Where Demand Creates Opportunity Section */}
      <section className="py-16 md:py-24 bg-[#FFFFFF]">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center max-w-4xl mx-auto mb-16 md:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
              {t("section4Title")}
            </h2>
            <p className="text-lg text-gray-500">
              {t("section4Subtitle1")}
            </p>
            <p className="text-lg text-gray-500">
              {t("section4Subtitle2")}{" "}
              <span className="font-bold text-[#1c2d51]">{t("section4Country")}</span>
              {t("section4Subtitle3")}
            </p>
          </motion.div>

          {/* Market Opportunity + Map */}
          <motion.div
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            {/* Left - Market Opportunity */}
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-8">
                {t("section4MarketTitle")}
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  "section4Item1",
                  "section4Item2",
                  "section4Item3",
                  "section4Item4",
                ].map((key, index) => (
                  <motion.div
                    key={index}
                    className="bg-[#1c2d51] text-white text-center py-4 px-6 rounded-full text-base md:text-lg font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {t(key)}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right - Guinea Map */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px]">
                <Image
                  src="/icons/section4/Guinea map.svg"
                  alt="Guinea Conakry Map"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Learn More Button */}
          <motion.div
            className="text-center mt-12 md:mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Link
              href="#features"
              className="inline-block px-10 py-3 text-lg font-medium text-[#1c2d51] border-2 border-gray-300 rounded-full hover:border-[#1c2d51] transition-colors"
            >
              {t("section4LearnMore")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      {/* Features Section - Clean & Modern Alternating Layout */}
      {/* Features Section - Clean & Modern with Subtle Animations */}
      {false && <section id="features" className="py-24 bg-gray-50" ref={featuresRef}>
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center max-w-3xl mx-auto mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
              {t("featuresTitle")}
            </h2>
            <p className="text-lg text-gray-600">{t("featuresSubtitle")}</p>
          </motion.div>

          {/* Feature 1 */}
          <div className="mb-24">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Image Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative p-2 rounded-xl  overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-8   rounded-t-lg"></div>
                  <div className="relative pt-6 pb-2 px-2">
                    <img
                      src="/images/feature1.png"
                      alt="Centralized Management"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                    {/* <div className="absolute -bottom-4 -right-4 bg-[#f37922] text-white p-3 rounded-md shadow-lg z-10">
                <TruckIcon className="h-7 w-7" />
              </div> */}
                  </div>
                </div>
              </motion.div>

              {/* Content Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-semibold bg-[#f37922]/10 text-[#f37922] rounded-full">
                    {t("feature1Eyebrow")}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
                  {t("feature1Title")}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {t("feature1Desc")}
                </p>
                <div className="space-y-4">
                  {[
                    "feature1Benefit1",
                    "feature1Benefit2",
                    "feature1Benefit3",
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <span className="text-gray-700">{t(benefit)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mb-24">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              {/* Image Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative  p-2 rounded-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-8  rounded-t-lg"></div>
                  <div className="relative pt-6 pb-2 px-2">
                    <img
                      src="/images/feature2.png"
                      alt="Advanced Analytics"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                    {/* <div className="absolute -bottom-4 -left-4 bg-[#f37922] text-white p-3 rounded-md shadow-lg z-10">
                <BarChart3 className="h-7 w-7" />
              </div> */}
                  </div>
                </div>
              </motion.div>

              {/* Content Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-semibold bg-[#f37922]/10 text-[#f37922] rounded-full">
                    {t("feature2Eyebrow")}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
                  {t("feature2Title")}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {t("feature2Desc")}
                </p>
                <div className="space-y-4">
                  {[
                    "feature2Benefit1",
                    "feature2Benefit2",
                    "feature2Benefit3",
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <span className="text-gray-700">{t(benefit)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="mb-24">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Image Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative  p-2 rounded-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-8  rounded-t-lg"></div>
                  <div className="relative pt-6 pb-2 px-2">
                    <img
                      src="/images/feature3.png"
                      alt="Global Reach"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Content Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-semibold bg-[#f37922]/10 text-[#f37922] rounded-full">
                    {t("feature3Eyebrow")}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
                  {t("feature3Title")}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {t("feature3Desc")}
                </p>
                <div className="space-y-4">
                  {[
                    "feature3Benefit1",
                    "feature3Benefit2",
                    "feature3Benefit3",
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <span className="text-gray-700">{t(benefit)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="mb-24">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              {/* Image Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative p-2 rounded-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-8 rounded-t-lg"></div>
                  <div className="relative pt-6 pb-2 px-2">
                    <img
                      src="/images/feature4.png"
                      alt="Enterprise Security"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Content Side */}
              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-semibold bg-[#f37922]/10 text-[#f37922] rounded-full">
                    {t("feature4Eyebrow")}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
                  {t("feature4Title")}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {t("feature4Desc")}
                </p>
                <div className="space-y-4">
                  {[
                    "feature4Benefit1",
                    "feature4Benefit2",
                    "feature4Benefit3",
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <span className="text-gray-700">{t(benefit)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>}

      {/* About Us Section */}
      <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center max-w-3xl mx-auto mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
              {t("aboutTitle")}
            </h2>
            <p className="text-lg text-gray-600">{t("aboutSubtitle")}</p>
          </motion.div>

          {/* Mission & Vision */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Mission */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-gradient-to-br from-[#1c2d51]/5 to-[#f37922]/5 rounded-2xl p-8"
              >
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1c2d51] rounded-lg mb-4">
                    <TruckIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1c2d51] mb-4">
                    {t("missionTitle")}
                  </h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {t("missionDesc")}
                </p>
              </motion.div>

              {/* Vision */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-gradient-to-br from-[#f37922]/5 to-[#1c2d51]/5 rounded-2xl p-8"
              >
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#f37922] rounded-lg mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1c2d51] mb-4">
                    {t("visionTitle")}
                  </h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {t("visionDesc")}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Core Values */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
                {t("valuesTitle")}
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t("valuesSubtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Value 1 - Integrity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1c2d51] to-[#1c2d51]/80 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value1Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value1Desc")}
                </p>
              </motion.div>

              {/* Value 2 - Reliability */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f37922] to-[#f37922]/80 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value2Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value2Desc")}
                </p>
              </motion.div>

              {/* Value 3 - Operational Discipline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1c2d51] to-[#f37922] rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CogIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value3Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value3Desc")}
                </p>
              </motion.div>

              {/* Value 4 - Transparency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f37922] to-[#f37922]/80 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value4Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value4Desc")}
                </p>
              </motion.div>

              {/* Value 5 - Reliability */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1c2d51] to-[#1c2d51]/80 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value5Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value5Desc")}
                </p>
              </motion.div>

              {/* Value 6 - Local Presence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f37922] to-[#1c2d51] rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value6Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value6Desc")}
                </p>
              </motion.div>

              {/* Value 7 - Continuity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1c2d51] to-[#f37922] rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <RefreshCw className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value7Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value7Desc")}
                </p>
              </motion.div>

              {/* Value 8 - Control */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f37922] to-[#f37922]/80 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-[#1c2d51] mb-3">
                  {t("value8Title")}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {t("value8Desc")}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Company Story */}
          {/* <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-3xl p-8 md:p-12"
          >
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-6">
                <span className="inline-block px-4 py-2 text-sm font-semibold bg-[#f37922]/10 text-[#f37922] rounded-full mb-4">
                  {t("storyEyebrow")}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-6">
                  {t("storyTitle")}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {t("storyParagraph1")}
                  </p>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {t("storyParagraph2")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {t("storyParagraph3")}
                  </p>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-2xl font-bold text-[#1c2d51]">2024</h4>
                        <p className="text-gray-600">{t("foundedYear")}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-2xl font-bold text-[#f37922]">15+</h4>
                        <p className="text-gray-600">{t("countriesServed")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div> */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-primary mb-4"
            >
              {t("howItWorksTitle")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600"
            >
              {t("howItWorksSubtitle")}
            </motion.p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0 hidden md:block"></div>

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[1, 2, 3].map((step) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: step * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 shadow-md relative"
                >
                  <div className="h-12 w-12 rounded-full bg-[#f37922] text-white flex items-center justify-center absolute -top-6 left-1/2 transform -translate-x-1/2 shadow-md">
                    <span className="font-bold">{step}</span>
                  </div>
                  <div className="pt-8 text-center">
                    <h3 className="text-xl font-semibold text-[#1c2d51] mb-3">
                      {t(`step${step}Title`)}
                    </h3>
                    <p className="text-gray-600">{t(`step${step}Desc`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-primary mb-4"
            >
              {t("testimonialsTitle")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600"
            >
              {t("testimonialsSubtitle")}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1c2d51] mb-4">
                  {t("contactTitle")}
                </h2>
                <p className="text-lg text-gray-600">
                  {t("contactSubtitle")}
                </p>
              </div>

              <div className="space-y-6">
                {/* Response Time */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#f37922]/10 rounded-lg flex items-center justify-center">
                      <LifeBuoyIcon className="h-6 w-6 text-[#f37922]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">
                      {t("responseTimeTitle")}
                    </h3>
                    <p className="text-gray-600">
                      {t("responseTimeDesc")}
                    </p>
                  </div>
                </div>

                {/* Expert Team */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#1c2d51]/10 rounded-lg flex items-center justify-center">
                      <CogIcon className="h-6 w-6 text-[#1c2d51]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">
                      {t("expertTeamTitle")}
                    </h3>
                    <p className="text-gray-600">
                      {t("expertTeamDesc")}
                    </p>
                  </div>
                </div>

                {/* Global Support */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">
                      {t("globalSupportTitle")}
                    </h3>
                    <p className="text-gray-600">
                      {t("globalSupportDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <ContactUsForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1c2d51] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-[#f37922]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t("ctaTitle")}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#f37922] hover:bg-[#f37922]/90 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {t("startToday")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
