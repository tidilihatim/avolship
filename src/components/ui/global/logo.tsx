import { useTheme } from "next-themes";
import Link from "next/link";
import React from "react";

type Props = {
    showText?: boolean
};

const Logo = (props: Props) => {

  const {theme} = useTheme();

  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="relative w-10 h-10">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" fill="#1c2d51" />
          <path d="M20 5L35 12.5L20 20L5 12.5L20 5Z" fill="#f37922" />
          <path
            d="M20 20V35L35 27.5V12.5L20 20Z"
            fill="#1c2d51"
            opacity="0.8"
          />
          <path d="M20 20V35L5 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.6" />
        </svg>
      </div>
      {props.showText && (
        <span className="text-xl font-bold text-primary">AvolShip</span>
      )}
    </Link>
  );
};

export default Logo;
