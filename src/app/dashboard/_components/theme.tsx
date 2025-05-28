import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const colorModes = [
  { name: "Light", value: "light", icon: Sun },
  { name: "Dark", value: "dark", icon: Moon },
];

const accentColors = [
  { name: "Default", value: "default", color: "#000000" },
  { name: "Orange", value: "orange", color: "#f97316" },
  { name: "Rose", value: "rose", color: "#e11d48" },
  { name: "Blue", value: "blue", color: "#3b82f6" },
  { name: "Green", value: "green", color: "#22c55e" },
];

const gradients = [
  {
    name: "Purpleish",
    value: "purpleish",
    gradient: "linear-gradient(to top left,#cc208e,#6713d2)",
    mode: "dark",
  },
  {
    name: "Cyanish",
    value: "cyanish",
    gradient: "linear-gradient(to top left,#4CB8C4,#3CD3AD)",
    mode: "dark",
  },
  {
    name: "Yellowish",
    value: "yellowish",
    gradient: "linear-gradient(to top left,#ffe259,#ffa751)",
    mode: "dark",
  },
  {
    name: "Maronish",
    value: "maronish",
    gradient: "linear-gradient(to top left,#870000,#190A05)",
    mode: "dark",
  },
  {
    name: "lightish",
    value: "lightish",
    gradient: "linear-gradient(to top left,#091E3A,#2F80ED,#2D9EE0)",
    mode: "light",
  },
  {
    name: "Lightish-Pink",
    value: "lightish-pink",
    gradient: "linear-gradient(to top left,#1F1C2C,#928DAB)",
    mode: "light",
  },
  {
    name: "Lightish-Blue",
    value: "lightish-blue",
    gradient: "linear-gradient(to top left,#232526,#414345)",
    mode: "light",
  },
  {
    name: "Darkish-Blue",
    value: "darkish-blue",
    gradient: "linear-gradient(to top left,#0052D4,#4364F7,#6FB1FC)",
    mode: "dark",
  },
  {
    name: "Darkish-Purple",
    value: "darkish-purple",
    gradient: "linear-gradient(to top left,#403B4A,#E7E9BB)",
    mode: "dark",
  },
  {
    name: "Darkish",
    value: "darkish",
    gradient: "linear-gradient(to top left,#c21500,#ffc500)",
    mode: "dark",
  },
];

interface ThemeSettings {
  theme: string;
  mode: string;
}

const THEME_STORAGE_KEY = "my-app-theme-settings";

export default function ModeToggle() {
  const { setTheme } = useTheme();
  const [themeSettings, setThemeSettings] = React.useState<ThemeSettings>({
    theme: "default",
    mode: "light",
  });

  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme) as ThemeSettings;
        console.log("Loaded theme from localStorage:", parsedTheme);
        setThemeSettings(parsedTheme);
        applyTheme(parsedTheme);
      } catch (error) {
        console.error("Failed to parse saved theme:", error);
      }
    }
  }, []);

  const saveThemeToLocalStorage = (settings: ThemeSettings) => {
    try {
      const themeString = JSON.stringify(settings);
      console.log("Saving theme to localStorage:", themeString);
      localStorage.setItem(THEME_STORAGE_KEY, themeString);
    } catch (error) {
      console.error("Failed to save theme to localStorage:", error);
    }
  };

  const applyTheme = (settings: ThemeSettings) => {
    console.log("Applying theme:", settings);
    const root = window.document.documentElement;
    const { theme, mode } = settings;

    // Remove existing theme classes
    root.classList.remove(
      ...colorModes.map((mode) => mode.value),
      ...accentColors.map((color) => `theme-${color.value}`),
      ...gradients.map((gradient) => `theme-${gradient.value}`)
    );

    if (colorModes.map((mode) => mode.value).includes(theme)) {
      // Changing color mode
      root.classList.add(theme);
      setTheme(theme);
    } else if (gradients.some((gradient) => gradient.value === theme)) {
      // Applying gradient theme
      root.classList.add(`theme-${theme}`);
      root.classList.add(mode);
      setTheme(mode);
    } else {
      // Changing accent color
      root.classList.add(`theme-${theme}`);
      root.classList.add(mode);
      setTheme(mode);
    }
  };

  const handleThemeChange = (newTheme: string, newMode?: string) => {
    const updatedSettings: ThemeSettings = {
      theme: newTheme,
      mode:
        newMode ||
        (newTheme === "light" || newTheme === "dark"
          ? newTheme
          : themeSettings.mode),
    };
    console.log("Handling theme change:", updatedSettings);
    setThemeSettings(updatedSettings);
    applyTheme(updatedSettings);
    saveThemeToLocalStorage(updatedSettings);
  };

  const CurrentModeIcon =
    colorModes.find((mode) => mode.value === themeSettings.mode)?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-10 h-10">
          <CurrentModeIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled className="font-semibold">
          Accent Color
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {accentColors.map((color) => (
          <DropdownMenuItem
            key={color.value}
            onClick={() => handleThemeChange(color.value, themeSettings.mode)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: color.color }}
              ></div>
              <span>{color.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="font-semibold">
          Gradients
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex gap-2 flex-wrap">
          {gradients.map((gradient) => (
            <DropdownMenuItem
              key={gradient.value}
              onClick={() => handleThemeChange(gradient.value, gradient.mode)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: gradient.gradient }}
                ></div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="font-semibold">
          Choose theme
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {colorModes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => handleThemeChange(mode.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{mode.name}</span>
            <mode.icon className="h-4 w-4" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
